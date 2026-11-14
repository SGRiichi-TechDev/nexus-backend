import { pgSchema, pgEnum, pgTable, integer, bigint, uuid, text, varchar, char, smallint, jsonb, bigserial, timestamp, date, boolean, json, numeric, customType, index, uniqueIndex, foreignKey, primaryKey, unique, check, doublePrecision } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const auth = pgSchema("auth");
export const extensions = pgSchema("extensions");
export const graphql = pgSchema("graphql");
export const graphqlPublic = pgSchema("graphql_public");
export const pgbouncer = pgSchema("pgbouncer");
export const realtime = pgSchema("realtime");
export const storage = pgSchema("storage");
export const supabaseMigrations = pgSchema("supabase_migrations");
export const vault = pgSchema("vault");
export const akaEnum = pgEnum("aka_enum", ["Aka-Ari", "Aka-Nashi"])
export const chomboOptionEnum = pgEnum("chombo_option_enum", ["Payment to all", "Flat deduction"])
export const eventScaleEnum = pgEnum("event_scale_enum", ["local", "regional", "international"])
export const handOutcomeEnum = pgEnum("hand_outcome_enum", ["Tsumo", "Ron", "Draw", "Chombo", "Mid Game Draw", "Nagashi Mangan"])
export const individualOutcomeEnum = pgEnum("individual_outcome_enum", ["Draw", "Ron", "Deal-in", "Tsumo", "Tsumo-loss", "Mid Game Draw", "Nagashi-win", "Nagashi-loss", "Chombo"])
export const influenceFactorEnum = pgEnum("influence_factor_enum", ["individual", "team"])
export const playerStatusEnum = pgEnum("player_status_enum", ["active", "pending", "rejected", "suspended"])
export const windEnum = pgEnum("wind_enum", ["E", "S", "W", "N"])
export const yakumanEnum = pgEnum("yakuman_enum", ["KazoeYakuman", "KokushiMusou", "KokushiMusou_13Men", "Daisangen", "SuuAnkou", "SuuAnkou_Tanki", "Shousuushi", "Daisuushi", "Tsuuiisou", "Ryuuiisou", "Chinroutou", "ChuurenPoutou", "Suukantsu", "Tenhou", "Chiihou", "JunsuiChuurenPoutou"])
export const winTypeEnum = pgEnum("win_type_enum", ["Ron", "Tsumo", "Nagashi Mangan"])
export const gameStatus = pgEnum("game_status", ["draft", "pending_edit", "pending_submit", "approved", "rejected"])
export const umaCalculationMethod = pgEnum("uma_calculation_method", ["positional", "floating"])
export const eventTypeEnum = pgEnum("event_type_enum", ["private", "club", "league", "tournament"])
export const resultSourceEnum = pgEnum("result_source_enum", ["derived", "manual"])
export const eventStatusEnum = pgEnum("event_status_enum", ["draft", "active", "closed"])
export const eventPlatformEnum = pgEnum("event_platform_enum", ["online", "offline"])
export const leftoverRiichiRuleEnum = pgEnum("leftover_riichi_rule_enum", ["lost", "to_first"])


export const auditLogEntriesInAuth = auth.table("audit_log_entries", {
	instanceId: uuid("instance_id"),
	id: uuid().primaryKey(),
	payload: json(),
	createdAt: timestamp("created_at", { withTimezone: true }),
}, (table) => [
	index("audit_logs_instance_id_idx").using("btree", table.instanceId.asc().nullsLast()),
]);

export const instancesInAuth = auth.table("instances", {
	id: uuid().primaryKey(),
	uuid: uuid(),
	rawBaseConfig: text("raw_base_config"),
	createdAt: timestamp("created_at", { withTimezone: true }),
	updatedAt: timestamp("updated_at", { withTimezone: true }),
});

export const refreshTokensInAuth = auth.table("refresh_tokens", {
	instanceId: uuid("instance_id"),
	id: bigserial({ mode: 'number' }).primaryKey(),
	token: varchar({ length: 255 }),
	userId: varchar("user_id", { length: 255 }),
	revoked: boolean(),
	createdAt: timestamp("created_at", { withTimezone: true }),
	updatedAt: timestamp("updated_at", { withTimezone: true }),
}, (table) => [
	index("refresh_tokens_instance_id_idx").using("btree", table.instanceId.asc().nullsLast()),
	index("refresh_tokens_instance_id_user_id_idx").using("btree", table.instanceId.asc().nullsLast(), table.userId.asc().nullsLast()),
	index("refresh_tokens_token_idx").using("btree", table.token.asc().nullsLast()),
]);

export const schemaMigrationsInAuth = auth.table("schema_migrations", {
	version: varchar({ length: 255 }).primaryKey(),
});

