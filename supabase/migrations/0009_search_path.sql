-- Livres Connect · migração 0009 · fixa o search_path de duas funções auxiliares
-- (recomendação do verificador de segurança do Supabase)
alter function public.perfis_lideranca() set search_path = public;
do $$ begin
  -- igreja_do_arquivo só existe onde a migração 0004 (Storage) rodou
  if to_regprocedure('public.igreja_do_arquivo(text)') is not null then
    alter function public.igreja_do_arquivo(text) set search_path = public;
  end if;
end $$;
