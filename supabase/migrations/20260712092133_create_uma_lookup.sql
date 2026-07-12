-- Migration: create uma_lookup
-- Reference/catalog table of uma (score adjustment) configurations.
-- Referenced by ruleset.uma_id (FK to be added when ruleset is migrated).

CREATE TABLE public.uma_lookup (
    uma_id            smallint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    uma_p1            int NOT NULL,
    uma_p2            int NOT NULL,
    uma_p3            int NOT NULL,
    uma_p4            int NOT NULL,

    description       text NOT NULL,
    category          text NOT NULL,
    purpose           text,
    status            boolean NOT NULL DEFAULT true,

    -- generated / derived — never written to directly, cannot drift
    total_uma         int GENERATED ALWAYS AS
                          (uma_p1 + uma_p2 + uma_p3 + uma_p4) STORED,

    first_place_gap   int GENERATED ALWAYS AS
                          (uma_p1 - uma_p2) STORED,

    middle_place_gap  int GENERATED ALWAYS AS
                          (uma_p2 - uma_p3) STORED,

    last_place_gap    int GENERATED ALWAYS AS
                          (uma_p3 - uma_p4) STORED,

    play_style        text GENERATED ALWAYS AS (
        CASE
            WHEN (uma_p1 - uma_p2) = (uma_p2 - uma_p3)
             AND (uma_p2 - uma_p3) = (uma_p3 - uma_p4)
                THEN 'Equal Positional Emphasis'
            WHEN (uma_p1 - uma_p2) = (uma_p3 - uma_p4)
             AND (uma_p1 - uma_p2) > (uma_p2 - uma_p3)
                THEN 'Barbell Emphasis'
            WHEN (uma_p2 - uma_p3) > (uma_p1 - uma_p2)
             AND (uma_p2 - uma_p3) > (uma_p3 - uma_p4)
                THEN 'Middle Split Emphasis'
            WHEN (uma_p1 - uma_p2) > (uma_p2 - uma_p3)
             AND (uma_p1 - uma_p2) > (uma_p3 - uma_p4)
                THEN 'First Place Emphasis'
            WHEN (uma_p3 - uma_p4) > (uma_p1 - uma_p2)
             AND (uma_p3 - uma_p4) > (uma_p2 - uma_p3)
                THEN 'Last Place Avoidance'
            ELSE 'Asymmetric/Mixed'
        END
    ) STORED,

    created_at        timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT uma_lookup_description_unique UNIQUE (description)
);

COMMENT ON TABLE  public.uma_lookup IS
    'Reference catalog of uma (score adjustment) configurations. Static/curated, not written by normal game transactions.';
COMMENT ON COLUMN public.uma_lookup.uma_id IS
    'Sequential surrogate key. No semantic meaning by design — do not encode category into ID ranges.';
COMMENT ON COLUMN public.uma_lookup.description IS
    'Unique identifying name for this config. Must not repeat across rows.';
COMMENT ON COLUMN public.uma_lookup.category IS
    'Coarse tier: Standard / Online Event / Local Club / Oversee Local Event / Rating Injection / Private.';
COMMENT ON COLUMN public.uma_lookup.purpose IS
    'Manually entered behavioral/training intent. Not authoritative for source attribution — see ruleset.source / uma_sources view.';
COMMENT ON COLUMN public.uma_lookup.status IS
    'true = available for player selection in ruleset picker. false = inactive/deprecated/system-only (e.g. rating injection rows).';
COMMENT ON COLUMN public.uma_lookup.total_uma IS
    'SUM(uma_p1..uma_p4). Non-zero flags rake or point-injection rulesets (e.g. system correction rows).';
COMMENT ON COLUMN public.uma_lookup.play_style IS
    'Derived shape classification based on gap comparison between placements.';

-- Lookup/filter indexes
CREATE INDEX idx_uma_lookup_category ON public.uma_lookup (category);
CREATE INDEX idx_uma_lookup_status   ON public.uma_lookup (status);
