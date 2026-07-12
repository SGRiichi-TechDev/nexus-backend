


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."aka_enum" AS ENUM (
    'Aka-Ari',
    'Aka-Nashi'
);


ALTER TYPE "public"."aka_enum" OWNER TO "postgres";


CREATE TYPE "public"."chombo_option_enum" AS ENUM (
    'Payment to all',
    'Flat deduction'
);


ALTER TYPE "public"."chombo_option_enum" OWNER TO "postgres";


CREATE TYPE "public"."event_scale_enum" AS ENUM (
    'local',
    'regional',
    'international'
);


ALTER TYPE "public"."event_scale_enum" OWNER TO "postgres";


CREATE TYPE "public"."hand_outcome_enum" AS ENUM (
    'Tsumo',
    'Ron',
    'Draw',
    'Chombo',
    'Mid Game Draw',
    'Nagashi Mangan'
);


ALTER TYPE "public"."hand_outcome_enum" OWNER TO "postgres";


CREATE TYPE "public"."individual_outcome_enum" AS ENUM (
    'Draw',
    'Ron',
    'Deal-in',
    'Tsumo',
    'Tsumo-loss',
    'Mid Game Draw',
    'Nagashi-win',
    'Nagashi-loss',
    'Chombo'
);


ALTER TYPE "public"."individual_outcome_enum" OWNER TO "postgres";


CREATE TYPE "public"."influence_factor_enum" AS ENUM (
    'individual',
    'team'
);


ALTER TYPE "public"."influence_factor_enum" OWNER TO "postgres";


CREATE TYPE "public"."player_status_enum" AS ENUM (
    'active',
    'pending',
    'rejected',
    'suspended'
);


ALTER TYPE "public"."player_status_enum" OWNER TO "postgres";


CREATE TYPE "public"."wind_enum" AS ENUM (
    'E',
    'S',
    'W',
    'N'
);


ALTER TYPE "public"."wind_enum" OWNER TO "postgres";


CREATE TYPE "public"."yakuman_enum" AS ENUM (
    'KazoeYakuman',
    'KokushiMusou',
    'KokushiMusou_13Men',
    'Daisangen',
    'SuuAnkou',
    'SuuAnkou_Tanki',
    'Shousuushi',
    'Daisuushi',
    'Tsuuiisou',
    'Ryuuiisou',
    'Chinroutou',
    'ChuurenPoutou',
    'Suukantsu',
    'Tenhou',
    'Chiihou',
    'JunsuiChuurenPoutou'
);


