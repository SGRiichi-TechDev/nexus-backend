-- Minimal deterministic fixtures for integration tests (IDs in 9xxx range).
-- Applied only on a fresh volume via scripts/test-integration.sh.

INSERT INTO public.venue (venue_id, name, status)
VALUES (9001, 'IT Venue', true);

INSERT INTO public.mode (mode_id, venue_id, name, status)
VALUES (9001, 9001, 'IT Mode', true);

INSERT INTO public.uma_positional_lookup (
  positional_uma_id,
  uma_rank1,
  uma_rank2,
  uma_rank3,
  uma_rank4,
  purpose,
  category,
  status
)
VALUES (
  9001,
  15,
  5,
  -5,
  -15,
  'Integration test uma',
  'IT',
  true
);

INSERT INTO public.ruleset_info (
  ruleset_id,
  name,
  description,
  initial_value,
  aka,
  uma_p1,
  uma_p2,
  uma_p3,
  uma_p4,
  oka,
  kiriage_mangan,
  multiple_ron,
  chombo_value,
  chombo_option,
  uma_cal,
  effective_start,
  effective_end,
  positional_uma_id
)
VALUES (
  9001,
  'IT Ruleset',
  'Integration test ruleset',
  25000,
  'Aka-Ari',
  15,
  5,
  -5,
  -15,
  0,
  false,
  false,
  20,
  'Payment to all',
  0,
  NULL,
  NULL,
  9001
);

INSERT INTO public.player_info (
  player_id,
  display_name,
  telegram_id,
  status,
  ctry_cd,
  cty_cd
)
VALUES
  (9001, 'IT Alice', 900001, 'active', 'SG', 'SGP'),
  (9002, 'IT Bob', 900002, 'active', 'SG', 'SGP'),
  (9003, 'IT Carol', 900003, 'active', 'SG', 'SGP'),
  (9004, 'IT Dave', 900004, 'active', 'SG', 'SGP'),
  (9005, 'IT Eve', 900005, 'active', 'SG', 'SGP'),
  (9006, 'IT Fran', 900006, 'active', 'SG', 'SGP'),
  (9010, 'IT Scratch', 900010, 'active', 'SG', 'SGP');

INSERT INTO public.game_info (
  game_id,
  venue_id,
  mode_id,
  ruleset_id,
  recorded_by_pid,
  deleted,
  completed,
  submitted,
  submit_fail,
  submit_fail_count,
  final_score_only,
  is_recorded,
  positional_uma_id,
  calculation_method,
  floating_scheme_id,
  status
)
VALUES
  (
    9001,
    9001,
    9001,
    9001,
    9001,
    false,
    false,
    false,
    false,
    0,
    false,
    true,
    9001,
    'positional',
    NULL,
    'draft'
  ),
  (
    9002,
    NULL,
    NULL,
    NULL,
    9005,
    false,
    false,
    false,
    false,
    0,
    false,
    NULL,
    NULL,
    'positional',
    NULL,
    'draft'
  ),
  (
    9003,
    9001,
    9001,
    9001,
    9006,
    false,
    false,
    false,
    false,
    0,
    false,
    true,
    9001,
    'positional',
    NULL,
    'draft'
  );

INSERT INTO public.game_result (
  game_id,
  starting_seat,
  player_id,
  final_score,
  final_position,
  total_penalty_points,
  submitted_row
)
VALUES
  (9001, 1, 9001, 35000, 1, 0, false),
  (9001, 2, 9002, 28000, 2, 0, false),
  (9001, 3, 9003, 22000, 3, 0, false),
  (9001, 4, 9004, 15000, 4, 0, false);

INSERT INTO public.hand_info (
  hand_id,
  game_id,
  hand_num,
  wind,
  round_num,
  honba,
  riichi_pot_start,
  hand_outcome,
  completed,
  submitted_row
)
VALUES (
  90010,
  9001,
  1,
  'E',
  1,
  0,
  0,
  'Tsumo',
  true,
  false
);

INSERT INTO public.hand_player_result (
  hand_player_result_id,
  game_info,
  hand_id,
  player_id,
  outcome,
  position,
  deal_into_riichi,
  deal_into_oya,
  riichi_order,
  chombo,
  score_change,
  start_score,
  riichi,
  tenpai,
  dealer,
  submitted_row
)
VALUES
  (900101, 9001, 90010, 9001, 'Tsumo', 1, false, false, NULL, false, 8000, 25000, false, false, true, false),
  (900102, 9001, 90010, 9002, 'Tsumo-loss', 2, false, false, NULL, false, -2000, 25000, false, false, false, false),
  (900103, 9001, 90010, 9003, 'Tsumo-loss', 3, false, false, NULL, false, -2000, 25000, false, false, false, false),
  (900104, 9001, 90010, 9004, 'Tsumo-loss', 4, false, false, NULL, false, -4000, 25000, false, false, false, false);

INSERT INTO public.hand_win (
  hand_id,
  winner_player_id,
  han,
  fu,
  hand_value,
  win_type
)
VALUES (
  90010,
  9001,
  3,
  30,
  3900,
  'Tsumo'
);
