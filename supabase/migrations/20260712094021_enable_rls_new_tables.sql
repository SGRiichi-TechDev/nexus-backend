-- Enable RLS on new tables to match project convention (all other tables have RLS enabled)
ALTER TABLE hand_win ENABLE ROW LEVEL SECURITY;
ALTER TABLE hand_yaku ENABLE ROW LEVEL SECURITY;
ALTER TABLE yaku_lookup ENABLE ROW LEVEL SECURITY;
