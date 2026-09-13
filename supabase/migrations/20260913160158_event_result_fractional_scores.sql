-- ============================================================
-- Migration: event_result_fractional_scores
-- Applied remotely 2026-09-13 via MCP. This file exists so the
-- local migration history matches remote.
--
-- total_score and net_score were int4, which assumed every score is
-- a whole number. That holds for scores the pipeline derives from
-- game_result, but not for manually acquired tournament standings:
-- some organisers halve scores after a cut, and 106 of 532 historical
-- tournament scores carry one decimal place (-606.5, 404.5, .1-.9).
--
-- numeric(10,1) fits the observed data exactly and avoids the
-- rounding surprises a float would introduce in standings.
--
-- game_result.final_score is deliberately NOT changed: per-game scores
-- come from the bot and are always whole.
-- ============================================================

alter table event_result
    alter column total_score type numeric(10,1),
    alter column net_score   type numeric(10,1);

comment on column event_result.total_score is
    'Cumulative score across the event. numeric(10,1): manual results from external organisers can be fractional (scores halved after a cut). Derived rows will always be whole.';
