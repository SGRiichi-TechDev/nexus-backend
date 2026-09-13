-- ============================================================
-- Migration: event_result_allow_manual_nulls
-- Applied remotely 2026-09-13 via MCP. This file exists so the
-- local migration history matches remote.
--
-- total_score, net_score and position_counts were NOT NULL, which
-- assumed every row is computed by the pipeline from game_result.
-- Manually acquired results (overseas events, and local tournaments
-- where only final standings were supplied) legitimately have none
-- of these. Relax the NOT NULLs, then enforce them only for rows
-- the pipeline produces.
-- ============================================================

alter table event_result
    alter column total_score     drop not null,
    alter column net_score       drop not null,
    alter column position_counts drop not null;

alter table event_result
    add constraint event_result_derived_requires_scores
    check (
        source <> 'derived'
        or (total_score is not null
            and net_score is not null
            and position_counts is not null)
    );

comment on constraint event_result_derived_requires_scores on event_result is
    'Derived rows must carry full scoring detail. Manual rows may omit it: external organisers supply final standings only.';
