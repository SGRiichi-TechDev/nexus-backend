-- ============================================================
-- Migration: rename_country_city_lookups
-- Applied remotely 2026-09-13 via MCP. This file exists so the
-- local migration history matches remote.
--
-- Align with the existing uma_positional_lookup / uma_floating_lookup
-- naming. Constraints and indexes are renamed too so the schema does
-- not carry stale names that no longer match their table.
-- ============================================================

alter table country rename to country_lookup;
alter table city    rename to city_lookup;

alter index  country_pkey               rename to country_lookup_pkey;
alter index  country_name_key           rename to country_lookup_name_key;
alter index  city_pkey                  rename to city_lookup_pkey;
alter index  city_country_code_name_key rename to city_lookup_country_code_name_key;
alter index  idx_city_country           rename to idx_city_lookup_country;

alter table city_lookup
    rename constraint city_country_code_fkey to city_lookup_country_code_fkey;

alter table event_info
    rename constraint event_info_country_code_fkey to event_info_country_code_lookup_fkey;
alter table event_info
    rename constraint event_info_city_code_fkey to event_info_city_code_lookup_fkey;
