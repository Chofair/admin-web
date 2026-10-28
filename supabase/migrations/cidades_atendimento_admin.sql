-- Permite que administradores gerenciem cidades_atendimento pelo painel (/cidades).
-- A leitura já é coberta pela policy existente cidades_atendimento_read (select, authenticated, using true).
-- As policies abaixo são aditivas e liberam apenas escrita para administradores.
alter table public.cidades_atendimento enable row level security;

drop policy if exists "Admins podem cadastrar cidades de atendimento" on public.cidades_atendimento;
create policy "Admins podem cadastrar cidades de atendimento" on public.cidades_atendimento
  for insert with check (
    exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.is_admin = true)
  );

drop policy if exists "Admins podem atualizar cidades de atendimento" on public.cidades_atendimento;
create policy "Admins podem atualizar cidades de atendimento" on public.cidades_atendimento
  for update using (
    exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.is_admin = true)
  ) with check (
    exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.is_admin = true)
  );

drop policy if exists "Admins podem excluir cidades de atendimento" on public.cidades_atendimento;
create policy "Admins podem excluir cidades de atendimento" on public.cidades_atendimento
  for delete using (
    exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.is_admin = true)
  );