ALTER TYPE "public"."yakuman_enum" OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."admin" (
    "id" integer NOT NULL,
    "deleted" boolean DEFAULT false NOT NULL,
    "telegram_id" bigint NOT NULL,
    "is_super_admin" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."admin" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."akako_msg" (
    "key" "text" NOT NULL,
    "value" "text" NOT NULL
);


ALTER TABLE "public"."akako_msg" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_info" (
    "event_id" bigint NOT NULL,
    "title" "text" NOT NULL,
    "start_date" timestamp without time zone NOT NULL,
    "end_date" timestamp without time zone,
    "scale" "public"."event_scale_enum" NOT NULL,
    "location" "text",
    "influence_factor" "public"."influence_factor_enum" NOT NULL,
    "ruleset_id" bigint,
    "num_games" integer,
    "total_players" integer,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."event_info" OWNER TO "postgres";


ALTER TABLE "public"."event_info" ALTER COLUMN "event_id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."event_event_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."event_result" (
    "event_id" bigint NOT NULL,
    "player_id" integer NOT NULL,
    "total_score" integer DEFAULT 0 NOT NULL,
    "net_score" integer DEFAULT 0 NOT NULL,
    "position_counts" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "average_position" numeric,
    "games_count" integer DEFAULT 0 NOT NULL,
    "final_position" integer,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."event_result" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."game_info" (
    "game_id" bigint NOT NULL,
    "venue_id" integer,
    "mode_id" integer,
    "ruleset_id" bigint,
    "recorded_by_pid" bigint,
    "create_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "ended_at" timestamp without time zone,
    "deleted" boolean DEFAULT false NOT NULL,
    "completed" boolean DEFAULT false NOT NULL,
    "submitted" boolean DEFAULT false NOT NULL,
    "submission_stage" "text" DEFAULT 'SET_IS_RECORDED'::"text" NOT NULL,
    "submit_fail" boolean DEFAULT false NOT NULL,
    "submit_fail_count" integer DEFAULT 0 NOT NULL,
    "uploaded_at" timestamp without time zone,
    "final_score_only" boolean DEFAULT false NOT NULL,
    "is_recorded" boolean,
    "duration_mins" bigint,
    "leftover_deposits" integer
);


ALTER TABLE "public"."game_info" OWNER TO "postgres";


COMMENT ON COLUMN "public"."game_info"."create_at" IS 'The time that this row data is created in this table';



COMMENT ON COLUMN "public"."game_info"."ended_at" IS 'The time that this game submitted';



COMMENT ON COLUMN "public"."game_info"."submitted" IS 'TODO: Remove after decommission google sheets';



COMMENT ON COLUMN "public"."game_info"."submission_stage" IS 'Identify which stage of submission this record is at';



COMMENT ON COLUMN "public"."game_info"."submit_fail" IS 'TODO: Remove after decommission google sheets';



COMMENT ON COLUMN "public"."game_info"."submit_fail_count" IS 'TODO: Remove after decommission google sheets';



COMMENT ON COLUMN "public"."game_info"."uploaded_at" IS 'The time it gets uploaded to database';



COMMENT ON COLUMN "public"."game_info"."duration_mins" IS 'duration taken to complete the score submission';



COMMENT ON COLUMN "public"."game_info"."leftover_deposits" IS 'Riichi sticks left at end of the game';



CREATE TABLE IF NOT EXISTS "public"."game_result" (
    "game_id" bigint NOT NULL,
    "starting_seat" smallint NOT NULL,
    "player_id" integer,
    "final_score" integer NOT NULL,
    "final_position" numeric DEFAULT 2.5 NOT NULL,
    "total_penalty_points" numeric,
    "submitted_row" boolean DEFAULT false
);


ALTER TABLE "public"."game_result" OWNER TO "postgres";


COMMENT ON COLUMN "public"."game_result"."starting_seat" IS 'the starting wind position of the player';



COMMENT ON COLUMN "public"."game_result"."submitted_row" IS 'TODO: Remove after decommission google sheets';



CREATE TABLE IF NOT EXISTS "public"."game_ruleset" (
    "id" bigint NOT NULL,
    "reference_ruleset_id" bigint,
    "initial_value" integer NOT NULL,
    "aka" "public"."aka_enum" NOT NULL,
    "uma_p1" integer NOT NULL,
    "uma_p2" integer NOT NULL,
    "uma_p3" integer NOT NULL,
    "uma_p4" integer NOT NULL,
    "oka" integer DEFAULT 0 NOT NULL,
    "chombo_value" integer NOT NULL,
    "chombo_option" "public"."chombo_option_enum" NOT NULL,
    "kiriage_mangan" boolean NOT NULL,
    "multiple_ron" boolean NOT NULL
);


ALTER TABLE "public"."game_ruleset" OWNER TO "postgres";


COMMENT ON TABLE "public"."game_ruleset" IS 'Snapshot of the exact rule values (uma, oka, chombo, aka, etc.) a game was actually played under';



ALTER TABLE "public"."game_ruleset" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."game_ruleset_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."hand_info" (
    "hand_id" bigint NOT NULL,
    "game_id" bigint NOT NULL,
    "hand_num" integer NOT NULL,
    "wind" "public"."wind_enum" NOT NULL,
    "round_num" integer NOT NULL,
    "honba" integer DEFAULT 0 NOT NULL,
    "riichi_deposits" integer DEFAULT 0 NOT NULL,
    "hand_outcome" "public"."hand_outcome_enum",
    "han" integer DEFAULT 0,
    "fu" integer DEFAULT 0,
    "hand_value" integer DEFAULT 0,
    "completed" boolean DEFAULT false NOT NULL,
    "main_hid" bigint,
    "is_multiple_ron" boolean,
    "submitted_row" boolean DEFAULT false
);


ALTER TABLE "public"."hand_info" OWNER TO "postgres";


COMMENT ON COLUMN "public"."hand_info"."riichi_deposits" IS 'Kyoutaku';



COMMENT ON COLUMN "public"."hand_info"."submitted_row" IS 'TODO: Remove after decommission google sheets';



CREATE TABLE IF NOT EXISTS "public"."hand_result" (
    "ihid" bigint NOT NULL,
    "game_info" bigint NOT NULL,
    "hand_id" bigint NOT NULL,
    "player_id" integer NOT NULL,
    "outcome" "public"."individual_outcome_enum",
    "position" numeric,
    "deal_into_riichi" boolean,
    "deal_into_oya" boolean,
    "riichi_order" integer,
    "chombo" boolean DEFAULT false NOT NULL,
    "score_change" integer DEFAULT 0 NOT NULL,
    "start_score" integer NOT NULL,
    "end_score" integer NOT NULL,
    "riichi" boolean DEFAULT false NOT NULL,
    "tenpai" boolean DEFAULT false NOT NULL,
    "dealer" boolean NOT NULL,
    "submitted_row" boolean
);


ALTER TABLE "public"."hand_result" OWNER TO "postgres";


COMMENT ON COLUMN "public"."hand_result"."submitted_row" IS 'TODO: Remove after decommission google sheets';



CREATE TABLE IF NOT EXISTS "public"."hand_transaction" (
    "hand_id" bigint NOT NULL,
    "payer_player_id" integer NOT NULL,
    "payee_player_id" integer NOT NULL,
    "amount" integer
);


ALTER TABLE "public"."hand_transaction" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."local_text" (
    "key" "text" NOT NULL,
    "value" "text" NOT NULL
);


ALTER TABLE "public"."local_text" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mode" (
    "mode_id" integer NOT NULL,
    "venue_id" integer NOT NULL,
    "name" "text" NOT NULL,
    "status" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."mode" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."permissions" (
    "id" bigint NOT NULL,
    "name" "text" NOT NULL
);


ALTER TABLE "public"."permissions" OWNER TO "postgres";


COMMENT ON TABLE "public"."permissions" IS 'Stores the set of all actions that can be performed in the admin portal. Each permission represents a single, atomic operation that can be assigned to roles.';



ALTER TABLE "public"."permissions" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."permissions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."player_details" (
    "pid" bigint NOT NULL,
    "date_joined" "date" DEFAULT CURRENT_DATE NOT NULL,
    "full_name_nric" "text" DEFAULT ''::"text" NOT NULL,
    "surname" "text" DEFAULT ''::"text" NOT NULL,
    "display_name_format" "text" DEFAULT ''::"text" NOT NULL,
    "year_of_birth_range" "text" DEFAULT ''::"text" NOT NULL,
    "proficiency" smallint DEFAULT 0 NOT NULL,
    "consent" boolean DEFAULT true NOT NULL,
    "email" "text" DEFAULT ''::"text",
    "referred_by" "text" DEFAULT ''::"text" NOT NULL,
    "contact_number" bigint,
    CONSTRAINT "player_details_proficiency_check" CHECK ((("proficiency" >= 0) AND ("proficiency" <= 4)))
);


