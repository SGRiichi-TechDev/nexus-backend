import { pgEnum, pgTable, text, bigint, smallint, integer, boolean, timestamp, date, numeric, jsonb, foreignKey, primaryKey, unique, check } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const akaEnum = pgEnum("aka_enum", ["Aka-Ari", "Aka-Nashi"])
export const chomboOptionEnum = pgEnum("chombo_option_enum", ["Payment to all", "Flat deduction"])
export const eventScaleEnum = pgEnum("event_scale_enum", ["local", "regional", "international"])
export const handOutcomeEnum = pgEnum("hand_outcome_enum", ["Tsumo", "Ron", "Draw", "Chombo", "Mid Game Draw", "Nagashi Mangan"])
export const individualOutcomeEnum = pgEnum("individual_outcome_enum", ["Draw", "Ron", "Deal-in", "Tsumo", "Tsumo-loss", "Mid Game Draw", "Nagashi-win", "Nagashi-loss", "Chombo"])
export const influenceFactorEnum = pgEnum("influence_factor_enum", ["individual", "team"])
export const playerStatusEnum = pgEnum("player_status_enum", ["active", "pending", "rejected", "suspended"])
export const windEnum = pgEnum("wind_enum", ["E", "S", "W", "N"])
export const yakumanEnum = pgEnum("yakuman_enum", ["KazoeYakuman", "KokushiMusou", "KokushiMusou_13Men", "Daisangen", "SuuAnkou", "SuuAnkou_Tanki", "Shousuushi", "Daisuushi", "Tsuuiisou", "Ryuuiisou", "Chinroutou", "ChuurenPoutou", "Suukantsu", "Tenhou", "Chiihou", "JunsuiChuurenPoutou"])


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

