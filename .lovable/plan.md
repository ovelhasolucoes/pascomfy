

# Corrigir Branding do SuperAdmin: Cores Padrão + Upload de Logo

## Problemas Identificados

1. **Cores padrão erradas**: A migration seed e os defaults no componente usam `#7c3aed` (roxo antigo) em vez de `#c4a983` (bege dourado da nova paleta)
2. **Logo/Favicon por URL**: Os campos pedem URL em vez de permitir upload de arquivo

---

## Plano de Implementação

### 1. Atualizar cores padrão no componente

**Arquivo**: `src/pages/superadmin/SuperAdminSettings.tsx`

Trocar todos os fallbacks de cor no `BrandingTab`:
- `primary_color`: `#7c3aed` → `#c4a983`
- `secondary_color`: `#6d28d9` → `#8b7355`
- `pwa_theme_color`: `#7c3aed` → `#c4a983`
- `pwa_bg_color`: `#0f172a` → `#1A1816`

### 2. Migration para atualizar valores no banco

Criar migration SQL para corrigir os valores já inseridos:
```sql
UPDATE platform_settings SET value = jsonb_set(value, ...) WHERE key = 'branding';
UPDATE platform_settings SET value = jsonb_set(value, ...) WHERE key = 'pwa';
```

Atualizar as cores para a nova paleta `#c4a983`.

### 3. Criar bucket de storage para assets da plataforma

Migration para criar bucket `platform-assets` (público) com RLS para super_admin:
```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('platform-assets', 'platform-assets', true);
```

### 4. Substituir inputs de URL por componentes de upload

**Arquivo**: `src/pages/superadmin/SuperAdminSettings.tsx`

Para os campos "Logo" e "Favicon":
- Criar um componente inline `ImageUploadField` que:
  - Mostra preview da imagem atual (se houver URL)
  - Tem botão "Enviar imagem" que abre file picker
  - Faz upload para o bucket `platform-assets` via Supabase Storage
  - Retorna a URL pública automaticamente
- Aceitar `image/*`, max 2MB
- Manter o campo de texto como fallback (URL externa) mas com o upload como opção principal

### 5. Mesmo tratamento para campo "Imagem de Fundo" na aba Login

O `background_url` na aba Login também deve ter opção de upload.

---

## Arquivos Afetados

| Arquivo | Mudança |
|---------|---------|
| `src/pages/superadmin/SuperAdminSettings.tsx` | Cores padrão + upload de imagem |
| Nova migration SQL | Atualizar seed + criar bucket |

