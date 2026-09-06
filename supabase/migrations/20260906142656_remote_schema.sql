
  create table "public"."uma_floating_bracket" (
    "scheme_id" integer not null,
    "float_count" smallint not null,
    "scheme_name" text not null,
    "p1" integer not null,
    "p2" integer not null,
    "p3" integer not null,
    "p4" integer not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."uma_floating_bracket" enable row level security;

CREATE UNIQUE INDEX uma_floating_bracket_pkey ON public.uma_floating_bracket USING btree (scheme_id, float_count);

alter table "public"."uma_floating_bracket" add constraint "uma_floating_bracket_pkey" PRIMARY KEY using index "uma_floating_bracket_pkey";

alter table "public"."uma_floating_bracket" add constraint "float_count_range" CHECK ((float_count = ANY (ARRAY[1, 2, 3]))) not valid;

alter table "public"."uma_floating_bracket" validate constraint "float_count_range";

grant delete on table "public"."uma_floating_bracket" to "anon";

grant insert on table "public"."uma_floating_bracket" to "anon";

grant references on table "public"."uma_floating_bracket" to "anon";

grant select on table "public"."uma_floating_bracket" to "anon";

grant trigger on table "public"."uma_floating_bracket" to "anon";

grant truncate on table "public"."uma_floating_bracket" to "anon";

grant update on table "public"."uma_floating_bracket" to "anon";

grant delete on table "public"."uma_floating_bracket" to "authenticated";

grant insert on table "public"."uma_floating_bracket" to "authenticated";

grant references on table "public"."uma_floating_bracket" to "authenticated";

grant select on table "public"."uma_floating_bracket" to "authenticated";

grant trigger on table "public"."uma_floating_bracket" to "authenticated";

grant truncate on table "public"."uma_floating_bracket" to "authenticated";

grant update on table "public"."uma_floating_bracket" to "authenticated";

grant delete on table "public"."uma_floating_bracket" to "service_role";

grant insert on table "public"."uma_floating_bracket" to "service_role";

grant references on table "public"."uma_floating_bracket" to "service_role";

grant select on table "public"."uma_floating_bracket" to "service_role";

grant trigger on table "public"."uma_floating_bracket" to "service_role";

grant truncate on table "public"."uma_floating_bracket" to "service_role";

grant update on table "public"."uma_floating_bracket" to "service_role";


