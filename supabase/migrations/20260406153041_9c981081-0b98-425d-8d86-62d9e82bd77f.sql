
-- Tabela files
CREATE TABLE public.files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  path text NOT NULL,
  provider text NOT NULL DEFAULT 'supabase',
  file_type text NOT NULL DEFAULT 'documento',
  size_bytes bigint NOT NULL DEFAULT 0,
  mime_type text NOT NULL,
  thumbnail_path text,
  uploaded_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_files_company_id ON public.files(company_id);
CREATE INDEX idx_files_uploaded_by ON public.files(uploaded_by);
CREATE INDEX idx_files_company_type ON public.files(company_id, file_type);

-- RLS policies
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view company files"
ON public.files FOR SELECT TO authenticated
USING (
  is_active_user(auth.uid())
  AND company_id = get_user_company_id(auth.uid())
);

CREATE POLICY "User inserts own files"
ON public.files FOR INSERT TO authenticated
WITH CHECK (
  uploaded_by = auth.uid()
  AND company_id = get_user_company_id(auth.uid())
);

CREATE POLICY "User deletes own files"
ON public.files FOR DELETE TO authenticated
USING (
  uploaded_by = auth.uid()
  AND company_id = get_user_company_id(auth.uid())
);

CREATE POLICY "Admin deletes company files"
ON public.files FOR DELETE TO authenticated
USING (
  has_role(auth.uid(), 'admin')
  AND company_id = get_user_company_id(auth.uid())
);

CREATE POLICY "Super admin manages all files"
ON public.files FOR ALL TO authenticated
USING (has_role(auth.uid(), 'super_admin'))
WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- Bucket privado
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('company-files', 'company-files', false, 104857600);

-- Storage RLS: upload
CREATE POLICY "Company members upload files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'company-files'
  AND (storage.foldername(name))[1] = get_user_company_id(auth.uid())::text
);

-- Storage RLS: download
CREATE POLICY "Company members download files"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'company-files'
  AND (storage.foldername(name))[1] = get_user_company_id(auth.uid())::text
);

-- Storage RLS: delete own
CREATE POLICY "Users delete own storage objects"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'company-files'
  AND (storage.foldername(name))[1] = get_user_company_id(auth.uid())::text
);

-- Storage RLS: super admin full access
CREATE POLICY "Super admin manages all storage"
ON storage.objects FOR ALL TO authenticated
USING (
  bucket_id = 'company-files'
  AND has_role(auth.uid(), 'super_admin')
)
WITH CHECK (
  bucket_id = 'company-files'
  AND has_role(auth.uid(), 'super_admin')
);
