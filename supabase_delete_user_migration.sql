-- Permite que o próprio usuário logado exclua a conta (exigência da App Store
-- e do Google Play). Roda como security definer porque o client não tem
-- permissão de apagar linhas em auth.users; o filtro por auth.uid() garante
-- que cada um só consegue apagar a si mesmo.
create or replace function public.delete_user()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from auth.users where id = auth.uid();
$$;

revoke execute on function public.delete_user() from public, anon;
grant execute on function public.delete_user() to authenticated;