export const usersInAuth = auth.table("users", {
	instanceId: uuid("instance_id"),
	id: uuid().primaryKey(),
	aud: varchar({ length: 255 }),
	role: varchar({ length: 255 }),
	email: varchar({ length: 255 }),
	encryptedPassword: varchar("encrypted_password", { length: 255 }),
	confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
	invitedAt: timestamp("invited_at", { withTimezone: true }),
	confirmationToken: varchar("confirmation_token", { length: 255 }),
	confirmationSentAt: timestamp("confirmation_sent_at", { withTimezone: true }),
	recoveryToken: varchar("recovery_token", { length: 255 }),
	recoverySentAt: timestamp("recovery_sent_at", { withTimezone: true }),
	emailChangeToken: varchar("email_change_token", { length: 255 }),
	emailChange: varchar("email_change", { length: 255 }),
	emailChangeSentAt: timestamp("email_change_sent_at", { withTimezone: true }),
	lastSignInAt: timestamp("last_sign_in_at", { withTimezone: true }),
	rawAppMetaData: jsonb("raw_app_meta_data"),
	rawUserMetaData: jsonb("raw_user_meta_data"),
	isSuperAdmin: boolean("is_super_admin"),
	createdAt: timestamp("created_at", { withTimezone: true }),
	updatedAt: timestamp("updated_at", { withTimezone: true }),
}, (table) => [
	index("users_instance_id_email_idx").using("btree", table.instanceId.asc().nullsLast(), table.email.asc().nullsLast()),
	index("users_instance_id_idx").using("btree", table.instanceId.asc().nullsLast()),
	unique("users_email_key").on(table.email),]);

export const admin = pgTable.withRLS("admin", {
	id: integer().primaryKey(),
	deleted: boolean().default(false).notNull(),
	telegramId: bigint("telegram_id", { mode: 'number' }).notNull(),
	isSuperAdmin: boolean("is_super_admin").default(false).notNull(),
});

export const akakoMsg = pgTable.withRLS("akako_msg", {
	key: text().primaryKey(),
	value: text().notNull(),
});

export const appSettings = pgTable.withRLS("app_settings", {
	key: text().primaryKey(),
	value: jsonb().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`now()`).notNull(),
	updatedBy: bigint("updated_by", { mode: 'number' }).references(() => users.id),
});