ALTER TABLE "public"."player_details" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."player_info" (
    "player_id" integer NOT NULL,
    "display_name" "text" NOT NULL,
    "telegram_id" bigint,
    "status" "public"."player_status_enum" DEFAULT 'active'::"public"."player_status_enum",
    "ctry_cd" "text" DEFAULT ''::"text" NOT NULL,
    "cty_cd" "text" DEFAULT ''::"text" NOT NULL
);


ALTER TABLE "public"."player_info" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."role_permissions" (
    "role_id" bigint NOT NULL,
    "permission_id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text") NOT NULL
);


ALTER TABLE "public"."role_permissions" OWNER TO "postgres";


COMMENT ON TABLE "public"."role_permissions" IS 'Stores the mapping between roles and permissions. Each record defines which permissions are granted to a specific role as part of the role-based access control (RBAC) system.';



CREATE TABLE IF NOT EXISTS "public"."roles" (
    "id" bigint NOT NULL,
    "role_name" "text" NOT NULL
);


ALTER TABLE "public"."roles" OWNER TO "postgres";


COMMENT ON TABLE "public"."roles" IS 'Roles of users of admin portal webapp';



ALTER TABLE "public"."roles" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."roles_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."rule_details" (
    "rule_details_id" smallint NOT NULL,
    "effective_start" "date" NOT NULL,
    "effective_end" "date" NOT NULL
);


