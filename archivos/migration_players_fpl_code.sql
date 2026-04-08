-- Foto oficial FPL: usa el campo `code` del bootstrap (p{code}.png en el CDN).
alter table players add column if not exists fpl_code integer;

comment on column players.fpl_code is 'Premier League player "code" from FPL bootstrap-static elements[].code; used for headshot URLs.';
