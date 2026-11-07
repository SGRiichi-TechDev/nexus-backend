-- ============================================================
-- Migration: event_info_status_and_selectable
-- Applied remotely 2026-09-12 via MCP. This file exists so the
-- local migration history matches remote.
--
-- Restores the control flag the legacy `mode` table carried,
-- split into lifecycle (status) and bot visibility (is_selectable).
-- ============================================================

create type event_status_enum as enum (
    'draft',
    'active',
    'closed'
);

alter table event_info
    add column status        event_status_enum not null default 'draft',
    add column is_selectable boolean           not null default false;

comment on column event_info.status is
    'Lifecycle. draft = being set up, active = games count toward standings, closed = finished. Independent of is_selectable.';

comment on column event_info.is_selectable is
    'Controls the bot picker ONLY. Filters the dropdown query — never the insert path. An admin backfilling a game into a closed event must still succeed.';

create index idx_event_info_selectable
    on event_info(is_selectable) where is_selectable;