ALTER TABLE "public"."rule_details" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ruleset_info" (
    "id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "initial_value" integer DEFAULT 250 NOT NULL,
    "aka" "public"."aka_enum" NOT NULL,
    "uma_p1" integer NOT NULL,
    "uma_p2" integer NOT NULL,
    "uma_p3" integer NOT NULL,
    "uma_p4" integer NOT NULL,
    "oka" integer DEFAULT 0 NOT NULL,
    "kiriage_mangan" boolean DEFAULT true NOT NULL,
    "multiple_ron" boolean DEFAULT false NOT NULL,
    "chombo_value" integer DEFAULT 40 NOT NULL,
    "chombo_option" "public"."chombo_option_enum" NOT NULL,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "more_details" smallint,
    "uma_cal" integer DEFAULT 0 NOT NULL,
    "effective_start" timestamp with time zone,
    "effective_end" timestamp with time zone
);


ALTER TABLE "public"."ruleset_info" OWNER TO "postgres";


COMMENT ON TABLE "public"."ruleset_info" IS 'Admin-managed, named presets defining a set of rule values (uma, oka, chombo, aka, etc.).';



CREATE TABLE IF NOT EXISTS "public"."score_lookup" (
    "id" integer NOT NULL,
    "han" integer DEFAULT 0 NOT NULL,
    "fu" integer DEFAULT 0 NOT NULL,
    "dealer" boolean DEFAULT false NOT NULL,
    "kiriage_mangan" boolean DEFAULT false NOT NULL,
    "honba_multiplier" integer DEFAULT 0 NOT NULL,
    "value" integer NOT NULL,
    "outcome" "public"."individual_outcome_enum" NOT NULL
);


ALTER TABLE "public"."score_lookup" OWNER TO "postgres";


ALTER TABLE "public"."score_lookup" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."score_lookup_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "user_id" bigint NOT NULL,
    "role_id" bigint NOT NULL,
    "valid_from" timestamp with time zone NOT NULL,
    "valid_until" timestamp with time zone,
    "granted_by" bigint,
    "created_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text") NOT NULL
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_roles" IS 'Stores mappings between users and roles.';



CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "email" "text" NOT NULL,
    "status" "text" NOT NULL
);


ALTER TABLE "public"."users" OWNER TO "postgres";


COMMENT ON TABLE "public"."users" IS 'Users of admin portal webapp';



ALTER TABLE "public"."users" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."users_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."venue" (
    "Venue_id" integer NOT NULL,
    "name" "text" NOT NULL,
    "status" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."venue" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."yakuman_record" (
    "yakuman_id" bigint NOT NULL,
    "pid" integer NOT NULL,
    "gid" bigint NOT NULL,
    "hid" bigint,
    "yakuman_type" "public"."yakuman_enum" NOT NULL,
    "score_value" integer,
    "event_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "source" "text" DEFAULT 'manual'::"text" NOT NULL,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "yakuman_record_source_check" CHECK (("source" = ANY (ARRAY['manual'::"text", 'auto'::"text"])))
);


ALTER TABLE "public"."yakuman_record" OWNER TO "postgres";


ALTER TABLE ONLY "public"."admin"
    ADD CONSTRAINT "admin_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."akako_msg"
    ADD CONSTRAINT "akako_msg_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."event_info"
    ADD CONSTRAINT "event_pkey" PRIMARY KEY ("event_id");