export const auditLog = pgTable.withRLS("audit_log", {
	id: bigint({ mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
	createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`).notNull(),
	actorUserId: bigint("actor_user_id", { mode: 'number' }).references(() => users.id),
	action: text().notNull(),
	tableName: text("table_name").notNull(),
	recordId: text("record_id").notNull(),
	oldValues: jsonb("old_values"),
	newValues: jsonb("new_values"),
});

export const cityLookup = pgTable.withRLS("city_lookup", {
	cityCode: char("city_code", { length: 3 }).primaryKey(),
	countryCode: char("country_code", { length: 2 }).notNull().references(() => countryLookup.countryCode),
	name: text().notNull(),
	status: boolean().default(true).notNull(),
}, (table) => [
	index("idx_city_lookup_country").using("btree", table.countryCode.asc().nullsLast()),
	unique("city_lookup_country_code_name_key").on(table.countryCode, table.name),]);

export const countryLookup = pgTable.withRLS("country_lookup", {
	countryCode: char("country_code", { length: 2 }).primaryKey(),
	name: text().notNull(),
	status: boolean().default(true).notNull(),
}, (table) => [
	unique("country_lookup_name_key").on(table.name),]);

export const eventFormat = pgTable.withRLS("event_format", {
	formatId: smallint("format_id").primaryKey().generatedByDefaultAsIdentity(),
	name: text().notNull(),
	description: text(),
	status: boolean().default(true).notNull(),
}, (table) => [
	unique("event_format_name_key").on(table.name),]);

export const eventInfo = pgTable.withRLS("event_info", {
	eventId: integer("event_id").primaryKey().generatedByDefaultAsIdentity({ name: "event_event_id_seq" }),
	title: text().notNull(),
	startDate: timestamp("start_date").notNull(),
	endDate: timestamp("end_date"),
	scale: eventScaleEnum().notNull(),
	influenceFactor: influenceFactorEnum("influence_factor").notNull(),
	rulesetId: smallint("ruleset_id").references(() => rulesetInfo.rulesetId),
	numGames: integer("num_games"),
	totalPlayers: integer("total_players"),
	createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
	eventType: eventTypeEnum("event_type").default("tournament").notNull(),
	formatId: smallint("format_id").references(() => eventFormat.formatId),
	parentEventId: integer("parent_event_id"),
	venueId: integer("venue_id").references(() => venue.venueId),
	status: eventStatusEnum().default("draft").notNull(),
	isSelectable: boolean("is_selectable").default(false).notNull(),
	calculationMethod: umaCalculationMethod("calculation_method"),
	floatingSchemeId: integer("floating_scheme_id"),
	countryCode: char("country_code", { length: 2 }).references(() => countryLookup.countryCode),
	cityCode: char("city_code", { length: 3 }).references(() => cityLookup.cityCode),
	platform: eventPlatformEnum(),
}, (table) => [
	foreignKey({
		columns: [table.parentEventId],
		foreignColumns: [table.eventId],
		name: "event_info_parent_event_id_fkey"
	}),
	index("idx_event_info_country_code").using("btree", table.countryCode.asc().nullsLast()),
	index("idx_event_info_parent").using("btree", table.parentEventId.asc().nullsLast()),
	index("idx_event_info_selectable").using("btree", table.isSelectable.asc().nullsLast()).where(sql`is_selectable`),
	index("idx_event_info_type").using("btree", table.eventType.asc().nullsLast()),
check("event_info_floating_scheme_requires_method", sql`((floating_scheme_id IS NULL) OR (calculation_method = 'floating'::uma_calculation_method))`),check("event_info_parent_not_self", sql`(parent_event_id IS DISTINCT FROM event_id)`),]);

export const eventResult = pgTable.withRLS("event_result", {
	eventId: integer("event_id").notNull().references(() => eventInfo.eventId, { onDelete: "cascade" } ),
	playerId: integer("player_id").notNull().references(() => playerInfo.playerId, { onDelete: "cascade" } ),
	totalScore: numeric("total_score", { mode: 'number', precision: 10, scale: 1 }).default(0),
	netScore: numeric("net_score", { mode: 'number', precision: 10, scale: 1 }).default(0),
	positionCounts: jsonb("position_counts").default({}),
	averagePosition: numeric("average_position"),
	gamesCount: integer("games_count").default(0).notNull(),
	finalPosition: integer("final_position"),
	createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
	source: resultSourceEnum().default("derived").notNull(),
}, (table) => [
	primaryKey({ columns: [table.eventId, table.playerId], name: "event_result_pkey"}),
	index("idx_event_result_source").using("btree", table.source.asc().nullsLast()),
check("event_result_derived_requires_scores", sql`((source <> 'derived'::result_source_enum) OR ((total_score IS NOT NULL) AND (net_score IS NOT NULL) AND (position_counts IS NOT NULL)))`),]);

export const gameInfo = pgTable.withRLS("game_info", {
	gameId: bigint("game_id", { mode: 'number' }).primaryKey(),
	venueId: integer("venue_id").references(() => venue.venueId),
	modeId: integer("mode_id").references(() => mode.modeId),
	rulesetId: smallint("ruleset_id").references(() => rulesetInfo.rulesetId),
	recordedByPid: integer("recorded_by_pid"),
	endedAt: timestamp("ended_at"),
	deleted: boolean().default(false).notNull(),
	completed: boolean().default(false).notNull(),
	submitted: boolean().default(false).notNull(),
	submitFail: boolean("submit_fail").default(false).notNull(),
	submitFailCount: integer("submit_fail_count").default(0).notNull(),
	uploadedAt: timestamp("uploaded_at"),
	finalScoreOnly: boolean("final_score_only").default(false).notNull(),
	isRecorded: boolean("is_recorded"),
	durationMins: bigint("duration_mins", { mode: 'number' }),
	leftoverDeposits: integer("leftover_deposits"),
	createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
	positionalUmaId: smallint("positional_uma_id").references(() => umaPositionalLookup.positionalUmaId),
	calculationMethod: umaCalculationMethod("calculation_method").notNull(),
	floatingSchemeId: integer("floating_scheme_id"),
	status: gameStatus().default("draft").notNull(),
	eventId: integer("event_id").references(() => eventInfo.eventId),
}, (table) => [
	index("game_info_status_active_idx").using("btree", table.status.asc().nullsLast()).where(sql`(deleted = false)`),
	index("idx_game_info_event").using("btree", table.eventId.asc().nullsLast()),
check("game_info_uma_method_fk_match", sql`(((calculation_method = 'positional'::uma_calculation_method) AND (floating_scheme_id IS NULL)) OR ((calculation_method = 'floating'::uma_calculation_method) AND (positional_uma_id IS NULL) AND (floating_scheme_id IS NOT NULL)))`),]);

export const gameResult = pgTable.withRLS("game_result", {
	gameId: bigint("game_id", { mode: 'number' }).notNull().references(() => gameInfo.gameId),
	startingSeat: smallint("starting_seat").notNull(),
	playerId: integer("player_id").references(() => playerInfo.playerId),
	finalScore: integer("final_score").notNull(),
	finalPosition: numeric("final_position", { mode: 'number' }).default(2.5).notNull(),
	totalPenaltyPoints: numeric("total_penalty_points"),
	submittedRow: boolean("submitted_row").default(false),
}, (table) => [
	primaryKey({ columns: [table.gameId, table.startingSeat], name: "game_result_pkey"}),
	unique("gr_seat_unique").on(table.gameId, table.startingSeat),check("gr_seat_range", sql`((starting_seat >= 1) AND (starting_seat <= 4))`),]);

export const handInfo = pgTable.withRLS("hand_info", {
	handId: bigint("hand_id", { mode: 'number' }).primaryKey(),
	gameId: bigint("game_id", { mode: 'number' }).notNull().references(() => gameInfo.gameId),
	handNum: integer("hand_num").notNull(),
	wind: windEnum().notNull(),
	roundNum: integer("round_num").notNull(),
	honba: integer().default(0).notNull(),
	handOutcome: handOutcomeEnum("hand_outcome"),
	completed: boolean().default(false).notNull(),
	submittedRow: boolean("submitted_row").default(false),
	riichiPotStart: integer("riichi_pot_start").default(0).notNull(),
});

export const handPlayerResult = pgTable.withRLS("hand_player_result", {
	handPlayerResultId: bigint("hand_player_result_id", { mode: 'number' }).primaryKey(),
	gameInfo: bigint("game_info", { mode: 'number' }).notNull().references(() => gameInfo.gameId),
	handId: bigint("hand_id", { mode: 'number' }).notNull().references(() => handInfo.handId),
	playerId: integer("player_id").notNull().references(() => playerInfo.playerId),
	outcome: individualOutcomeEnum(),
	position: numeric(),
	dealIntoRiichi: boolean("deal_into_riichi"),
	dealIntoOya: boolean("deal_into_oya"),
	riichiOrder: integer("riichi_order"),
	chombo: boolean().default(false).notNull(),
	scoreChange: integer("score_change").default(0).notNull(),
	startScore: integer("start_score").notNull(),
	riichi: boolean().default(false).notNull(),
	tenpai: boolean().default(false).notNull(),
	dealer: boolean().notNull(),
	submittedRow: boolean("submitted_row"),
	endScore: integer("end_score").generatedAlwaysAs(sql`(start_score + score_change)`),
	riichiCollected: integer("riichi_collected").default(0).notNull(),
	riichiDeposited: integer("riichi_deposited").default(0).notNull(),
}, (table) => [
	unique("hpr_hand_player_unique").on(table.handId, table.playerId),check("hpr_riichi_amounts_nonneg", sql`((riichi_deposited >= 0) AND (riichi_collected >= 0))`),check("hpr_riichi_flag_matches", sql`(riichi = (riichi_deposited > 0))`),]);

export const handTransaction = pgTable.withRLS("hand_transaction", {
	handId: bigint("hand_id", { mode: 'number' }).notNull().references(() => handInfo.handId),
	payerPlayerId: integer("payer_player_id").notNull().references(() => playerInfo.playerId),
	payeePlayerId: integer("payee_player_id").notNull().references(() => playerInfo.playerId),
	amount: integer(),
}, (table) => [
	primaryKey({ columns: [table.handId, table.payerPlayerId, table.payeePlayerId], name: "hand_transaction_pkey"}),
]);

export const handWin = pgTable.withRLS("hand_win", {
	handWinId: bigint("hand_win_id", { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity({ name: "hand_win_ihid_seq" }),
	handId: bigint("hand_id", { mode: 'number' }).notNull().references(() => handInfo.handId),
	winnerPlayerId: integer("winner_player_id").notNull().references(() => playerInfo.playerId),
	han: integer(),
	fu: integer(),
	handValue: integer("hand_value").notNull(),
	createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
	winType: winTypeEnum("win_type").notNull(),
}, (table) => [
	unique("hand_win_hand_id_winner_pid_key").on(table.handId, table.winnerPlayerId),]);

export const handYaku = pgTable.withRLS("hand_yaku", {
	handWinId: bigint("hand_win_id", { mode: 'number' }).notNull().references(() => handWin.handWinId),
	yakuId: integer("yaku_id").notNull().references(() => yakuLookup.yakuId),
}, (table) => [
	primaryKey({ columns: [table.handWinId, table.yakuId], name: "hand_yaku_pkey"}),
]);

export const localText = pgTable.withRLS("local_text", {
	key: text().primaryKey(),
	value: text().notNull(),
});

export const mode = pgTable.withRLS("mode", {
	modeId: integer("mode_id").primaryKey(),
	venueId: integer("venue_id").notNull().references(() => venue.venueId),
	name: text().notNull(),
	status: boolean().default(false).notNull(),
});

export const permissions = pgTable.withRLS("permissions", {
	id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
	name: text().notNull(),
});

export const playerDetails = pgTable.withRLS("player_details", {
	dateJoined: date("date_joined").default(sql`CURRENT_DATE`).notNull(),
	fullNameNric: text("full_name_nric").default("").notNull(),
	surname: text().default("").notNull(),
	displayNameFormat: text("display_name_format").default("").notNull(),
	yearOfBirthRange: text("year_of_birth_range").default("").notNull(),
	proficiency: smallint().default(0).notNull(),
	consent: boolean().default(true).notNull(),
	email: text().default(""),
	referredBy: text("referred_by").default("").notNull(),
	contactNumber: bigint("contact_number", { mode: 'number' }),
	playerId: integer("player_id").primaryKey().references(() => playerInfo.playerId, { onDelete: "cascade" } ),
	calledName: text("called_name").default("").notNull(),
}, (table) => [
	unique("player_details_contact_number_key").on(table.contactNumber),	unique("player_details_email_key").on(table.email),check("player_details_proficiency_check", sql`((proficiency >= 0) AND (proficiency <= 4))`),]);

export const playerInfo = pgTable.withRLS("player_info", {
	playerId: integer("player_id").primaryKey().generatedByDefaultAsIdentity(),
	displayName: text("display_name").notNull(),
	telegramId: bigint("telegram_id", { mode: 'number' }),
	status: playerStatusEnum().default("active"),
	ctryCd: text("ctry_cd").default("").notNull(),
	ctyCd: text("cty_cd").default("").notNull(),
	statusReason: text("status_reason"),
}, (table) => [
	unique("players_telegram_id_key").on(table.telegramId),]);

export const registrations = pgTable.withRLS("registrations", {
	registrationId: integer("registration_id").primaryKey().generatedByDefaultAsIdentity(),
	createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`).notNull(),
	status: text().default("pending").notNull(),
	statusReason: text("status_reason"),
	decidedAt: timestamp("decided_at", { withTimezone: true }),
	playerId: integer("player_id").references(() => playerInfo.playerId),
	displayName: text("display_name").notNull(),
	ctryCd: text("ctry_cd").notNull(),
	ctyCd: text("cty_cd").notNull(),
	telegramId: bigint("telegram_id", { mode: 'number' }),
	fullNameNric: text("full_name_nric").notNull(),
	calledName: text("called_name"),
	surname: text().notNull(),
	displayNameFormat: text("display_name_format").notNull(),
	yearOfBirthRange: text("year_of_birth_range").notNull(),
	proficiency: smallint().notNull(),
	consent: boolean().notNull(),
	email: text(),
	referredBy: text("referred_by").notNull(),
	contactNumber: bigint("contact_number", { mode: 'number' }),
}, (table) => [
	uniqueIndex("registrations_pending_email").using("btree", sql`lower(email)`).where(sql`(status = 'pending'::text)`),
	uniqueIndex("registrations_pending_phone").using("btree", table.contactNumber.asc().nullsLast()).where(sql`(status = 'pending'::text)`),
	uniqueIndex("registrations_pending_telegram").using("btree", table.telegramId.asc().nullsLast()).where(sql`(status = 'pending'::text)`),
	index("registrations_status").using("btree", table.status.asc().nullsLast(), table.createdAt.asc().nullsLast()),
	unique("registrations_player_id_key").on(table.playerId),check("registrations_status_check", sql`(status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text]))`),]);

export const rolePermissions = pgTable.withRLS("role_permissions", {
	roleId: bigint("role_id", { mode: 'number' }).notNull().references(() => roles.id),
	permissionId: bigint("permission_id", { mode: 'number' }).notNull().references(() => permissions.id),
	createdAt: timestamp("created_at", { withTimezone: true }).default(sql`(now() AT TIME ZONE 'utc'::text)`).notNull(),
}, (table) => [
	primaryKey({ columns: [table.roleId, table.permissionId], name: "role_permissions_pkey"}),
]);

export const roles = pgTable.withRLS("roles", {
	id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
	roleName: text("role_name").notNull(),
});

export const ruleDetails = pgTable.withRLS("rule_details", {
	ruleDetailsId: smallint("rule_details_id").primaryKey(),
	effectiveStart: date("effective_start").notNull(),
	effectiveEnd: date("effective_end").notNull(),
});

export const rulesetInfo = pgTable.withRLS("ruleset_info", {
	name: text().notNull(),
	description: text(),
	initialValue: integer("initial_value").default(250).notNull(),
	aka: akaEnum().notNull(),
	umaP1: integer("uma_p1").notNull(),
	umaP2: integer("uma_p2").notNull(),
	umaP3: integer("uma_p3").notNull(),
	umaP4: integer("uma_p4").notNull(),
	oka: integer().default(0).notNull(),
	kiriageMangan: boolean("kiriage_mangan").default(true).notNull(),
	multipleRon: boolean("multiple_ron").default(false).notNull(),
	chomboValue: integer("chombo_value").default(40).notNull(),
	chomboOption: chomboOptionEnum("chombo_option").notNull(),
	createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
	moreDetails: smallint("more_details").references(() => ruleDetails.ruleDetailsId),
	umaCal: integer("uma_cal").default(0).notNull(),
	effectiveStart: timestamp("effective_start", { withTimezone: true }),
	effectiveEnd: timestamp("effective_end", { withTimezone: true }),
	rulesetId: smallint("ruleset_id").primaryKey().generatedByDefaultAsIdentity(),
	positionalUmaId: smallint("positional_uma_id"),
	leftoverRiichiRule: leftoverRiichiRuleEnum("leftover_riichi_rule").default("lost").notNull(),
});

export const scoreLookup = pgTable.withRLS("score_lookup", {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	han: integer().default(0).notNull(),
	fu: integer().default(0).notNull(),
	dealer: boolean().default(false).notNull(),
	kiriageMangan: boolean("kiriage_mangan").default(false).notNull(),
	honbaMultiplier: integer("honba_multiplier").default(0).notNull(),
	value: integer().notNull(),
	outcome: individualOutcomeEnum().notNull(),
});

export const telegramAdminActions = pgTable.withRLS("telegram_admin_actions", {
	id: text().primaryKey(),
	userId: bigint("user_id", { mode: 'number' }).notNull().references(() => users.id, { onDelete: "cascade" } ),
	telegramId: bigint("telegram_id", { mode: 'number' }).notNull(),
	kind: text().notNull(),
	recordId: bigint("record_id", { mode: 'number' }).notNull(),
	snapshot: text().notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true }).default(sql`(now() + '00:15:00'::interval)`).notNull(),
	reason: text(),
	consumedAt: timestamp("consumed_at", { withTimezone: true }),
}, (table) => [
	index("telegram_admin_actions_expiry").using("btree", table.expiresAt.asc().nullsLast()),
check("telegram_admin_actions_kind_check", sql`(kind = ANY (ARRAY['player'::text, 'game'::text]))`),check("telegram_admin_actions_reason_check", sql`(length(reason) <= 300)`),]);

