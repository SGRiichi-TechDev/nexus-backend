-- Add Nagashi Mangan to yaku_lookup at han_value=5 (mangan-tier), so it's queryable
-- through the same yaku-based stats as other yaku. Scored via win_type on hand_win,
-- not via a han-count formula — this row exists for reference/stats purposes.
-- closed_only = true: nagashi mangan requires no calls made that hand.

INSERT INTO yaku_lookup (yaku_id, yaku_name, han_value, open_hand_penalty, is_yakuman, is_double_yakuman, closed_only)
VALUES (41, 'Nagashi Mangan', 5, false, false, false, true);

COMMENT ON TABLE yaku_lookup IS 'Static reference table of yaku names and han values. Nagashi Mangan is included at han_value=5 (mangan-tier), scored via win_type on hand_win rather than a han-count formula. Renhou still excluded — its value is ruleset-defined via rule_details, not fixed.';
