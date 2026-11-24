-- Permite que administradores gerenciem cidades_atendimento pelo painel (/cidades).
-- A leitura já é coberta pela policy existente cidades_atendimento_read (select, authenticated, using true).
-- As policies abaixo são aditivas e liberam apenas escrita para administradores.
-- Canonical app migration: 20261124140000_city_admin_write_permissions.sql.
alter table public.cidades_atendimento enable row level security;
grant insert, update, delete on public.cidades_atendimento to authenticated;

drop policy if exists "Admins podem cadastrar cidades de atendimento" on public.cidades_atendimento;
create policy "Admins podem cadastrar cidades de atendimento" on public.cidades_atendimento
  for insert to authenticated with check (
    exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.is_admin = true)
  );

drop policy if exists "Admins podem atualizar cidades de atendimento" on public.cidades_atendimento;
create policy "Admins podem atualizar cidades de atendimento" on public.cidades_atendimento
  for update to authenticated using (
    exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.is_admin = true)
  ) with check (
    exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.is_admin = true)
  );

drop policy if exists "Admins podem excluir cidades de atendimento" on public.cidades_atendimento;
create policy "Admins podem excluir cidades de atendimento" on public.cidades_atendimento
  for delete to authenticated using (
    exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.is_admin = true)
  );
