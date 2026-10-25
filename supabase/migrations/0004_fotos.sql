-- =====================================================================
-- Livres Connect · migração 0004 · fotos das pessoas
--
-- Cria a pasta privada "fotos" no Storage do Supabase. Cada foto fica em
-- <igreja_id>/<pessoa_id>.jpg e só a equipe daquela igreja consegue ver.
-- (Só roda no Supabase; os testes locais não simulam o Storage.)
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos', 'fotos', false, 2097152, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

-- Primeira pasta do caminho = igreja (só aceita formato de UUID)
create or replace function public.igreja_do_arquivo(p_nome text)
returns uuid language sql immutable as $$
  select case when split_part(p_nome, '/', 1) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
              then split_part(p_nome, '/', 1)::uuid end;
$$;

create policy fotos_ver on storage.objects for select to authenticated
  using (bucket_id = 'fotos'
         and public.tem_perfil(public.igreja_do_arquivo(name), '{pastor,presbiterio,secretaria,lider}'));
create policy fotos_enviar on storage.objects for insert to authenticated
  with check (bucket_id = 'fotos'
         and public.tem_perfil(public.igreja_do_arquivo(name), '{pastor,secretaria}'));
create policy fotos_trocar on storage.objects for update to authenticated
  using (bucket_id = 'fotos'
         and public.tem_perfil(public.igreja_do_arquivo(name), '{pastor,secretaria}'))
  with check (bucket_id = 'fotos'
         and public.tem_perfil(public.igreja_do_arquivo(name), '{pastor,secretaria}'));
create policy fotos_apagar on storage.objects for delete to authenticated
  using (bucket_id = 'fotos'
         and public.tem_perfil(public.igreja_do_arquivo(name), '{pastor,secretaria}'));
