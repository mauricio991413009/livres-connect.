-- =====================================================================
-- Livres Connect · migração 0007 · novos perfis
--
-- Só acrescenta os valores. Fica num arquivo separado porque o Postgres
-- não deixa usar um valor novo de enum na mesma transação em que ele foi
-- criado; as regras que usam esses perfis estão na migração 0008.
-- =====================================================================
alter type public.perfil add value if not exists 'pastora' after 'pastor';
alter type public.perfil add value if not exists 'obreiro' after 'lider';
alter type public.perfil add value if not exists 'missionario' after 'obreiro';
alter type public.perfil add value if not exists 'evangelista' after 'missionario';
