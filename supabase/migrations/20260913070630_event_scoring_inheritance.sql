-- ============================================================
-- Migration: event_scoring_inheritance
-- Applied remotely 2026-09-13 via MCP. This file exists so the
-- local migration history matches remote.
--
-- Lets an event declare its scoring method so the bot can skip
-- the prompt. NULL = ask the recorder, NOT NULL = locked.
--
-- Precedence for resolving a game's scoring config:
--     game_info -> event_info -> ruleset_info -> prompt
--
-- Positional uma is NOT duplicated onto event_info: it is already
-- reachable via event_info.ruleset_id -> ruleset_info.positional_uma_id.
-- ============================================================

alter table event_info
    add column calculation_method uma_calculation_method,
    add column floating_scheme_id integer;

comment on column event_info.calculation_method is
    'Scoring method for games in this event. NULL = recorder is prompted per game. NOT NULL = bot does not render the choice. Enforced at application layer only; no DB constraint stops a direct write from deviating.';

comment on column event_info.floating_scheme_id is
    'Floating uma scheme. Deliberately NOT a foreign key: uma_floating_lookup is keyed on (floating_uma_id, float_count), and float_count is a game OUTCOME, unknowable at event/game setup. A real FK requires splitting scheme identity into its own header table. Deferred until floating uma is actually implemented.';

-- floating_scheme_id is meaningless unless the method is floating
alter table event_info
    add constraint event_info_floating_scheme_requires_method
    check (
        floating_scheme_id is null
        or calculation_method = 'floating'
    );

-- This FK is valid: uma_positional_lookup's PK is single-column.
-- Verified zero orphan rows across 11,426 games.
alter table game_info
    add constraint game_info_positional_uma_id_fkey
    foreign key (positional_uma_id)
    references uma_positional_lookup(positional_uma_id);