ALTER TABLE ONLY "public"."event_result"
    ADD CONSTRAINT "event_result_pkey" PRIMARY KEY ("event_id", "player_id");



ALTER TABLE ONLY "public"."game_info"
    ADD CONSTRAINT "game_info_pkey" PRIMARY KEY ("game_id");



ALTER TABLE ONLY "public"."game_result"
    ADD CONSTRAINT "game_result_pkey" PRIMARY KEY ("game_id", "starting_seat");



ALTER TABLE ONLY "public"."game_ruleset"
    ADD CONSTRAINT "game_ruleset_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."hand_info"
    ADD CONSTRAINT "hand_info_pkey" PRIMARY KEY ("hand_id");



ALTER TABLE ONLY "public"."hand_result"
    ADD CONSTRAINT "hand_result_pkey" PRIMARY KEY ("ihid");



ALTER TABLE ONLY "public"."hand_transaction"
    ADD CONSTRAINT "hand_transaction_pkey" PRIMARY KEY ("hand_id", "payer_player_id", "payee_player_id");



ALTER TABLE ONLY "public"."local_text"
    ADD CONSTRAINT "local_text_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."mode"
    ADD CONSTRAINT "mode_pkey" PRIMARY KEY ("mode_id");



ALTER TABLE ONLY "public"."permissions"
    ADD CONSTRAINT "permissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."player_details"
    ADD CONSTRAINT "player_details_contact_number_key" UNIQUE ("contact_number");



ALTER TABLE ONLY "public"."player_details"
    ADD CONSTRAINT "player_details_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."player_details"
    ADD CONSTRAINT "player_details_pkey" PRIMARY KEY ("pid");



ALTER TABLE ONLY "public"."player_info"
    ADD CONSTRAINT "players_pkey" PRIMARY KEY ("player_id");



ALTER TABLE ONLY "public"."player_info"
    ADD CONSTRAINT "players_telegram_id_key" UNIQUE ("telegram_id");



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id", "permission_id");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rule_details"
    ADD CONSTRAINT "rule_details_pkey" PRIMARY KEY ("rule_details_id");



ALTER TABLE ONLY "public"."ruleset_info"
    ADD CONSTRAINT "ruleset_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."score_lookup"
    ADD CONSTRAINT "score_lookup_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id", "role_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."venue"
    ADD CONSTRAINT "venue_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."venue"
    ADD CONSTRAINT "venue_pkey" PRIMARY KEY ("Venue_id");



ALTER TABLE ONLY "public"."yakuman_record"
    ADD CONSTRAINT "yakuman_record_pkey" PRIMARY KEY ("yakuman_id");



ALTER TABLE ONLY "public"."event_result"
    ADD CONSTRAINT "event_result_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."event_info"("event_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_result"
    ADD CONSTRAINT "event_result_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."player_info"("player_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_info"
    ADD CONSTRAINT "event_ruleset_id_fkey" FOREIGN KEY ("ruleset_id") REFERENCES "public"."ruleset_info"("id");



ALTER TABLE ONLY "public"."game_info"
    ADD CONSTRAINT "game_info_mode_id_fkey" FOREIGN KEY ("mode_id") REFERENCES "public"."mode"("mode_id");



ALTER TABLE ONLY "public"."game_info"
    ADD CONSTRAINT "game_info_ruleset_id_fkey" FOREIGN KEY ("ruleset_id") REFERENCES "public"."ruleset_info"("id");



ALTER TABLE ONLY "public"."game_info"
    ADD CONSTRAINT "game_info_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "public"."venue"("Venue_id");



ALTER TABLE ONLY "public"."game_result"
    ADD CONSTRAINT "game_result_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "public"."game_info"("game_id");



ALTER TABLE ONLY "public"."game_result"
    ADD CONSTRAINT "game_result_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."player_info"("player_id");



ALTER TABLE ONLY "public"."game_ruleset"
    ADD CONSTRAINT "game_ruleset_reference_ruleset_id_fkey" FOREIGN KEY ("reference_ruleset_id") REFERENCES "public"."ruleset_info"("id");



