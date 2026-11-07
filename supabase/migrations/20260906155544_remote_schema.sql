revoke delete on table "public"."uma_floating_bracket" from "anon";

revoke insert on table "public"."uma_floating_bracket" from "anon";

revoke references on table "public"."uma_floating_bracket" from "anon";

revoke select on table "public"."uma_floating_bracket" from "anon";

revoke trigger on table "public"."uma_floating_bracket" from "anon";

revoke truncate on table "public"."uma_floating_bracket" from "anon";

revoke update on table "public"."uma_floating_bracket" from "anon";

revoke delete on table "public"."uma_floating_bracket" from "authenticated";

revoke insert on table "public"."uma_floating_bracket" from "authenticated";

revoke references on table "public"."uma_floating_bracket" from "authenticated";

revoke select on table "public"."uma_floating_bracket" from "authenticated";

revoke trigger on table "public"."uma_floating_bracket" from "authenticated";

revoke truncate on table "public"."uma_floating_bracket" from "authenticated";

revoke update on table "public"."uma_floating_bracket" from "authenticated";

revoke delete on table "public"."uma_floating_bracket" from "service_role";

revoke insert on table "public"."uma_floating_bracket" from "service_role";

revoke references on table "public"."uma_floating_bracket" from "service_role";

revoke select on table "public"."uma_floating_bracket" from "service_role";

revoke trigger on table "public"."uma_floating_bracket" from "service_role";

revoke truncate on table "public"."uma_floating_bracket" from "service_role";

revoke update on table "public"."uma_floating_bracket" from "service_role";

alter table "public"."uma_floating_bracket" drop constraint "float_count_range";

alter table "public"."uma_floating_bracket" drop constraint "uma_floating_bracket_pkey";

drop index if exists "public"."uma_floating_bracket_pkey";

drop table "public"."uma_floating_bracket";


  create table "public"."uma_floating_lookup" (
    "floating_uma_id" integer not null,
    "float_count" smallint not null,
    "description" text not null,
    "uma_rank1" integer not null,
    "uma_rank2" integer not null,
    "uma_rank3" integer not null,
    "uma_rank4" integer not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."uma_floating_lookup" enable row level security;

CREATE UNIQUE INDEX uma_floating_bracket_pkey ON public.uma_floating_lookup USING btree (floating_uma_id, float_count);

alter table "public"."uma_floating_lookup" add constraint "uma_floating_bracket_pkey" PRIMARY KEY using index "uma_floating_bracket_pkey";

alter table "public"."uma_floating_lookup" add constraint "float_count_range" CHECK ((float_count = ANY (ARRAY[1, 2, 3]))) not valid;

alter table "public"."uma_floating_lookup" validate constraint "float_count_range";

grant delete on table "public"."uma_floating_lookup" to "anon";

grant insert on table "public"."uma_floating_lookup" to "anon";

grant references on table "public"."uma_floating_lookup" to "anon";

grant select on table "public"."uma_floating_lookup" to "anon";

grant trigger on table "public"."uma_floating_lookup" to "anon";

grant truncate on table "public"."uma_floating_lookup" to "anon";

grant update on table "public"."uma_floating_lookup" to "anon";

grant delete on table "public"."uma_floating_lookup" to "authenticated";

grant insert on table "public"."uma_floating_lookup" to "authenticated";

grant references on table "public"."uma_floating_lookup" to "authenticated";

grant select on table "public"."uma_floating_lookup" to "authenticated";

grant trigger on table "public"."uma_floating_lookup" to "authenticated";

grant truncate on table "public"."uma_floating_lookup" to "authenticated";

grant update on table "public"."uma_floating_lookup" to "authenticated";

grant delete on table "public"."uma_floating_lookup" to "service_role";

grant insert on table "public"."uma_floating_lookup" to "service_role";

grant references on table "public"."uma_floating_lookup" to "service_role";

grant select on table "public"."uma_floating_lookup" to "service_role";

grant trigger on table "public"."uma_floating_lookup" to "service_role";

grant truncate on table "public"."uma_floating_lookup" to "service_role";

grant update on table "public"."uma_floating_lookup" to "service_role";


