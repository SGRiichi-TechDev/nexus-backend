-- ============================================================
-- Migration: country_city_lookups
-- Applied remotely 2026-09-13 via MCP. This file exists so the
-- local migration history matches remote.
--
-- Replaces event_info.location (free text like 'Osaka, Japan') and
-- the interim event_info.country text column with proper lookups.
--
-- Codes are standards-based so they stay stable and comparable:
--   country_code  ISO 3166-1 alpha-2
--   city_code     IATA metropolitan / city code
--
-- event_info and event_result were empty at time of writing, so the
-- old columns are dropped outright rather than backfilled.
-- ============================================================

create table country (
    country_code char(2) primary key,
    name         text    not null unique,
    status       boolean not null default true
);

comment on table country is
    'ISO 3166-1 alpha-2 country codes. Add rows as new destinations appear; this is a lookup, not an enum.';

create table city (
    city_code    char(3) primary key,
    country_code char(2) not null references country(country_code),
    name         text    not null,
    status       boolean not null default true,
    unique (country_code, name)
);

comment on table city is
    'IATA metropolitan/city codes. Where a city has no IATA code, invent a stable 3-letter code and note it in name.';

create index idx_city_country on city(country_code);

insert into country (country_code, name) values
    ('SG','Singapore'), ('JP','Japan'),     ('FR','France'),
    ('CN','China'),     ('US','United States'), ('MO','Macau'),
    ('AT','Austria'),   ('NO','Norway'),    ('ES','Spain'),
    ('TW','Taiwan'),    ('ID','Indonesia'), ('AU','Australia'),
    ('HK','Hong Kong');

insert into city (city_code, country_code, name) values
    ('SIN','SG','Singapore'),
    ('OSA','JP','Osaka'),      ('TYO','JP','Tokyo'),     ('YOK','JP','Yokohama'),
    ('PAR','FR','Paris'),
    ('SYX','CN','Sanya'),
    ('LAS','US','Las Vegas'),  ('NYC','US','New York'),
    ('MFM','MO','Macau'),
    ('VIE','AT','Vienna'),
    ('OSL','NO','Oslo'),
    ('VLC','ES','Valencia'),
    ('KHH','TW','Kaohsiung'),
    ('JKT','ID','Jakarta'),
    ('MEL','AU','Melbourne'),
    ('HKG','HK','Hong Kong');

-- the XOR constraint assumed 'venue_id or free-text location'. Every event
-- now carries country/city, including home events, so the rule no longer holds.
alter table event_info
    drop constraint if exists event_info_one_locator;

alter table event_info
    drop column if exists location,
    drop column if exists country;

alter table event_info
    add column country_code char(2) references country(country_code),
    add column city_code    char(3) references city(city_code);

comment on column event_info.country_code is
    'Where the event was held. Home events are ''SG''. Orthogonal to scale: scale says who the event is FOR, country_code says where it was.';

comment on column event_info.city_code is
    'City the event was held in. Nullable: standing events (Private, Club, leagues) span venues and have no single city.';

create index idx_event_info_country_code on event_info(country_code);
