

# Pascomfy — Storage Abstrato com Thumbnails e Limites por Plano

## Resumo

Criar tabela `files` com metadata, bucket Supabase Storage com RLS, Edge Function para upload híbrido (signed URL + thumbnail generation), e um StorageService abstrato no frontend com provider pattern preparado para R2.

## Arquitetura

```text
┌─────────────────────────────────────────────┐
│  Frontend                                    │
│  FileUpload component → StorageService       │
│                          ├─ SupabaseProvider │
│                          └─ R2Provider (fut) │
└──────────┬──────────────────────────────────┘
           │ 1. Request signed URL
           ▼
┌──────────────────────────┐
│  Edge Function            │
│  generate-upload-url      │
│  - valida company limits  │
│  - gera signed URL        │
│  - cria thumbnail (img)   │
│  - insere registro files  │
└──────────────────────────┘
           │
           ▼
┌──────────────────────────┐
│  Supabase Storage         │
│  bucket: company-files    │
│  path: /{company_id}/...  │
└──────────────────────────┘
```

## 1. Migração SQL

### Tabela `files`

```sql
CREATE TABLE public.files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  name text NOT NULL,
  path text NOT NULL,
  provider text NOT NULL DEFAULT 'supabase',
  file_type text NOT NULL DEFAULT 'documento',
  size_bytes bigint NOT NULL DEFAULT 0,
  mime_type text NOT NULL,
  thumbnail_path text,
  uploaded_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

- `provider`: 'supabase' | 'r2' (text, sem enum para flexibilidade)
- `file_type`: 'imagem' | 'video' | 'documento'
- `thumbnail_path`: path da thumbnail gerada (null se não aplicável)

### Índices
- `company_id`
- `uploaded_by`
- `(company_id, file_type)` para filtrar por tipo

### RLS
- Members SELECT own company files
- User INSERT own files (uploaded_by = auth.uid())
- User DELETE own files
- Admin DELETE company files
- Super admin ALL

### Storage Bucket

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('company-files', 'company-files', false, 104857600);
```

- Bucket privado (URLs assinadas)
- Limite padrão 100MB (controle real via Edge Function baseado no plano)
- RLS no `storage.objects`: isolamento por company_id no path

## 2. Edge Function: `generate-upload-url`

### Responsabilidades
1. Valida JWT do usuário
2. Consulta `get_company_limits()` para verificar storage disponível
3. Valida tipo e tamanho do arquivo contra o plano
4. Gera signed upload URL via Supabase Storage API
5. Insere registro na tabela `files`
6. Retorna signed URL + file ID

### Endpoint
- POST: `{ fileName, mimeType, sizeBytes, companyId, fileType }`
- Response: `{ fileId, signedUrl, path }`

## 3. Edge Function: `process-upload` (webhook/trigger)

### Para thumbnails
- Recebe notificação após upload completo
- Se imagem: redimensiona para 200x200 usando sharp/canvas
- Salva thumbnail em `/{company_id}/thumbnails/...`
- Atualiza `files.thumbnail_path`

**Nota**: Thumbnails serão gerados via Edge Function invocada após o upload, não inline. Simplifica o fluxo e não bloqueia o upload.

## 4. StorageService (Frontend)

### Interface

```typescript
// src/services/storage/types.ts
interface StorageProvider {
  getUploadUrl(params: UploadParams): Promise<UploadUrlResult>;
  getFileUrl(path: string): Promise<string>;
  deleteFile(fileId: string): Promise<void>;
}

interface UploadParams {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  companyId: string;
  fileType: 'imagem' | 'video' | 'documento';
}
```

### Providers

```text
src/services/storage/
  types.ts              — interfaces
  StorageService.ts     — factory que escolhe provider
  providers/
    supabase.ts         — SupabaseStorageProvider
    r2.ts               — R2StorageProvider (stub)
```

### Factory

```typescript
// StorageService.ts
const provider = import.meta.env.VITE_STORAGE_PROVIDER || 'supabase';

export const storageService: StorageProvider =
  provider === 'r2'
    ? new R2StorageProvider()
    : new SupabaseStorageProvider();
```

### SupabaseStorageProvider
- `getUploadUrl()`: chama Edge Function `generate-upload-url`, faz upload direto via fetch para signed URL
- `getFileUrl()`: gera URL assinada via `supabase.storage.createSignedUrl()`
- `deleteFile()`: remove do storage + deleta registro `files`

### R2StorageProvider (stub)
- Métodos retornam `throw new Error('R2 not implemented yet')`
- Estrutura pronta para implementar com S3-compatible SDK

## 5. Componente FileUpload

```text
src/components/storage/
  FileUpload.tsx        — drag-and-drop + click upload
  FilePreview.tsx       — preview com thumbnail
```

### FileUpload.tsx
- Aceita `companyId`, `fileType`, `onUploadComplete` como props
- Drag-and-drop zone com feedback visual
- Progress bar durante upload
- Validação client-side de tipo e tamanho antes de enviar
- Mobile-first: botões grandes (min 44px)
- Usa `storageService.getUploadUrl()` + fetch PUT para signed URL

### Hook: `useFileUpload`
- Estado: uploading, progress, error
- Lógica de upload com retry
- Invalidação de cache React Query após sucesso

## 6. Variáveis de Ambiente

Adicionar ao `.env`:
```
VITE_STORAGE_PROVIDER=supabase
```

## Segurança

- Bucket privado: sem acesso público, sempre via signed URLs
- RLS na tabela `files`: isolamento por company_id
- RLS no `storage.objects`: path deve conter company_id do usuário
- Edge Function valida limites do plano antes de permitir upload
- Signed URLs com expiração curta (1h upload, 1h download)

## Ordem de Execução

1. Migração SQL (tabela files + bucket + RLS)
2. Edge Function `generate-upload-url`
3. StorageService + providers (frontend)
4. Hook `useFileUpload`
5. Componente FileUpload
6. Atualizar memória do projeto