export const eventInfo = pgTable.withRLS("event_info", {
	eventId: bigint("event_id", { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity({ name: "event_event_id_seq" }),
	title: text().notNull(),
	startDate: timestamp("start_date").notNull(),
	endDate: timestamp("end_date"),
	scale: eventScaleEnum().notNull(),
	location: text(),
	influenceFactor: influenceFactorEnum("influence_factor").notNull(),
	rulesetId: bigint("ruleset_id", { mode: 'number' }).references(() => rulesetInfo.id),
	numGames: integer("num_games"),
	totalPlayers: integer("total_players"),
	createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const eventResult = pgTable.withRLS("event_result", {
	eventId: bigint("event_id", { mode: 'number' }).notNull().references(() => eventInfo.eventId, { onDelete: "cascade" } ),
	playerId: integer("player_id").notNull().references(() => playerInfo.playerId, { onDelete: "cascade" } ),
	totalScore: integer("total_score").default(0).notNull(),
	netScore: integer("net_score").default(0).notNull(),
	positionCounts: jsonb("position_counts").default({}).notNull(),
	averagePosition: numeric("average_position"),
	gamesCount: integer("games_count").default(0).notNull(),
	finalPosition: integer("final_position"),
	createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	primaryKey({ columns: [table.eventId, table.playerId], name: "event_result_pkey"}),
]);

export const gameInfo = pgTable.withRLS("game_info", {
	gameId: bigint("game_id", { mode: 'number' }).primaryKey(),
	venueId: integer("venue_id").references(() => venue.venueId),
	modeId: integer("mode_id").references(() => mode.modeId),
	rulesetId: bigint("ruleset_id", { mode: 'number' }).references(() => rulesetInfo.id),
	recordedByPid: bigint("recorded_by_pid", { mode: 'number' }),
	createAt: timestamp("create_at").default(sql`CURRENT_TIMESTAMP`),
	endedAt: timestamp("ended_at"),
	deleted: boolean().default(false).notNull(),
	completed: boolean().default(false).notNull(),
	submitted: boolean().default(false).notNull(),
	submissionStage: text("submission_stage").default("SET_IS_RECORDED").notNull(),
	submitFail: boolean("submit_fail").default(false).notNull(),
	submitFailCount: integer("submit_fail_count").default(0).notNull(),
	uploadedAt: timestamp("uploaded_at"),
	finalScoreOnly: boolean("final_score_only").default(false).notNull(),
	isRecorded: boolean("is_recorded"),
	durationMins: bigint("duration_mins", { mode: 'number' }),
	leftoverDeposits: integer("leftover_deposits"),
});

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
]);

export const gameRuleset = pgTable.withRLS("game_ruleset", {
	id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
	referenceRulesetId: bigint("reference_ruleset_id", { mode: 'number' }).references(() => rulesetInfo.id),
	initialValue: integer("initial_value").notNull(),
	aka: akaEnum().notNull(),
	umaP1: integer("uma_p1").notNull(),
	umaP2: integer("uma_p2").notNull(),
	umaP3: integer("uma_p3").notNull(),
	umaP4: integer("uma_p4").notNull(),
	oka: integer().default(0).notNull(),
	chomboValue: integer("chombo_value").notNull(),
	chomboOption: chomboOptionEnum("chombo_option").notNull(),
	kiriageMangan: boolean("kiriage_mangan").notNull(),
	multipleRon: boolean("multiple_ron").notNull(),
});

export const handInfo = pgTable.withRLS("hand_info", {
	handId: bigint("hand_id", { mode: 'number' }).primaryKey(),
	gameId: bigint("game_id", { mode: 'number' }).notNull().references(() => gameInfo.gameId),
	handNum: integer("hand_num").notNull(),
	wind: windEnum().notNull(),
	roundNum: integer("round_num").notNull(),
	honba: integer().default(0).notNull(),
	riichiDeposits: integer("riichi_deposits").default(0).notNull(),
	handOutcome: handOutcomeEnum("hand_outcome"),
	han: integer().default(0),
	fu: integer().default(0),
	handValue: integer("hand_value").default(0),
	completed: boolean().default(false).notNull(),
	mainHid: bigint("main_hid", { mode: 'number' }),
	isMultipleRon: boolean("is_multiple_ron"),
	submittedRow: boolean("submitted_row").default(false),
});

export const handResult = pgTable.withRLS("hand_result", {
	ihid: bigint({ mode: 'number' }).primaryKey(),
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
	endScore: integer("end_score").notNull(),
	riichi: boolean().default(false).notNull(),
	tenpai: boolean().default(false).notNull(),
	dealer: boolean().notNull(),
	submittedRow: boolean("submitted_row"),
});

export const handTransaction = pgTable.withRLS("hand_transaction", {
	handId: bigint("hand_id", { mode: 'number' }).notNull().references(() => handInfo.handId),
	payerPlayerId: integer("payer_player_id").notNull().references(() => playerInfo.playerId),
	payeePlayerId: integer("payee_player_id").notNull().references(() => playerInfo.playerId),
	amount: integer(),
}, (table) => [
	primaryKey({ columns: [table.handId, table.payerPlayerId, table.payeePlayerId], name: "hand_transaction_pkey"}),
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
	pid: bigint({ mode: 'number' }).primaryKey().references(() => playerInfo.playerId, { onDelete: "cascade" } ),
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
}, (table) => [
	unique("player_details_contact_number_key").on(table.contactNumber),	unique("player_details_email_key").on(table.email),check("player_details_proficiency_check", sql`((proficiency >= 0) AND (proficiency <= 4))`),]);

export const playerInfo = pgTable.withRLS("player_info", {
	playerId: integer("player_id").primaryKey().generatedByDefaultAsIdentity(),
	displayName: text("display_name").notNull(),
	telegramId: bigint("telegram_id", { mode: 'number' }),
	status: playerStatusEnum().default("active"),
	ctryCd: text("ctry_cd").default("").notNull(),
	ctyCd: text("cty_cd").default("").notNull(),
}, (table) => [
	unique("players_telegram_id_key").on(table.telegramId),]);

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
	id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
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
});

export const venue = pgTable.withRLS("venue", {
	venueId: integer("Venue_id").primaryKey(),
	name: text().notNull(),
	status: boolean().default(false).notNull(),
}, (table) => [
	unique("venue_name_key").on(table.name),]);

export const yakumanRecord = pgTable.withRLS("yakuman_record", {
	yakumanId: bigint("yakuman_id", { mode: 'number' }).primaryKey(),
	pid: integer().notNull().references(() => playerInfo.playerId),
	gid: bigint({ mode: 'number' }).notNull().references(() => gameInfo.gameId),
	hid: bigint({ mode: 'number' }).references(() => handInfo.handId),
	yakumanType: yakumanEnum("yakuman_type").notNull(),
	scoreValue: integer("score_value"),
	eventDate: date("event_date").default(sql`CURRENT_DATE`).notNull(),
	source: text().default("manual").notNull(),
	createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
check("yakuman_record_source_check", sql`(source = ANY (ARRAY['manual'::text, 'auto'::text]))`),]);
