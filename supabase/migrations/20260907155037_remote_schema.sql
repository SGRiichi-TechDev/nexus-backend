create type "public"."game_status" as enum ('draft', 'pending_edit', 'pending_submit', 'approved', 'rejected');

create type "public"."uma_calculation_method" as enum ('positional', 'floating');

alter table "public"."game_info" add column "calculation_method" public.uma_calculation_method not null;

alter table "public"."game_info" add column "floating_scheme_id" integer;

alter table "public"."game_info" add column "status" public.game_status not null default 'draft'::public.game_status;

CREATE INDEX game_info_status_active_idx ON public.game_info USING btree (status) WHERE (deleted = false);

alter table "public"."game_info" add constraint "game_info_uma_method_fk_match" CHECK ((((calculation_method = 'positional'::public.uma_calculation_method) AND (floating_scheme_id IS NULL)) OR ((calculation_method = 'floating'::public.uma_calculation_method) AND (positional_uma_id IS NULL) AND (floating_scheme_id IS NOT NULL)))) not valid;

alter table "public"."game_info" validate constraint "game_info_uma_method_fk_match";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.block_uma_value_updates()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF (OLD.uma_rank1, OLD.uma_rank2, OLD.uma_rank3, OLD.uma_rank4)
       IS DISTINCT FROM
       (NEW.uma_rank1, NEW.uma_rank2, NEW.uma_rank3, NEW.uma_rank4)
    THEN
        RAISE EXCEPTION
            'uma values are append-only: add a new row instead of editing positional_uma_id %',
            OLD.positional_uma_id;
    END IF;
    RETURN NEW;
END;
$function$
;

CREATE TRIGGER uma_lookup_append_only BEFORE UPDATE ON public.uma_positional_lookup FOR EACH ROW EXECUTE FUNCTION public.block_uma_value_updates();


