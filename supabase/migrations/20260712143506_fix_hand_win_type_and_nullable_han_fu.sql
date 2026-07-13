-- win_type is not binary — Nagashi Mangan is neither Ron nor Tsumo.
-- Replaces is_tsumo boolean with a proper enum, and makes han/fu nullable
-- since Nagashi Mangan has no han/fu count (flat mangan-value payout).

CREATE TYPE win_type_enum AS ENUM ('Ron', 'Tsumo', 'Nagashi Mangan');

ALTER TABLE hand_win
  ADD COLUMN win_type win_type_enum;

ALTER TABLE hand_win
  DROP COLUMN is_tsumo,
  ALTER COLUMN win_type SET NOT NULL,
  ALTER COLUMN han DROP NOT NULL,
  ALTER COLUMN fu DROP NOT NULL;

COMMENT ON COLUMN hand_win.win_type IS 'Ron, Tsumo, or Nagashi Mangan. Not binary — nagashi mangan is neither a discard win nor a self-draw win.';
COMMENT ON COLUMN hand_win.han IS 'Nullable — Nagashi Mangan has no han count, it is a flat mangan-value payout.';
COMMENT ON COLUMN hand_win.fu IS 'Nullable — Nagashi Mangan has no fu count.';
