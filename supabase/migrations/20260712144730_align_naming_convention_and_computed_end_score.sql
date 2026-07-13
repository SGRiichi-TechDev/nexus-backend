-- Align naming convention across hand_win, hand_yaku, and hand_result.
-- Also converts end_score into a computed column (start_score + score_change),
-- so it can never drift out of sync with its inputs.

-- hand_win: align column names
ALTER TABLE hand_win RENAME COLUMN winner_pid TO winner_player_id;
ALTER TABLE hand_win RENAME COLUMN value TO hand_value;
ALTER TABLE hand_win RENAME COLUMN ihid TO hand_win_id;

-- hand_yaku: FK column renamed separately to match (parent column rename does not cascade)
ALTER TABLE hand_yaku RENAME COLUMN ihid TO hand_win_id;

-- hand_result: rename table and its PK to match, avoiding an "ihid" collision with hand_win's renamed PK
ALTER TABLE hand_result RENAME TO hand_player_result;
ALTER TABLE hand_player_result RENAME COLUMN ihid TO hand_player_result_id;

-- end_score becomes a computed column: start_score + score_change, no longer independently stored
ALTER TABLE hand_player_result DROP COLUMN end_score;
ALTER TABLE hand_player_result ADD COLUMN end_score integer GENERATED ALWAYS AS (start_score + score_change) STORED;

COMMENT ON COLUMN hand_player_result.end_score IS 'Computed: start_score + score_change. Not independently writable — update start_score/score_change instead.';