ALTER TABLE ONLY "public"."hand_info"
    ADD CONSTRAINT "hand_info_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "public"."game_info"("game_id");



ALTER TABLE ONLY "public"."hand_result"
    ADD CONSTRAINT "hand_result_game_info_fkey" FOREIGN KEY ("game_info") REFERENCES "public"."game_info"("game_id");



ALTER TABLE ONLY "public"."hand_result"
    ADD CONSTRAINT "hand_result_hand_id_fkey" FOREIGN KEY ("hand_id") REFERENCES "public"."hand_info"("hand_id");



ALTER TABLE ONLY "public"."hand_result"
    ADD CONSTRAINT "hand_result_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."player_info"("player_id");



ALTER TABLE ONLY "public"."hand_transaction"
    ADD CONSTRAINT "hand_transaction_hand_id_fkey" FOREIGN KEY ("hand_id") REFERENCES "public"."hand_info"("hand_id");



ALTER TABLE ONLY "public"."hand_transaction"
    ADD CONSTRAINT "hand_transaction_payee_player_id_fkey" FOREIGN KEY ("payee_player_id") REFERENCES "public"."player_info"("player_id");



ALTER TABLE ONLY "public"."hand_transaction"
    ADD CONSTRAINT "hand_transaction_payer_player_id_fkey" FOREIGN KEY ("payer_player_id") REFERENCES "public"."player_info"("player_id");



ALTER TABLE ONLY "public"."mode"
    ADD CONSTRAINT "mode_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "public"."venue"("Venue_id");



ALTER TABLE ONLY "public"."player_details"
    ADD CONSTRAINT "player_details_pid_fkey" FOREIGN KEY ("pid") REFERENCES "public"."player_info"("player_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id");



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id");



