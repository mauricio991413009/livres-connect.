-- =====================================================================
-- Livres Connect · migração 0006 · comprovantes financeiros
--
-- Pasta privada "comprovantes" no Storage: <igreja_id>/<lancamento_id>.<ext>
-- Só pastor e tesouraria enviam; presbitério também consegue ver.
-- (Só roda no Supabase; os testes locais não simulam o Storage.)
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('comprovantes', 'comprovantes', false, 5242880,
        array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do nothing;

create policy comprovantes_ver on storage.objects for select to authenticated
  using (bucket_id = 'comprovantes'
         and public.tem_perfil(public.igreja_do_arquivo(name), '{pastor,presbiterio,tesouraria}'));
create policy comprovantes_enviar on storage.objects for insert to authenticated
  with check (bucket_id = 'comprovantes'
         and public.tem_perfil(public.igreja_do_arquivo(name), '{pastor,tesouraria}'));
create policy comprovantes_trocar on storage.objects for update to authenticated
  using (bucket_id = 'comprovantes'
         and public.tem_perfil(public.igreja_do_arquivo(name), '{pastor,tesouraria}'))
  with check (bucket_id = 'comprovantes'
         and public.tem_perfil(public.igreja_do_arquivo(name), '{pastor,tesouraria}'));
create policy comprovantes_apagar on storage.objects for delete to authenticated
  using (bucket_id = 'comprovantes'
         and public.tem_perfil(public.igreja_do_arquivo(name), '{pastor,tesouraria}'));
