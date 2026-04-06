---
name: Storage abstrato multi-provider
description: StorageService com provider pattern (Supabase + R2 stub), tabela files, bucket company-files, Edge Function generate-upload-url
type: feature
---

## Arquitetura
- Tabela `files`: registra metadata de cada arquivo (company_id, path, provider, file_type, size_bytes, mime_type, thumbnail_path)
- Bucket `company-files`: privado, RLS por company_id no path
- Edge Function `generate-upload-url`: valida limites do plano, gera signed URL, insere registro
- StorageService factory em `src/services/storage/StorageService.ts`
- Providers: `SupabaseStorageProvider` (ativo), `R2StorageProvider` (stub)
- Variável `VITE_STORAGE_PROVIDER` controla o provider (default: supabase)

## Path structure
`/{company_id}/{images|videos|documents}/{uuid}.{ext}`

## Componentes
- `FileUpload` em `src/components/storage/FileUpload.tsx` — drag-and-drop + click
- `useFileUpload` hook em `src/hooks/useFileUpload.ts`

## Segurança
- Bucket privado, URLs assinadas (1h)
- RLS na tabela files e storage.objects isolando por company_id
- Edge Function valida storage limits do plano antes de permitir upload