ALTER TABLE ONLY "public"."ruleset_info"
    ADD CONSTRAINT "ruleset_more_details_fkey" FOREIGN KEY ("more_details") REFERENCES "public"."rule_details"("rule_details_id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."yakuman_record"
    ADD CONSTRAINT "yakuman_record_gid_fkey" FOREIGN KEY ("gid") REFERENCES "public"."game_info"("game_id");



ALTER TABLE ONLY "public"."yakuman_record"
    ADD CONSTRAINT "yakuman_record_hid_fkey" FOREIGN KEY ("hid") REFERENCES "public"."hand_info"("hand_id");



ALTER TABLE ONLY "public"."yakuman_record"
    ADD CONSTRAINT "yakuman_record_pid_fkey" FOREIGN KEY ("pid") REFERENCES "public"."player_info"("player_id");



ALTER TABLE "public"."admin" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."akako_msg" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_info" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_result" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."game_info" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."game_result" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."game_ruleset" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."hand_info" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."hand_result" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."hand_transaction" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."local_text" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."mode" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."permissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."player_details" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."player_info" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."role_permissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rule_details" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ruleset_info" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."score_lookup" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."venue" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."yakuman_record" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";





































































































































































GRANT ALL ON TABLE "public"."admin" TO "anon";
GRANT ALL ON TABLE "public"."admin" TO "authenticated";
GRANT ALL ON TABLE "public"."admin" TO "service_role";



GRANT ALL ON TABLE "public"."akako_msg" TO "anon";
GRANT ALL ON TABLE "public"."akako_msg" TO "authenticated";
GRANT ALL ON TABLE "public"."akako_msg" TO "service_role";



GRANT ALL ON TABLE "public"."event_info" TO "anon";
GRANT ALL ON TABLE "public"."event_info" TO "authenticated";
GRANT ALL ON TABLE "public"."event_info" TO "service_role";



GRANT ALL ON SEQUENCE "public"."event_event_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."event_event_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."event_event_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."event_result" TO "anon";
GRANT ALL ON TABLE "public"."event_result" TO "authenticated";
GRANT ALL ON TABLE "public"."event_result" TO "service_role";



GRANT ALL ON TABLE "public"."game_info" TO "anon";
GRANT ALL ON TABLE "public"."game_info" TO "authenticated";
GRANT ALL ON TABLE "public"."game_info" TO "service_role";



GRANT ALL ON TABLE "public"."game_result" TO "anon";
GRANT ALL ON TABLE "public"."game_result" TO "authenticated";
GRANT ALL ON TABLE "public"."game_result" TO "service_role";



GRANT ALL ON TABLE "public"."game_ruleset" TO "anon";
GRANT ALL ON TABLE "public"."game_ruleset" TO "authenticated";
GRANT ALL ON TABLE "public"."game_ruleset" TO "service_role";



GRANT ALL ON SEQUENCE "public"."game_ruleset_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."game_ruleset_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."game_ruleset_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."hand_info" TO "anon";
GRANT ALL ON TABLE "public"."hand_info" TO "authenticated";
GRANT ALL ON TABLE "public"."hand_info" TO "service_role";



GRANT ALL ON TABLE "public"."hand_result" TO "anon";
GRANT ALL ON TABLE "public"."hand_result" TO "authenticated";
GRANT ALL ON TABLE "public"."hand_result" TO "service_role";



GRANT ALL ON TABLE "public"."hand_transaction" TO "anon";
GRANT ALL ON TABLE "public"."hand_transaction" TO "authenticated";
GRANT ALL ON TABLE "public"."hand_transaction" TO "service_role";



GRANT ALL ON TABLE "public"."local_text" TO "anon";
GRANT ALL ON TABLE "public"."local_text" TO "authenticated";
GRANT ALL ON TABLE "public"."local_text" TO "service_role";



GRANT ALL ON TABLE "public"."mode" TO "anon";
GRANT ALL ON TABLE "public"."mode" TO "authenticated";
GRANT ALL ON TABLE "public"."mode" TO "service_role";



GRANT ALL ON TABLE "public"."permissions" TO "anon";
GRANT ALL ON TABLE "public"."permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."permissions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."permissions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."permissions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."permissions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."player_details" TO "anon";
GRANT ALL ON TABLE "public"."player_details" TO "authenticated";
GRANT ALL ON TABLE "public"."player_details" TO "service_role";



GRANT ALL ON TABLE "public"."player_info" TO "anon";
GRANT ALL ON TABLE "public"."player_info" TO "authenticated";
GRANT ALL ON TABLE "public"."player_info" TO "service_role";



GRANT ALL ON TABLE "public"."role_permissions" TO "anon";
GRANT ALL ON TABLE "public"."role_permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."role_permissions" TO "service_role";



GRANT ALL ON TABLE "public"."roles" TO "anon";
GRANT ALL ON TABLE "public"."roles" TO "authenticated";
GRANT ALL ON TABLE "public"."roles" TO "service_role";



GRANT ALL ON SEQUENCE "public"."roles_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."roles_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."roles_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."rule_details" TO "anon";
GRANT ALL ON TABLE "public"."rule_details" TO "authenticated";
GRANT ALL ON TABLE "public"."rule_details" TO "service_role";



GRANT ALL ON TABLE "public"."ruleset_info" TO "anon";
GRANT ALL ON TABLE "public"."ruleset_info" TO "authenticated";
GRANT ALL ON TABLE "public"."ruleset_info" TO "service_role";



GRANT ALL ON TABLE "public"."score_lookup" TO "anon";
GRANT ALL ON TABLE "public"."score_lookup" TO "authenticated";
GRANT ALL ON TABLE "public"."score_lookup" TO "service_role";



GRANT ALL ON SEQUENCE "public"."score_lookup_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."score_lookup_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."score_lookup_id_seq" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."user_roles" TO "anon";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."user_roles" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."user_roles" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON SEQUENCE "public"."users_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."users_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."users_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."venue" TO "anon";
GRANT ALL ON TABLE "public"."venue" TO "authenticated";
GRANT ALL ON TABLE "public"."venue" TO "service_role";



GRANT ALL ON TABLE "public"."yakuman_record" TO "anon";
GRANT ALL ON TABLE "public"."yakuman_record" TO "authenticated";
GRANT ALL ON TABLE "public"."yakuman_record" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































drop extension if exists "pg_net";