export const telegramAdminLinkTokens = pgTable.withRLS("telegram_admin_link_tokens", {
	tokenHash: text("token_hash").primaryKey(),
	userId: bigint("user_id", { mode: 'number' }).notNull().references(() => users.id, { onDelete: "cascade" } ),
	expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
}, (table) => [
	unique("telegram_admin_link_tokens_user_id_key").on(table.userId),]);

export const telegramAdminLinks = pgTable.withRLS("telegram_admin_links", {
	userId: bigint("user_id", { mode: 'number' }).primaryKey().references(() => users.id, { onDelete: "cascade" } ),
	telegramId: bigint("telegram_id", { mode: 'number' }).notNull(),
	notifications: text().default("off").notNull(),
	digestHour: smallint("digest_hour").default(9).notNull(),
	quietStart: smallint("quiet_start").default(22).notNull(),
	quietEnd: smallint("quiet_end").default(8).notNull(),
	nextDigestAt: timestamp("next_digest_at", { withTimezone: true }).default(sql`now()`).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`).notNull(),
}, (table) => [
	unique("telegram_admin_links_telegram_id_key").on(table.telegramId),check("telegram_admin_links_digest_hour_check", sql`((digest_hour >= 0) AND (digest_hour <= 23))`),check("telegram_admin_links_notifications_check", sql`(notifications = ANY (ARRAY['off'::text, 'instant'::text, 'daily'::text]))`),check("telegram_admin_links_quiet_end_check", sql`((quiet_end >= 0) AND (quiet_end <= 23))`),check("telegram_admin_links_quiet_start_check", sql`((quiet_start >= 0) AND (quiet_start <= 23))`),check("telegram_admin_links_telegram_id_check", sql`(telegram_id > 0)`),]);

export const telegramOutbox = pgTable.withRLS("telegram_outbox", {
	id: bigint({ mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
	dedupeKey: text("dedupe_key"),
	bot: text().notNull(),
	recipient: bigint({ mode: 'number' }).notNull(),
	userId: bigint("user_id", { mode: 'number' }).references(() => users.id, { onDelete: "cascade" } ),
	payload: jsonb().notNull(),
	attempts: integer().default(0).notNull(),
	availableAt: timestamp("available_at", { withTimezone: true }).default(sql`now()`).notNull(),
	leaseUntil: timestamp("lease_until", { withTimezone: true }),
	leaseToken: uuid("lease_token"),
	sentAt: timestamp("sent_at", { withTimezone: true }),
	lastError: text("last_error"),
	createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`).notNull(),
}, (table) => [
	index("telegram_outbox_due").using("btree", table.availableAt.asc().nullsLast()).where(sql`(sent_at IS NULL)`),
	index("telegram_outbox_user").using("btree", table.userId.asc().nullsLast()),
	unique("telegram_outbox_dedupe_key_key").on(table.dedupeKey),check("telegram_outbox_bot_check", sql`(bot = ANY (ARRAY['admin'::text, 'player'::text]))`),]);

