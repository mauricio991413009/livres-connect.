-- Livres Connect · migração 0009 · fixa o search_path de duas funções auxiliares
-- (recomendação do verificador de segurança do Supabase)
alter function public.perfis_lideranca() set search_path = public;
alter function public.igreja_do_arquivo(text) set search_path = public;
