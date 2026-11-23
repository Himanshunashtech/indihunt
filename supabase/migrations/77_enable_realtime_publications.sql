-- Ensure the supabase_realtime publication exists (Supabase's default publication for Realtime)
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end;
$$;

-- Enable Realtime replication for the tables that require real-time synchronization
alter publication supabase_realtime add table products;
alter publication supabase_realtime add table comments;
alter publication supabase_realtime add table upvotes;
alter publication supabase_realtime add table comment_upvotes;
