-- ============================================================
-- Migration: event_info_country
-- Applied remotely 2026-09-13 via MCP. This file exists so the
-- local migration history matches remote.
--
-- `scale` describes WHO an event is for (local residents / a region /
-- the world). It does NOT say where the event sits relative to us.
-- A monthly in Osaka for Japanese regulars and a Little Cup in
-- Singapore are both scale='local', but only one is a home event.
--
-- NOTE: this column is superseded by country_code in the next
-- migration (country_city_lookups). Kept in history for accuracy.
-- ============================================================

alter table event_info
    add column country text;

comment on column event_info.country is
    'Country the event was held in. Home events are ''Singapore''. Orthogonal to scale.';

create index idx_event_info_country on event_info(country);
