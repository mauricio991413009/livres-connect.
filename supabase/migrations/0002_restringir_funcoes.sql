-- =====================================================================
-- Livres Connect · migração 0002 · restringe quem pode chamar as funções
--
-- As funções de gatilho (triggers) e de apoio às regras de acesso não
-- devem ser chamadas diretamente pela API. Os gatilhos continuam
-- funcionando normalmente; as funções de apoio continuam disponíveis
-- apenas para usuários logados, porque as regras de acesso dependem delas.
-- =====================================================================

-- Funções de gatilho: ninguém chama pela API
revoke execute on function public.registrar_auditoria()     from public, anon, authenticated;
revoke execute on function public.proteger_status_igreja()  from public, anon, authenticated;
revoke execute on function public.proteger_ultimo_pastor()  from public, anon, authenticated;
revoke execute on function public.ao_mudar_conta()          from public, anon, authenticated;
revoke execute on function public.ao_criar_convite()        from public, anon, authenticated;

-- Funções de apoio às regras de acesso: só para usuários logados
revoke execute on function public.eh_admin()                              from public, anon;
revoke execute on function public.tem_perfil(uuid, public.perfil[])       from public, anon;
revoke execute on function public.lidera_pessoa(uuid, uuid)               from public, anon;
revoke execute on function public.pode_ver_pessoa(uuid, uuid)             from public, anon;
revoke execute on function public.pode_editar_pessoa(uuid, uuid)          from public, anon;
revoke execute on function public.pode_ver_anotacao(uuid, uuid)           from public, anon;
revoke execute on function public.pode_ver_usuario(uuid)                  from public, anon;
grant  execute on function public.eh_admin()                              to authenticated;
grant  execute on function public.tem_perfil(uuid, public.perfil[])       to authenticated;
grant  execute on function public.lidera_pessoa(uuid, uuid)               to authenticated;
grant  execute on function public.pode_ver_pessoa(uuid, uuid)             to authenticated;
grant  execute on function public.pode_editar_pessoa(uuid, uuid)          to authenticated;
grant  execute on function public.pode_ver_anotacao(uuid, uuid)           to authenticated;
grant  execute on function public.pode_ver_usuario(uuid)                  to authenticated;

-- Funções criadas no futuro não ficam abertas para visitantes por padrão
alter default privileges in schema public revoke execute on functions from public, anon;