export const umaFloatingLookup = pgTable.withRLS("uma_floating_lookup", {
	floatingUmaId: integer("floating_uma_id").notNull(),
	floatCount: smallint("float_count").notNull(),
	description: text().notNull(),
	umaRank1: integer("uma_rank1").notNull(),
	umaRank2: integer("uma_rank2").notNull(),
	umaRank3: integer("uma_rank3").notNull(),
	umaRank4: integer("uma_rank4").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`).notNull(),
}, (table) => [
	primaryKey({ columns: [table.floatingUmaId, table.floatCount], name: "uma_floating_bracket_pkey"}),
check("float_count_range", sql`(float_count = ANY (ARRAY[1, 2, 3]))`),]);

export const umaPositionalLookup = pgTable.withRLS("uma_positional_lookup", {
	umaRank1: integer("uma_rank1").notNull(),
	umaRank2: integer("uma_rank2").notNull(),
	umaRank3: integer("uma_rank3").notNull(),
	umaRank4: integer("uma_rank4").notNull(),
	purpose: text().notNull(),
	category: text().notNull(),
	status: boolean().default(true).notNull(),
	totalUma: integer("total_uma").generatedAlwaysAs(sql`(((uma_rank1 + uma_rank2) + uma_rank3) + uma_rank4)`),
	gap12: integer("gap_1_2").generatedAlwaysAs(sql`(uma_rank1 - uma_rank2)`),
	gap23: integer("gap_2_3").generatedAlwaysAs(sql`(uma_rank2 - uma_rank3)`),
	gap34: integer("gap_3_4").generatedAlwaysAs(sql`(uma_rank3 - uma_rank4)`),
	playStyle: text("play_style").generatedAlwaysAs(sql`
CASE
    WHEN (((uma_rank1 - uma_rank2) = (uma_rank2 - uma_rank3)) AND ((uma_rank2 - uma_rank3) = (uma_rank3 - uma_rank4))) THEN 'Equal Positional Emphasis'::text
    WHEN (((uma_rank1 - uma_rank2) = (uma_rank3 - uma_rank4)) AND ((uma_rank1 - uma_rank2) > (uma_rank2 - uma_rank3))) THEN 'Barbell Emphasis'::text
    WHEN (((uma_rank2 - uma_rank3) > (uma_rank1 - uma_rank2)) AND ((uma_rank2 - uma_rank3) > (uma_rank3 - uma_rank4))) THEN 'Middle Split Emphasis'::text
    WHEN (((uma_rank1 - uma_rank2) > (uma_rank2 - uma_rank3)) AND ((uma_rank1 - uma_rank2) > (uma_rank3 - uma_rank4))) THEN 'First Place Emphasis'::text
    WHEN (((uma_rank3 - uma_rank4) > (uma_rank1 - uma_rank2)) AND ((uma_rank3 - uma_rank4) > (uma_rank2 - uma_rank3))) THEN 'Last Place Avoidance'::text
    ELSE 'Asymmetric/Mixed'::text
END`),
	createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`).notNull(),
	positionalUmaId: smallint("positional_uma_id").primaryKey().generatedByDefaultAsIdentity(),
});

