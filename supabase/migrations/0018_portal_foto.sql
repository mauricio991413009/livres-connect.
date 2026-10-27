-- Foto da carteirinha no Portal do Membro.
-- O Portal não tem login (só o link secreto), então não consegue ler o bucket
-- privado "fotos". Guardamos uma miniatura pequena (JPEG, data URL) na própria
-- pessoa, gerada pelo navegador quando a equipe envia a foto, e a entregamos
-- só a quem tem o link válido.
alter table public.pessoas add column if not exists foto_mini text;
alter table public.pessoas drop constraint if exists pessoas_foto_mini_ck;
alter table public.pessoas add constraint pessoas_foto_mini_ck
  check (foto_mini is null or (foto_mini like 'data:image/jpeg;base64,%' and length(foto_mini) <= 60000));

create or replace function public.portal_foto(p_token text)
returns text language plpgsql stable security definer set search_path = public as $$
declare v pessoas%rowtype;
begin
  v := portal_exigir(p_token);
  return v.foto_mini;
end $$;
revoke execute on function public.portal_foto(text) from public;
grant execute on function public.portal_foto(text) to anon, authenticated;