export const userRoles = pgTable.withRLS("user_roles", {
	userId: bigint("user_id", { mode: 'number' }).notNull().references(() => users.id),
	roleId: bigint("role_id", { mode: 'number' }).notNull().references(() => roles.id),
	validFrom: timestamp("valid_from", { withTimezone: true }).notNull(),
	validUntil: timestamp("valid_until", { withTimezone: true }),
	grantedBy: bigint("granted_by", { mode: 'number' }).references(() => users.id),
	createdAt: timestamp("created_at", { withTimezone: true }).default(sql`(now() AT TIME ZONE 'utc'::text)`).notNull(),
}, (table) => [
	primaryKey({ columns: [table.userId, table.roleId], name: "user_roles_pkey"}),
]);

export const users = pgTable.withRLS("users", {
	id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
	createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`).notNull(),
	email: text().notNull(),
	status: text().notNull(),
	playerId: integer("player_id").references(() => playerInfo.playerId),
});

export const venue = pgTable.withRLS("venue", {
	name: text().notNull(),
	status: boolean().default(false).notNull(),
	venueId: integer("venue_id").primaryKey(),
}, (table) => [
	unique("venue_name_key").on(table.name),]);

export const venueOrganisers = pgTable.withRLS("venue_organisers", {
	userId: bigint("user_id", { mode: 'number' }).notNull().references(() => users.id, { onDelete: "cascade" } ),
	venueId: integer("venue_id").notNull().references(() => venue.venueId),
	grantedBy: bigint("granted_by", { mode: 'number' }).references(() => users.id),
	createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`).notNull(),
}, (table) => [
	primaryKey({ columns: [table.userId, table.venueId], name: "venue_organisers_pkey"}),
	index("venue_organisers_venue").using("btree", table.venueId.asc().nullsLast()),
]);

export const yakuLookup = pgTable.withRLS("yaku_lookup", {
	yakuId: integer("yaku_id").primaryKey().generatedByDefaultAsIdentity(),
	yakuName: text("yaku_name").notNull(),
	hanValue: integer("han_value").notNull(),
	openHandPenalty: boolean("open_hand_penalty").default(false).notNull(),
	isYakuman: boolean("is_yakuman").default(false).notNull(),
	isDoubleYakuman: boolean("is_double_yakuman").default(false).notNull(),
	closedOnly: boolean("closed_only").default(false).notNull(),
}, (table) => [
	unique("yaku_lookup_yaku_name_key").on(table.yakuName),]);

export const schemaMigrationsInSupabaseMigrations = supabaseMigrations.table("schema_migrations", {
	version: text().primaryKey(),
	statements: text().array(),
	name: text(),
});

export const secretsInVault = vault.table("secrets", {
	id: uuid().defaultRandom().primaryKey(),
	name: text(),
	description: text().default("").notNull(),
	secret: text().notNull(),
	keyId: uuid("key_id"),
	nonce: customType({ dataType: () => 'bytea' })().default("vault._crypto_aead_det_noncegen()"),
	createdAt: timestamp("created_at", { withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	uniqueIndex("secrets_name_idx").using("btree", table.name.asc().nullsLast()).where(sql`(name IS NOT NULL)`),
]);
export const pgStatStatementsInExtensions = extensions.view("pg_stat_statements", {	userid: customType({ dataType: () => 'oid' })(),
	dbid: customType({ dataType: () => 'oid' })(),
	toplevel: boolean(),
	queryid: bigint({ mode: 'number' }),
	query: text(),
	plans: bigint({ mode: 'number' }),
	totalPlanTime: doublePrecision("total_plan_time"),
	minPlanTime: doublePrecision("min_plan_time"),
	maxPlanTime: doublePrecision("max_plan_time"),
	meanPlanTime: doublePrecision("mean_plan_time"),
	stddevPlanTime: doublePrecision("stddev_plan_time"),
	calls: bigint({ mode: 'number' }),
	totalExecTime: doublePrecision("total_exec_time"),
	minExecTime: doublePrecision("min_exec_time"),
	maxExecTime: doublePrecision("max_exec_time"),
	meanExecTime: doublePrecision("mean_exec_time"),
	stddevExecTime: doublePrecision("stddev_exec_time"),
	rows: bigint({ mode: 'number' }),
	sharedBlksHit: bigint("shared_blks_hit", { mode: 'number' }),
	sharedBlksRead: bigint("shared_blks_read", { mode: 'number' }),
	sharedBlksDirtied: bigint("shared_blks_dirtied", { mode: 'number' }),
	sharedBlksWritten: bigint("shared_blks_written", { mode: 'number' }),
	localBlksHit: bigint("local_blks_hit", { mode: 'number' }),
	localBlksRead: bigint("local_blks_read", { mode: 'number' }),
	localBlksDirtied: bigint("local_blks_dirtied", { mode: 'number' }),
	localBlksWritten: bigint("local_blks_written", { mode: 'number' }),
	tempBlksRead: bigint("temp_blks_read", { mode: 'number' }),
	tempBlksWritten: bigint("temp_blks_written", { mode: 'number' }),
	sharedBlkReadTime: doublePrecision("shared_blk_read_time"),
	sharedBlkWriteTime: doublePrecision("shared_blk_write_time"),
	localBlkReadTime: doublePrecision("local_blk_read_time"),
	localBlkWriteTime: doublePrecision("local_blk_write_time"),
	tempBlkReadTime: doublePrecision("temp_blk_read_time"),
	tempBlkWriteTime: doublePrecision("temp_blk_write_time"),
	walRecords: bigint("wal_records", { mode: 'number' }),
	walFpi: bigint("wal_fpi", { mode: 'number' }),
	walBytes: numeric("wal_bytes"),
	jitFunctions: bigint("jit_functions", { mode: 'number' }),
	jitGenerationTime: doublePrecision("jit_generation_time"),
	jitInliningCount: bigint("jit_inlining_count", { mode: 'number' }),
	jitInliningTime: doublePrecision("jit_inlining_time"),
	jitOptimizationCount: bigint("jit_optimization_count", { mode: 'number' }),
	jitOptimizationTime: doublePrecision("jit_optimization_time"),
	jitEmissionCount: bigint("jit_emission_count", { mode: 'number' }),
	jitEmissionTime: doublePrecision("jit_emission_time"),
	jitDeformCount: bigint("jit_deform_count", { mode: 'number' }),
	jitDeformTime: doublePrecision("jit_deform_time"),
	statsSince: timestamp("stats_since", { withTimezone: true }),
	minmaxStatsSince: timestamp("minmax_stats_since", { withTimezone: true }),
}).as(sql`SELECT userid, dbid, toplevel, queryid, query, plans, total_plan_time, min_plan_time, max_plan_time, mean_plan_time, stddev_plan_time, calls, total_exec_time, min_exec_time, max_exec_time, mean_exec_time, stddev_exec_time, rows, shared_blks_hit, shared_blks_read, shared_blks_dirtied, shared_blks_written, local_blks_hit, local_blks_read, local_blks_dirtied, local_blks_written, temp_blks_read, temp_blks_written, shared_blk_read_time, shared_blk_write_time, local_blk_read_time, local_blk_write_time, temp_blk_read_time, temp_blk_write_time, wal_records, wal_fpi, wal_bytes, jit_functions, jit_generation_time, jit_inlining_count, jit_inlining_time, jit_optimization_count, jit_optimization_time, jit_emission_count, jit_emission_time, jit_deform_count, jit_deform_time, stats_since, minmax_stats_since FROM pg_stat_statements(true) pg_stat_statements(userid, dbid, toplevel, queryid, query, plans, total_plan_time, min_plan_time, max_plan_time, mean_plan_time, stddev_plan_time, calls, total_exec_time, min_exec_time, max_exec_time, mean_exec_time, stddev_exec_time, rows, shared_blks_hit, shared_blks_read, shared_blks_dirtied, shared_blks_written, local_blks_hit, local_blks_read, local_blks_dirtied, local_blks_written, temp_blks_read, temp_blks_written, shared_blk_read_time, shared_blk_write_time, local_blk_read_time, local_blk_write_time, temp_blk_read_time, temp_blk_write_time, wal_records, wal_fpi, wal_bytes, jit_functions, jit_generation_time, jit_inlining_count, jit_inlining_time, jit_optimization_count, jit_optimization_time, jit_emission_count, jit_emission_time, jit_deform_count, jit_deform_time, stats_since, minmax_stats_since)`);

export const pgStatStatementsInfoInExtensions = extensions.view("pg_stat_statements_info", {	dealloc: bigint({ mode: 'number' }),
	statsReset: timestamp("stats_reset", { withTimezone: true }),
}).as(sql`SELECT dealloc, stats_reset FROM pg_stat_statements_info() pg_stat_statements_info(dealloc, stats_reset)`);

export const decryptedSecretsInVault = vault.view("decrypted_secrets", {	id: uuid(),
	name: text(),
	description: text(),
	secret: text(),
	decryptedSecret: text("decrypted_secret"),
	keyId: uuid("key_id"),
	nonce: customType({ dataType: () => 'bytea' })(),
	createdAt: timestamp("created_at", { withTimezone: true }),
	updatedAt: timestamp("updated_at", { withTimezone: true }),
}).as(sql`SELECT id, name, description, secret, convert_from(vault._crypto_aead_det_decrypt(message => decode(secret, 'base64'::text), additional => convert_to(id::text, 'utf8'::name), key_id => 0::bigint, context => '\x7067736f6469756d'::bytea, nonce => nonce), 'utf8'::name) AS decrypted_secret, key_id, nonce, created_at, updated_at FROM vault.secrets s`);