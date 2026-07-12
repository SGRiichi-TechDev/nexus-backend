SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict MgURAJYuVujtyR3J7ezyirxhG2IqEBcbaWoHzybfWhczBKyViV0xrkZ5AWka6an

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: custom_oauth_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: webauthn_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: webauthn_credentials; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: admin; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: akako_msg; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: rule_details; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."rule_details" ("rule_details_id", "effective_start", "effective_end") VALUES
	(1, '2025-05-01', '2100-12-31');


--
-- Data for Name: ruleset; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."ruleset_info" ("id", "name", "description", "initial_value", "aka", "uma_p1", "uma_p2", "uma_p3", "uma_p4", "oka", "kiriage_mangan", "multiple_ron", "chombo_value", "chombo_option", "created_at", "more_details", "uma_cal", "effective_start", "effective_end") VALUES
	(2, 'WRC 2025 Aka-Nashi', NULL, 300, 'Aka-Nashi', 15, 5, -5, -15, 0, true, false, 40, 'Payment to all', '2026-06-02 14:40:25.781821', 1, 0, NULL, NULL);


--
-- Data for Name: event; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: players; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."player_info" ("display_name", "telegram_id", "status") VALUES
	('Toby Teo', 251181535, 'active');


--
-- Data for Name: event_result; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: venue; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: mode; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: game_info; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: game_result; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: game_ruleset; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: hand_info; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: hand_result; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: local_text; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."local_text" ("key", "value") VALUES
	('help', 'Default help text.');


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: player_details; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."roles" ("id", "role_name") VALUES
	(1, 'superadmin'),
	(2, 'admin'),
	(3, 'user'),
	(4, 'organiser'),
	(5, 'mayor');


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: score_lookup; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."score_lookup" ("id", "han", "fu", "dealer", "kiriage_mangan", "honba_multiplier", "value", "outcome") OVERRIDING SYSTEM VALUE VALUES
	(83, 1, 30, false, true, 3, 10, 'Ron'),
	(84, 1, 30, false, false, 3, 10, 'Ron'),
	(85, 1, 40, false, true, 3, 13, 'Ron'),
	(86, 1, 40, false, false, 3, 13, 'Ron'),
	(87, 1, 50, false, true, 3, 16, 'Ron'),
	(88, 1, 50, false, false, 3, 16, 'Ron'),
	(89, 1, 60, false, true, 3, 20, 'Ron'),
	(90, 1, 60, false, false, 3, 20, 'Ron'),
	(91, 1, 70, false, true, 3, 23, 'Ron'),
	(92, 1, 70, false, false, 3, 23, 'Ron'),
	(93, 1, 80, false, true, 3, 26, 'Ron'),
	(94, 1, 80, false, false, 3, 26, 'Ron'),
	(95, 1, 90, false, true, 3, 29, 'Ron'),
	(96, 1, 90, false, false, 3, 29, 'Ron'),
	(97, 1, 100, false, true, 3, 32, 'Ron'),
	(98, 1, 100, false, false, 3, 32, 'Ron'),
	(99, 1, 110, false, true, 3, 36, 'Ron'),
	(100, 1, 110, false, false, 3, 36, 'Ron'),
	(101, 2, 25, false, true, 3, 16, 'Ron'),
	(102, 2, 25, false, false, 3, 16, 'Ron'),
	(103, 2, 30, false, true, 3, 20, 'Ron'),
	(104, 2, 30, false, false, 3, 20, 'Ron'),
	(105, 2, 40, false, true, 3, 26, 'Ron'),
	(106, 2, 40, false, false, 3, 26, 'Ron'),
	(107, 2, 50, false, true, 3, 32, 'Ron'),
	(108, 2, 50, false, false, 3, 32, 'Ron'),
	(109, 2, 60, false, true, 3, 39, 'Ron'),
	(110, 2, 60, false, false, 3, 39, 'Ron'),
	(111, 2, 70, false, true, 3, 45, 'Ron'),
	(112, 2, 70, false, false, 3, 45, 'Ron'),
	(113, 2, 80, false, true, 3, 52, 'Ron'),
	(114, 2, 80, false, false, 3, 52, 'Ron'),
	(115, 2, 90, false, true, 3, 58, 'Ron'),
	(116, 2, 90, false, false, 3, 58, 'Ron'),
	(117, 2, 100, false, true, 3, 64, 'Ron'),
	(118, 2, 100, false, false, 3, 64, 'Ron'),
	(119, 2, 110, false, true, 3, 71, 'Ron'),
	(120, 2, 110, false, false, 3, 71, 'Ron'),
	(121, 2, 120, false, true, 3, 77, 'Ron'),
	(122, 2, 120, false, false, 3, 77, 'Ron'),
	(123, 2, 130, false, true, 3, 80, 'Ron'),
	(124, 2, 130, false, false, 3, 80, 'Ron'),
	(125, 3, 25, false, true, 3, 32, 'Ron'),
	(126, 3, 25, false, false, 3, 32, 'Ron'),
	(127, 3, 30, false, true, 3, 39, 'Ron'),
	(128, 3, 30, false, false, 3, 39, 'Ron'),
	(129, 3, 40, false, true, 3, 52, 'Ron'),
	(130, 3, 40, false, false, 3, 52, 'Ron'),
	(131, 3, 50, false, true, 3, 64, 'Ron'),
	(132, 3, 50, false, false, 3, 64, 'Ron'),
	(133, 3, 60, false, true, 3, 80, 'Ron'),
	(134, 3, 60, false, false, 3, 77, 'Ron'),
	(135, 3, 70, false, true, 3, 80, 'Ron'),
	(136, 3, 70, false, false, 3, 80, 'Ron'),
	(137, 4, 25, false, true, 3, 64, 'Ron'),
	(138, 4, 25, false, false, 3, 64, 'Ron'),
	(139, 4, 30, false, true, 3, 80, 'Ron'),
	(140, 4, 30, false, false, 3, 77, 'Ron'),
	(141, 4, 40, false, true, 3, 80, 'Ron'),
	(142, 4, 40, false, false, 3, 80, 'Ron'),
	(143, 5, 0, false, true, 3, 80, 'Ron'),
	(144, 5, 0, false, false, 3, 80, 'Ron'),
	(145, 6, 0, false, true, 3, 120, 'Ron'),
	(146, 6, 0, false, false, 3, 120, 'Ron'),
	(147, 7, 0, false, true, 3, 120, 'Ron'),
	(148, 7, 0, false, false, 3, 120, 'Ron'),
	(149, 8, 0, false, true, 3, 160, 'Ron'),
	(150, 8, 0, false, false, 3, 160, 'Ron'),
	(151, 9, 0, false, true, 3, 160, 'Ron'),
	(152, 9, 0, false, false, 3, 160, 'Ron'),
	(153, 10, 0, false, true, 3, 160, 'Ron'),
	(154, 10, 0, false, false, 3, 160, 'Ron'),
	(155, 11, 0, false, true, 3, 240, 'Ron'),
	(156, 11, 0, false, false, 3, 240, 'Ron'),
	(157, 12, 0, false, true, 3, 240, 'Ron'),
	(158, 12, 0, false, false, 3, 240, 'Ron'),
	(159, 13, 0, false, true, 3, 320, 'Ron'),
	(160, 13, 0, false, false, 3, 320, 'Ron'),
	(161, 26, 0, false, true, 3, 640, 'Ron'),
	(162, 26, 0, false, false, 3, 640, 'Ron'),
	(163, 39, 0, false, true, 3, 960, 'Ron'),
	(164, 39, 0, false, false, 3, 960, 'Ron'),
	(165, 1, 30, false, true, -3, -10, 'Deal-in'),
	(166, 1, 30, false, false, -3, -10, 'Deal-in'),
	(167, 1, 40, false, true, -3, -13, 'Deal-in'),
	(168, 1, 40, false, false, -3, -13, 'Deal-in'),
	(169, 1, 50, false, true, -3, -16, 'Deal-in'),
	(170, 1, 50, false, false, -3, -16, 'Deal-in'),
	(171, 1, 60, false, true, -3, -20, 'Deal-in'),
	(172, 1, 60, false, false, -3, -20, 'Deal-in'),
	(173, 1, 70, false, true, -3, -23, 'Deal-in'),
	(174, 1, 70, false, false, -3, -23, 'Deal-in'),
	(175, 1, 80, false, true, -3, -26, 'Deal-in'),
	(176, 1, 80, false, false, -3, -26, 'Deal-in'),
	(177, 1, 90, false, true, -3, -29, 'Deal-in'),
	(178, 1, 90, false, false, -3, -29, 'Deal-in'),
	(179, 1, 100, false, true, -3, -32, 'Deal-in'),
	(180, 1, 100, false, false, -3, -32, 'Deal-in'),
	(181, 1, 110, false, true, -3, -36, 'Deal-in'),
	(182, 1, 110, false, false, -3, -36, 'Deal-in'),
	(183, 2, 25, false, true, -3, -16, 'Deal-in'),
	(184, 2, 25, false, false, -3, -16, 'Deal-in'),
	(185, 2, 30, false, true, -3, -20, 'Deal-in'),
	(186, 2, 30, false, false, -3, -20, 'Deal-in'),
	(187, 2, 40, false, true, -3, -26, 'Deal-in'),
	(188, 2, 40, false, false, -3, -26, 'Deal-in'),
	(189, 2, 50, false, true, -3, -32, 'Deal-in'),
	(190, 2, 50, false, false, -3, -32, 'Deal-in'),
	(191, 2, 60, false, true, -3, -39, 'Deal-in'),
	(192, 2, 60, false, false, -3, -39, 'Deal-in'),
	(193, 2, 70, false, true, -3, -45, 'Deal-in'),
	(194, 2, 70, false, false, -3, -45, 'Deal-in'),
	(195, 2, 80, false, true, -3, -52, 'Deal-in'),
	(196, 2, 80, false, false, -3, -52, 'Deal-in'),
	(197, 2, 90, false, true, -3, -58, 'Deal-in'),
	(198, 2, 90, false, false, -3, -58, 'Deal-in'),
	(199, 2, 100, false, true, -3, -64, 'Deal-in'),
	(200, 2, 100, false, false, -3, -64, 'Deal-in'),
	(201, 2, 110, false, true, -3, -71, 'Deal-in'),
	(202, 2, 110, false, false, -3, -71, 'Deal-in'),
	(203, 2, 120, false, true, -3, -77, 'Deal-in'),
	(204, 2, 120, false, false, -3, -77, 'Deal-in'),
	(205, 2, 130, false, true, -3, -80, 'Deal-in'),
	(206, 2, 130, false, false, -3, -80, 'Deal-in'),
	(207, 3, 25, false, true, -3, -32, 'Deal-in'),
	(208, 3, 25, false, false, -3, -32, 'Deal-in'),
	(209, 3, 30, false, true, -3, -39, 'Deal-in'),
	(210, 3, 30, false, false, -3, -39, 'Deal-in'),
	(211, 3, 40, false, true, -3, -52, 'Deal-in'),
	(212, 3, 40, false, false, -3, -52, 'Deal-in'),
	(213, 3, 50, false, true, -3, -64, 'Deal-in'),
	(214, 3, 50, false, false, -3, -64, 'Deal-in'),
	(215, 3, 60, false, true, -3, -80, 'Deal-in'),
	(216, 3, 60, false, false, -3, -77, 'Deal-in'),
	(217, 3, 70, false, true, -3, -80, 'Deal-in'),
	(218, 3, 70, false, false, -3, -80, 'Deal-in'),
	(219, 4, 25, false, true, -3, -64, 'Deal-in'),
	(220, 4, 25, false, false, -3, -64, 'Deal-in'),
	(221, 4, 30, false, true, -3, -80, 'Deal-in'),
	(222, 4, 30, false, false, -3, -77, 'Deal-in'),
	(223, 4, 40, false, true, -3, -80, 'Deal-in'),
	(224, 4, 40, false, false, -3, -80, 'Deal-in'),
	(225, 5, 0, false, true, -3, -80, 'Deal-in'),
	(226, 5, 0, false, false, -3, -80, 'Deal-in'),
	(227, 6, 0, false, true, -3, -120, 'Deal-in'),
	(228, 6, 0, false, false, -3, -120, 'Deal-in'),
	(229, 7, 0, false, true, -3, -120, 'Deal-in'),
	(230, 7, 0, false, false, -3, -120, 'Deal-in'),
	(231, 8, 0, false, true, -3, -160, 'Deal-in'),
	(232, 8, 0, false, false, -3, -160, 'Deal-in'),
	(233, 9, 0, false, true, -3, -160, 'Deal-in'),
	(234, 9, 0, false, false, -3, -160, 'Deal-in'),
	(235, 10, 0, false, true, -3, -160, 'Deal-in'),
	(236, 10, 0, false, false, -3, -160, 'Deal-in'),
	(237, 11, 0, false, true, -3, -240, 'Deal-in'),
	(238, 11, 0, false, false, -3, -240, 'Deal-in'),
	(239, 12, 0, false, true, -3, -240, 'Deal-in'),
	(240, 12, 0, false, false, -3, -240, 'Deal-in'),
	(241, 13, 0, false, true, -3, -320, 'Deal-in'),
	(242, 13, 0, false, false, -3, -320, 'Deal-in'),
	(243, 26, 0, false, true, -3, -640, 'Deal-in'),
	(244, 26, 0, false, false, -3, -640, 'Deal-in'),
	(245, 39, 0, false, true, -3, -960, 'Deal-in'),
	(246, 39, 0, false, false, -3, -960, 'Deal-in'),
	(247, 1, 30, true, true, 3, 15, 'Ron'),
	(248, 1, 30, true, false, 3, 15, 'Ron'),
	(249, 1, 40, true, true, 3, 20, 'Ron'),
	(250, 1, 40, true, false, 3, 20, 'Ron'),
	(251, 1, 50, true, true, 3, 24, 'Ron'),
	(252, 1, 50, true, false, 3, 24, 'Ron'),
	(253, 1, 60, true, true, 3, 29, 'Ron'),
	(254, 1, 60, true, false, 3, 29, 'Ron'),
	(255, 1, 70, true, true, 3, 34, 'Ron'),
	(256, 1, 70, true, false, 3, 34, 'Ron'),
	(257, 1, 80, true, true, 3, 39, 'Ron'),
	(258, 1, 80, true, false, 3, 39, 'Ron'),
	(259, 1, 90, true, true, 3, 44, 'Ron'),
	(260, 1, 90, true, false, 3, 44, 'Ron'),
	(261, 1, 100, true, true, 3, 48, 'Ron'),
	(262, 1, 100, true, false, 3, 48, 'Ron'),
	(263, 1, 110, true, true, 3, 53, 'Ron'),
	(264, 1, 110, true, false, 3, 53, 'Ron'),
	(265, 2, 25, true, true, 3, 24, 'Ron'),
	(266, 2, 25, true, false, 3, 24, 'Ron'),
	(267, 2, 30, true, true, 3, 29, 'Ron'),
	(268, 2, 30, true, false, 3, 29, 'Ron'),
	(269, 2, 40, true, true, 3, 39, 'Ron'),
	(270, 2, 40, true, false, 3, 39, 'Ron'),
	(271, 2, 50, true, true, 3, 48, 'Ron'),
	(272, 2, 50, true, false, 3, 48, 'Ron'),
	(273, 2, 60, true, true, 3, 58, 'Ron'),
	(274, 2, 60, true, false, 3, 58, 'Ron'),
	(275, 2, 70, true, true, 3, 68, 'Ron'),
	(276, 2, 70, true, false, 3, 68, 'Ron'),
	(277, 2, 80, true, true, 3, 77, 'Ron'),
	(278, 2, 80, true, false, 3, 77, 'Ron'),
	(279, 2, 90, true, true, 3, 87, 'Ron'),
	(280, 2, 90, true, false, 3, 87, 'Ron'),
	(281, 2, 100, true, true, 3, 96, 'Ron'),
	(282, 2, 100, true, false, 3, 96, 'Ron'),
	(283, 2, 110, true, true, 3, 106, 'Ron'),
	(284, 2, 110, true, false, 3, 106, 'Ron'),
	(285, 2, 120, true, true, 3, 116, 'Ron'),
	(286, 2, 120, true, false, 3, 116, 'Ron'),
	(287, 2, 130, true, true, 3, 120, 'Ron'),
	(288, 2, 130, true, false, 3, 120, 'Ron'),
	(289, 3, 25, true, true, 3, 48, 'Ron'),
	(290, 3, 25, true, false, 3, 48, 'Ron'),
	(291, 3, 30, true, true, 3, 58, 'Ron'),
	(292, 3, 30, true, false, 3, 58, 'Ron'),
	(293, 3, 40, true, true, 3, 77, 'Ron'),
	(294, 3, 40, true, false, 3, 77, 'Ron'),
	(295, 3, 50, true, true, 3, 96, 'Ron'),
	(296, 3, 50, true, false, 3, 96, 'Ron'),
	(297, 3, 60, true, true, 3, 120, 'Ron'),
	(298, 3, 60, true, false, 3, 116, 'Ron'),
	(299, 3, 70, true, true, 3, 120, 'Ron'),
	(300, 3, 70, true, false, 3, 120, 'Ron'),
	(301, 4, 25, true, true, 3, 96, 'Ron'),
	(302, 4, 25, true, false, 3, 96, 'Ron'),
	(303, 4, 30, true, true, 3, 120, 'Ron'),
	(304, 4, 30, true, false, 3, 116, 'Ron'),
	(305, 4, 40, true, true, 3, 120, 'Ron'),
	(306, 4, 40, true, false, 3, 120, 'Ron'),
	(307, 5, 0, true, true, 3, 120, 'Ron'),
	(308, 5, 0, true, false, 3, 120, 'Ron'),
	(309, 6, 0, true, true, 3, 180, 'Ron'),
	(310, 6, 0, true, false, 3, 180, 'Ron'),
	(311, 7, 0, true, true, 3, 180, 'Ron'),
	(312, 7, 0, true, false, 3, 180, 'Ron'),
	(313, 8, 0, true, true, 3, 240, 'Ron'),
	(314, 8, 0, true, false, 3, 240, 'Ron'),
	(315, 9, 0, true, true, 3, 240, 'Ron'),
	(316, 9, 0, true, false, 3, 240, 'Ron'),
	(317, 10, 0, true, true, 3, 240, 'Ron'),
	(318, 10, 0, true, false, 3, 240, 'Ron'),
	(319, 11, 0, true, true, 3, 360, 'Ron'),
	(320, 11, 0, true, false, 3, 360, 'Ron'),
	(321, 12, 0, true, true, 3, 360, 'Ron'),
	(322, 12, 0, true, false, 3, 360, 'Ron'),
	(323, 13, 0, true, true, 3, 480, 'Ron'),
	(324, 13, 0, true, false, 3, 480, 'Ron'),
	(325, 26, 0, true, true, 3, 960, 'Ron'),
	(326, 26, 0, true, false, 3, 960, 'Ron'),
	(327, 39, 0, true, true, 3, 1440, 'Ron'),
	(328, 39, 0, true, false, 3, 1440, 'Ron'),
	(329, 1, 30, true, true, -3, -15, 'Deal-in'),
	(330, 1, 30, true, false, -3, -15, 'Deal-in'),
	(331, 1, 40, true, true, -3, -20, 'Deal-in'),
	(332, 1, 40, true, false, -3, -20, 'Deal-in'),
	(333, 1, 50, true, true, -3, -24, 'Deal-in'),
	(334, 1, 50, true, false, -3, -24, 'Deal-in'),
	(335, 1, 60, true, true, -3, -29, 'Deal-in'),
	(336, 1, 60, true, false, -3, -29, 'Deal-in'),
	(337, 1, 70, true, true, -3, -34, 'Deal-in'),
	(338, 1, 70, true, false, -3, -34, 'Deal-in'),
	(339, 1, 80, true, true, -3, -39, 'Deal-in'),
	(340, 1, 80, true, false, -3, -39, 'Deal-in'),
	(341, 1, 90, true, true, -3, -44, 'Deal-in'),
	(342, 1, 90, true, false, -3, -44, 'Deal-in'),
	(343, 1, 100, true, true, -3, -48, 'Deal-in'),
	(344, 1, 100, true, false, -3, -48, 'Deal-in'),
	(345, 1, 110, true, true, -3, -53, 'Deal-in'),
	(346, 1, 110, true, false, -3, -53, 'Deal-in'),
	(347, 2, 25, true, true, -3, -24, 'Deal-in'),
	(348, 2, 25, true, false, -3, -24, 'Deal-in'),
	(349, 2, 30, true, true, -3, -29, 'Deal-in'),
	(350, 2, 30, true, false, -3, -29, 'Deal-in'),
	(351, 2, 40, true, true, -3, -39, 'Deal-in'),
	(352, 2, 40, true, false, -3, -39, 'Deal-in'),
	(353, 2, 50, true, true, -3, -48, 'Deal-in'),
	(354, 2, 50, true, false, -3, -48, 'Deal-in'),
	(355, 2, 60, true, true, -3, -58, 'Deal-in'),
	(356, 2, 60, true, false, -3, -58, 'Deal-in'),
	(357, 2, 70, true, true, -3, -68, 'Deal-in'),
	(358, 2, 70, true, false, -3, -68, 'Deal-in'),
	(359, 2, 80, true, true, -3, -77, 'Deal-in'),
	(360, 2, 80, true, false, -3, -77, 'Deal-in'),
	(361, 2, 90, true, true, -3, -87, 'Deal-in'),
	(362, 2, 90, true, false, -3, -87, 'Deal-in'),
	(363, 2, 100, true, true, -3, -96, 'Deal-in'),
	(364, 2, 100, true, false, -3, -96, 'Deal-in'),
	(365, 2, 110, true, true, -3, -106, 'Deal-in'),
	(366, 2, 110, true, false, -3, -106, 'Deal-in'),
	(367, 2, 120, true, true, -3, -116, 'Deal-in'),
	(368, 2, 120, true, false, -3, -116, 'Deal-in'),
	(369, 2, 130, true, true, -3, -120, 'Deal-in'),
	(370, 2, 130, true, false, -3, -120, 'Deal-in'),
	(371, 3, 25, true, true, -3, -48, 'Deal-in'),
	(372, 3, 25, true, false, -3, -48, 'Deal-in'),
	(373, 3, 30, true, true, -3, -58, 'Deal-in'),
	(374, 3, 30, true, false, -3, -58, 'Deal-in'),
	(375, 3, 40, true, true, -3, -77, 'Deal-in'),
	(376, 3, 40, true, false, -3, -77, 'Deal-in'),
	(377, 3, 50, true, true, -3, -96, 'Deal-in'),
	(378, 3, 50, true, false, -3, -96, 'Deal-in'),
	(379, 3, 60, true, true, -3, -120, 'Deal-in'),
	(380, 3, 60, true, false, -3, -116, 'Deal-in'),
	(381, 3, 70, true, true, -3, -120, 'Deal-in'),
	(382, 3, 70, true, false, -3, -120, 'Deal-in'),
	(383, 4, 25, true, true, -3, -96, 'Deal-in'),
	(384, 4, 25, true, false, -3, -96, 'Deal-in'),
	(385, 4, 30, true, true, -3, -120, 'Deal-in'),
	(386, 4, 30, true, false, -3, -116, 'Deal-in'),
	(387, 4, 40, true, true, -3, -120, 'Deal-in'),
	(388, 4, 40, true, false, -3, -120, 'Deal-in'),
	(389, 5, 0, true, true, -3, -120, 'Deal-in'),
	(390, 5, 0, true, false, -3, -120, 'Deal-in'),
	(391, 6, 0, true, true, -3, -180, 'Deal-in'),
	(392, 6, 0, true, false, -3, -180, 'Deal-in'),
	(393, 7, 0, true, true, -3, -180, 'Deal-in'),
	(394, 7, 0, true, false, -3, -180, 'Deal-in'),
	(395, 8, 0, true, true, -3, -240, 'Deal-in'),
	(396, 8, 0, true, false, -3, -240, 'Deal-in'),
	(397, 9, 0, true, true, -3, -240, 'Deal-in'),
	(398, 9, 0, true, false, -3, -240, 'Deal-in'),
	(399, 10, 0, true, true, -3, -240, 'Deal-in'),
	(400, 10, 0, true, false, -3, -240, 'Deal-in'),
	(401, 11, 0, true, true, -3, -360, 'Deal-in'),
	(402, 11, 0, true, false, -3, -360, 'Deal-in'),
	(403, 12, 0, true, true, -3, -360, 'Deal-in'),
	(404, 12, 0, true, false, -3, -360, 'Deal-in'),
	(405, 13, 0, true, true, -3, -480, 'Deal-in'),
	(406, 13, 0, true, false, -3, -480, 'Deal-in'),
	(407, 26, 0, true, true, -3, -960, 'Deal-in'),
	(408, 26, 0, true, false, -3, -960, 'Deal-in'),
	(409, 39, 0, true, true, -3, -1440, 'Deal-in'),
	(410, 39, 0, true, false, -3, -1440, 'Deal-in'),
	(411, 1, 20, true, true, -1, -4, 'Tsumo-loss'),
	(412, 1, 20, true, false, -1, -4, 'Tsumo-loss'),
	(413, 1, 30, true, true, -1, -5, 'Tsumo-loss'),
	(414, 1, 30, true, false, -1, -5, 'Tsumo-loss'),
	(415, 1, 40, true, true, -1, -7, 'Tsumo-loss'),
	(416, 1, 40, true, false, -1, -7, 'Tsumo-loss'),
	(417, 1, 50, true, true, -1, -8, 'Tsumo-loss'),
	(418, 1, 50, true, false, -1, -8, 'Tsumo-loss'),
	(419, 1, 60, true, true, -1, -10, 'Tsumo-loss'),
	(420, 1, 60, true, false, -1, -10, 'Tsumo-loss'),
	(421, 1, 70, true, true, -1, -12, 'Tsumo-loss'),
	(422, 1, 70, true, false, -1, -12, 'Tsumo-loss'),
	(423, 1, 80, true, true, -1, -13, 'Tsumo-loss'),
	(424, 1, 80, true, false, -1, -13, 'Tsumo-loss'),
	(425, 1, 90, true, true, -1, -15, 'Tsumo-loss'),
	(426, 1, 90, true, false, -1, -15, 'Tsumo-loss'),
	(427, 1, 100, true, true, -1, -16, 'Tsumo-loss'),
	(428, 1, 100, true, false, -1, -16, 'Tsumo-loss'),
	(429, 1, 110, true, true, -1, -18, 'Tsumo-loss'),
	(430, 1, 110, true, false, -1, -18, 'Tsumo-loss'),
	(431, 2, 20, true, true, -1, -7, 'Tsumo-loss'),
	(432, 2, 20, true, false, -1, -7, 'Tsumo-loss'),
	(433, 2, 30, true, true, -1, -10, 'Tsumo-loss'),
	(434, 2, 30, true, false, -1, -10, 'Tsumo-loss'),
	(435, 2, 40, true, true, -1, -13, 'Tsumo-loss'),
	(436, 2, 40, true, false, -1, -13, 'Tsumo-loss'),
	(437, 2, 50, true, true, -1, -16, 'Tsumo-loss'),
	(438, 2, 50, true, false, -1, -16, 'Tsumo-loss'),
	(439, 2, 60, true, true, -1, -20, 'Tsumo-loss'),
	(440, 2, 60, true, false, -1, -20, 'Tsumo-loss'),
	(441, 2, 70, true, true, -1, -23, 'Tsumo-loss'),
	(442, 2, 70, true, false, -1, -23, 'Tsumo-loss'),
	(443, 2, 80, true, true, -1, -26, 'Tsumo-loss'),
	(444, 2, 80, true, false, -1, -26, 'Tsumo-loss'),
	(445, 2, 90, true, true, -1, -29, 'Tsumo-loss'),
	(446, 2, 90, true, false, -1, -29, 'Tsumo-loss'),
	(447, 2, 100, true, true, -1, -32, 'Tsumo-loss'),
	(448, 2, 100, true, false, -1, -32, 'Tsumo-loss'),
	(449, 2, 110, true, true, -1, -36, 'Tsumo-loss'),
	(450, 2, 110, true, false, -1, -36, 'Tsumo-loss'),
	(451, 2, 120, true, true, -1, -39, 'Tsumo-loss'),
	(452, 2, 120, true, false, -1, -39, 'Tsumo-loss'),
	(453, 2, 130, true, true, -1, -40, 'Tsumo-loss'),
	(454, 2, 130, true, false, -1, -40, 'Tsumo-loss'),
	(455, 3, 20, true, true, -1, -13, 'Tsumo-loss'),
	(456, 3, 20, true, false, -1, -13, 'Tsumo-loss'),
	(457, 3, 25, true, true, -1, -16, 'Tsumo-loss'),
	(458, 3, 25, true, false, -1, -16, 'Tsumo-loss'),
	(459, 3, 30, true, true, -1, -20, 'Tsumo-loss'),
	(460, 3, 30, true, false, -1, -20, 'Tsumo-loss'),
	(461, 3, 40, true, true, -1, -26, 'Tsumo-loss'),
	(462, 3, 40, true, false, -1, -26, 'Tsumo-loss'),
	(463, 3, 50, true, true, -1, -32, 'Tsumo-loss'),
	(464, 3, 50, true, false, -1, -32, 'Tsumo-loss'),
	(465, 3, 60, true, true, -1, -40, 'Tsumo-loss'),
	(466, 3, 60, true, false, -1, -39, 'Tsumo-loss'),
	(467, 3, 70, true, true, -1, -40, 'Tsumo-loss'),
	(468, 3, 70, true, false, -1, -40, 'Tsumo-loss'),
	(469, 4, 20, true, true, -1, -26, 'Tsumo-loss'),
	(470, 4, 20, true, false, -1, -26, 'Tsumo-loss'),
	(471, 4, 25, true, true, -1, -32, 'Tsumo-loss'),
	(472, 4, 25, true, false, -1, -32, 'Tsumo-loss'),
	(473, 4, 30, true, true, -1, -40, 'Tsumo-loss'),
	(474, 4, 30, true, false, -1, -39, 'Tsumo-loss'),
	(475, 4, 40, true, true, -1, -40, 'Tsumo-loss'),
	(476, 4, 40, true, false, -1, -40, 'Tsumo-loss'),
	(477, 5, 0, true, true, -1, -40, 'Tsumo-loss'),
	(478, 5, 0, true, false, -1, -40, 'Tsumo-loss'),
	(479, 6, 0, true, true, -1, -60, 'Tsumo-loss'),
	(480, 6, 0, true, false, -1, -60, 'Tsumo-loss'),
	(481, 7, 0, true, true, -1, -60, 'Tsumo-loss'),
	(482, 7, 0, true, false, -1, -60, 'Tsumo-loss'),
	(483, 8, 0, true, true, -1, -80, 'Tsumo-loss'),
	(484, 8, 0, true, false, -1, -80, 'Tsumo-loss'),
	(485, 9, 0, true, true, -1, -80, 'Tsumo-loss'),
	(486, 9, 0, true, false, -1, -80, 'Tsumo-loss'),
	(487, 10, 0, true, true, -1, -80, 'Tsumo-loss'),
	(488, 10, 0, true, false, -1, -80, 'Tsumo-loss'),
	(489, 11, 0, true, true, -1, -120, 'Tsumo-loss'),
	(490, 11, 0, true, false, -1, -120, 'Tsumo-loss'),
	(491, 12, 0, true, true, -1, -120, 'Tsumo-loss'),
	(492, 12, 0, true, false, -1, -120, 'Tsumo-loss'),
	(493, 13, 0, true, true, -1, -160, 'Tsumo-loss'),
	(494, 13, 0, true, false, -1, -160, 'Tsumo-loss'),
	(495, 26, 0, true, true, -1, -320, 'Tsumo-loss'),
	(496, 26, 0, true, false, -1, -320, 'Tsumo-loss'),
	(497, 39, 0, true, true, -1, -480, 'Tsumo-loss'),
	(498, 39, 0, true, false, -1, -480, 'Tsumo-loss'),
	(499, 1, 20, false, true, -1, -2, 'Tsumo-loss'),
	(500, 1, 20, false, false, -1, -2, 'Tsumo-loss'),
	(501, 1, 30, false, true, -1, -3, 'Tsumo-loss'),
	(502, 1, 30, false, false, -1, -3, 'Tsumo-loss'),
	(503, 1, 40, false, true, -1, -4, 'Tsumo-loss'),
	(504, 1, 40, false, false, -1, -4, 'Tsumo-loss'),
	(505, 1, 50, false, true, -1, -4, 'Tsumo-loss'),
	(506, 1, 50, false, false, -1, -4, 'Tsumo-loss'),
	(507, 1, 60, false, true, -1, -5, 'Tsumo-loss'),
	(508, 1, 60, false, false, -1, -5, 'Tsumo-loss'),
	(509, 1, 70, false, true, -1, -6, 'Tsumo-loss'),
	(510, 1, 70, false, false, -1, -6, 'Tsumo-loss'),
	(511, 1, 80, false, true, -1, -7, 'Tsumo-loss'),
	(512, 1, 80, false, false, -1, -7, 'Tsumo-loss'),
	(513, 1, 90, false, true, -1, -8, 'Tsumo-loss'),
	(514, 1, 90, false, false, -1, -8, 'Tsumo-loss'),
	(515, 1, 100, false, true, -1, -8, 'Tsumo-loss'),
	(516, 1, 100, false, false, -1, -8, 'Tsumo-loss'),
	(517, 1, 110, false, true, -1, -9, 'Tsumo-loss'),
	(518, 1, 110, false, false, -1, -9, 'Tsumo-loss'),
	(519, 2, 20, false, true, -1, -4, 'Tsumo-loss'),
	(520, 2, 20, false, false, -1, -4, 'Tsumo-loss'),
	(521, 2, 30, false, true, -1, -5, 'Tsumo-loss'),
	(522, 2, 30, false, false, -1, -5, 'Tsumo-loss'),
	(523, 2, 40, false, true, -1, -7, 'Tsumo-loss'),
	(524, 2, 40, false, false, -1, -7, 'Tsumo-loss'),
	(525, 2, 50, false, true, -1, -8, 'Tsumo-loss'),
	(526, 2, 50, false, false, -1, -8, 'Tsumo-loss'),
	(527, 2, 60, false, true, -1, -10, 'Tsumo-loss'),
	(528, 2, 60, false, false, -1, -10, 'Tsumo-loss'),
	(529, 2, 70, false, true, -1, -12, 'Tsumo-loss'),
	(530, 2, 70, false, false, -1, -12, 'Tsumo-loss'),
	(531, 2, 80, false, true, -1, -13, 'Tsumo-loss'),
	(532, 2, 80, false, false, -1, -13, 'Tsumo-loss'),
	(533, 2, 90, false, true, -1, -15, 'Tsumo-loss'),
	(534, 2, 90, false, false, -1, -15, 'Tsumo-loss'),
	(535, 2, 100, false, true, -1, -16, 'Tsumo-loss'),
	(536, 2, 100, false, false, -1, -16, 'Tsumo-loss'),
	(537, 2, 110, false, true, -1, -18, 'Tsumo-loss'),
	(538, 2, 110, false, false, -1, -18, 'Tsumo-loss'),
	(539, 2, 120, false, true, -1, -20, 'Tsumo-loss'),
	(540, 2, 120, false, false, -1, -20, 'Tsumo-loss'),
	(541, 2, 130, false, true, -1, -20, 'Tsumo-loss'),
	(542, 2, 130, false, false, -1, -20, 'Tsumo-loss'),
	(543, 3, 20, false, true, -1, -7, 'Tsumo-loss'),
	(544, 3, 20, false, false, -1, -7, 'Tsumo-loss'),
	(545, 3, 25, false, true, -1, -8, 'Tsumo-loss'),
	(546, 3, 25, false, false, -1, -8, 'Tsumo-loss'),
	(547, 3, 30, false, true, -1, -10, 'Tsumo-loss'),
	(548, 3, 30, false, false, -1, -10, 'Tsumo-loss'),
	(549, 3, 40, false, true, -1, -13, 'Tsumo-loss'),
	(550, 3, 40, false, false, -1, -13, 'Tsumo-loss'),
	(551, 3, 50, false, true, -1, -16, 'Tsumo-loss'),
	(552, 3, 50, false, false, -1, -16, 'Tsumo-loss'),
	(553, 3, 60, false, true, -1, -20, 'Tsumo-loss'),
	(554, 3, 60, false, false, -1, -20, 'Tsumo-loss'),
	(555, 3, 70, false, true, -1, -20, 'Tsumo-loss'),
	(556, 3, 70, false, false, -1, -20, 'Tsumo-loss'),
	(557, 4, 20, false, true, -1, -13, 'Tsumo-loss'),
	(558, 4, 20, false, false, -1, -13, 'Tsumo-loss'),
	(559, 4, 25, false, true, -1, -16, 'Tsumo-loss'),
	(560, 4, 25, false, false, -1, -16, 'Tsumo-loss'),
	(561, 4, 30, false, true, -1, -20, 'Tsumo-loss'),
	(562, 4, 30, false, false, -1, -20, 'Tsumo-loss'),
	(563, 4, 40, false, true, -1, -20, 'Tsumo-loss'),
	(564, 4, 40, false, false, -1, -20, 'Tsumo-loss'),
	(565, 5, 0, false, true, -1, -20, 'Tsumo-loss'),
	(566, 5, 0, false, false, -1, -20, 'Tsumo-loss'),
	(567, 6, 0, false, true, -1, -30, 'Tsumo-loss'),
	(568, 6, 0, false, false, -1, -30, 'Tsumo-loss'),
	(569, 7, 0, false, true, -1, -30, 'Tsumo-loss'),
	(570, 7, 0, false, false, -1, -30, 'Tsumo-loss'),
	(571, 8, 0, false, true, -1, -40, 'Tsumo-loss'),
	(572, 8, 0, false, false, -1, -40, 'Tsumo-loss'),
	(573, 9, 0, false, true, -1, -40, 'Tsumo-loss'),
	(574, 9, 0, false, false, -1, -40, 'Tsumo-loss'),
	(575, 10, 0, false, true, -1, -40, 'Tsumo-loss'),
	(576, 10, 0, false, false, -1, -40, 'Tsumo-loss'),
	(577, 11, 0, false, true, -1, -60, 'Tsumo-loss'),
	(578, 11, 0, false, false, -1, -60, 'Tsumo-loss'),
	(579, 12, 0, false, true, -1, -60, 'Tsumo-loss'),
	(580, 12, 0, false, false, -1, -60, 'Tsumo-loss'),
	(581, 13, 0, false, true, -1, -80, 'Tsumo-loss'),
	(582, 13, 0, false, false, -1, -80, 'Tsumo-loss'),
	(583, 26, 0, false, true, -1, -160, 'Tsumo-loss'),
	(584, 26, 0, false, false, -1, -160, 'Tsumo-loss'),
	(585, 39, 0, false, true, -1, -240, 'Tsumo-loss'),
	(586, 39, 0, false, false, -1, -240, 'Tsumo-loss'),
	(587, 1, 20, false, true, 3, 8, 'Tsumo'),
	(588, 1, 20, false, false, 3, 8, 'Tsumo'),
	(589, 1, 30, false, true, 3, 11, 'Tsumo'),
	(590, 1, 30, false, false, 3, 11, 'Tsumo'),
	(591, 1, 40, false, true, 3, 15, 'Tsumo'),
	(592, 1, 40, false, false, 3, 15, 'Tsumo'),
	(593, 1, 50, false, true, 3, 16, 'Tsumo'),
	(594, 1, 50, false, false, 3, 16, 'Tsumo'),
	(595, 1, 60, false, true, 3, 20, 'Tsumo'),
	(596, 1, 60, false, false, 3, 20, 'Tsumo'),
	(597, 1, 70, false, true, 3, 24, 'Tsumo'),
	(598, 1, 70, false, false, 3, 24, 'Tsumo'),
	(599, 1, 80, false, true, 3, 27, 'Tsumo'),
	(600, 1, 80, false, false, 3, 27, 'Tsumo'),
	(601, 1, 90, false, true, 3, 31, 'Tsumo'),
	(602, 1, 90, false, false, 3, 31, 'Tsumo'),
	(603, 1, 100, false, true, 3, 32, 'Tsumo'),
	(604, 1, 100, false, false, 3, 32, 'Tsumo'),
	(605, 1, 110, false, true, 3, 36, 'Tsumo'),
	(606, 1, 110, false, false, 3, 36, 'Tsumo'),
	(607, 2, 20, false, true, 3, 15, 'Tsumo'),
	(608, 2, 20, false, false, 3, 15, 'Tsumo'),
	(609, 2, 30, false, true, 3, 20, 'Tsumo'),
	(610, 2, 30, false, false, 3, 20, 'Tsumo'),
	(611, 2, 40, false, true, 3, 27, 'Tsumo'),
	(612, 2, 40, false, false, 3, 27, 'Tsumo'),
	(613, 2, 50, false, true, 3, 32, 'Tsumo'),
	(614, 2, 50, false, false, 3, 32, 'Tsumo'),
	(615, 2, 60, false, true, 3, 40, 'Tsumo'),
	(616, 2, 60, false, false, 3, 40, 'Tsumo'),
	(617, 2, 70, false, true, 3, 47, 'Tsumo'),
	(618, 2, 70, false, false, 3, 47, 'Tsumo'),
	(619, 2, 80, false, true, 3, 52, 'Tsumo'),
	(620, 2, 80, false, false, 3, 52, 'Tsumo'),
	(621, 2, 90, false, true, 3, 59, 'Tsumo'),
	(622, 2, 90, false, false, 3, 59, 'Tsumo'),
	(623, 2, 100, false, true, 3, 64, 'Tsumo'),
	(624, 2, 100, false, false, 3, 64, 'Tsumo'),
	(625, 2, 110, false, true, 3, 72, 'Tsumo'),
	(626, 2, 110, false, false, 3, 72, 'Tsumo'),
	(627, 2, 120, false, true, 3, 79, 'Tsumo'),
	(628, 2, 120, false, false, 3, 79, 'Tsumo'),
	(629, 2, 130, false, true, 3, 80, 'Tsumo'),
	(630, 2, 130, false, false, 3, 80, 'Tsumo'),
	(631, 3, 20, false, true, 3, 27, 'Tsumo'),
	(632, 3, 20, false, false, 3, 27, 'Tsumo'),
	(633, 3, 25, false, true, 3, 32, 'Tsumo'),
	(634, 3, 25, false, false, 3, 32, 'Tsumo'),
	(635, 3, 30, false, true, 3, 40, 'Tsumo'),
	(636, 3, 30, false, false, 3, 40, 'Tsumo'),
	(637, 3, 40, false, true, 3, 52, 'Tsumo'),
	(638, 3, 40, false, false, 3, 52, 'Tsumo'),
	(639, 3, 50, false, true, 3, 64, 'Tsumo'),
	(640, 3, 50, false, false, 3, 64, 'Tsumo'),
	(641, 3, 60, false, true, 3, 80, 'Tsumo'),
	(642, 3, 60, false, false, 3, 79, 'Tsumo'),
	(643, 3, 70, false, true, 3, 80, 'Tsumo'),
	(644, 3, 70, false, false, 3, 80, 'Tsumo'),
	(645, 4, 20, false, true, 3, 52, 'Tsumo'),
	(646, 4, 20, false, false, 3, 52, 'Tsumo'),
	(647, 4, 25, false, true, 3, 64, 'Tsumo'),
	(648, 4, 25, false, false, 3, 64, 'Tsumo'),
	(649, 4, 30, false, true, 3, 80, 'Tsumo'),
	(650, 4, 30, false, false, 3, 79, 'Tsumo'),
	(651, 4, 40, false, true, 3, 80, 'Tsumo'),
	(652, 4, 40, false, false, 3, 80, 'Tsumo'),
	(653, 5, 0, false, true, 3, 80, 'Tsumo'),
	(654, 5, 0, false, false, 3, 80, 'Tsumo'),
	(655, 6, 0, false, true, 3, 120, 'Tsumo'),
	(656, 6, 0, false, false, 3, 120, 'Tsumo'),
	(657, 7, 0, false, true, 3, 120, 'Tsumo'),
	(658, 7, 0, false, false, 3, 120, 'Tsumo'),
	(659, 8, 0, false, true, 3, 160, 'Tsumo'),
	(660, 8, 0, false, false, 3, 160, 'Tsumo'),
	(661, 9, 0, false, true, 3, 160, 'Tsumo'),
	(662, 9, 0, false, false, 3, 160, 'Tsumo'),
	(663, 10, 0, false, true, 3, 160, 'Tsumo'),
	(664, 10, 0, false, false, 3, 160, 'Tsumo'),
	(665, 11, 0, false, true, 3, 240, 'Tsumo'),
	(666, 11, 0, false, false, 3, 240, 'Tsumo'),
	(667, 12, 0, false, true, 3, 240, 'Tsumo'),
	(668, 12, 0, false, false, 3, 240, 'Tsumo'),
	(669, 13, 0, false, true, 3, 320, 'Tsumo'),
	(670, 13, 0, false, false, 3, 320, 'Tsumo'),
	(671, 26, 0, false, true, 3, 640, 'Tsumo'),
	(672, 26, 0, false, false, 3, 640, 'Tsumo'),
	(673, 39, 0, false, true, 3, 960, 'Tsumo'),
	(674, 39, 0, false, false, 3, 960, 'Tsumo'),
	(675, 1, 20, true, true, 3, 12, 'Tsumo'),
	(676, 1, 20, true, false, 3, 12, 'Tsumo'),
	(677, 1, 30, true, true, 3, 15, 'Tsumo'),
	(678, 1, 30, true, false, 3, 15, 'Tsumo'),
	(679, 1, 40, true, true, 3, 21, 'Tsumo'),
	(680, 1, 40, true, false, 3, 21, 'Tsumo'),
	(681, 1, 50, true, true, 3, 24, 'Tsumo'),
	(682, 1, 50, true, false, 3, 24, 'Tsumo'),
	(683, 1, 60, true, true, 3, 30, 'Tsumo'),
	(684, 1, 60, true, false, 3, 30, 'Tsumo'),
	(685, 1, 70, true, true, 3, 36, 'Tsumo'),
	(686, 1, 70, true, false, 3, 36, 'Tsumo'),
	(687, 1, 80, true, true, 3, 39, 'Tsumo'),
	(688, 1, 80, true, false, 3, 39, 'Tsumo'),
	(689, 1, 90, true, true, 3, 45, 'Tsumo'),
	(690, 1, 90, true, false, 3, 45, 'Tsumo'),
	(691, 1, 100, true, true, 3, 48, 'Tsumo'),
	(692, 1, 100, true, false, 3, 48, 'Tsumo'),
	(693, 1, 110, true, true, 3, 54, 'Tsumo'),
	(694, 1, 110, true, false, 3, 54, 'Tsumo'),
	(695, 2, 20, true, true, 3, 21, 'Tsumo'),
	(696, 2, 20, true, false, 3, 21, 'Tsumo'),
	(697, 2, 30, true, true, 3, 30, 'Tsumo'),
	(698, 2, 30, true, false, 3, 30, 'Tsumo'),
	(699, 2, 40, true, true, 3, 39, 'Tsumo'),
	(700, 2, 40, true, false, 3, 39, 'Tsumo'),
	(701, 2, 50, true, true, 3, 48, 'Tsumo'),
	(702, 2, 50, true, false, 3, 48, 'Tsumo'),
	(703, 2, 60, true, true, 3, 60, 'Tsumo'),
	(704, 2, 60, true, false, 3, 60, 'Tsumo'),
	(705, 2, 70, true, true, 3, 69, 'Tsumo'),
	(706, 2, 70, true, false, 3, 69, 'Tsumo'),
	(707, 2, 80, true, true, 3, 78, 'Tsumo'),
	(708, 2, 80, true, false, 3, 78, 'Tsumo'),
	(709, 2, 90, true, true, 3, 87, 'Tsumo'),
	(710, 2, 90, true, false, 3, 87, 'Tsumo'),
	(711, 2, 100, true, true, 3, 96, 'Tsumo'),
	(712, 2, 100, true, false, 3, 96, 'Tsumo'),
	(713, 2, 110, true, true, 3, 108, 'Tsumo'),
	(714, 2, 110, true, false, 3, 108, 'Tsumo'),
	(715, 2, 120, true, true, 3, 117, 'Tsumo'),
	(716, 2, 120, true, false, 3, 117, 'Tsumo'),
	(717, 2, 130, true, true, 3, 120, 'Tsumo'),
	(718, 2, 130, true, false, 3, 120, 'Tsumo'),
	(719, 3, 20, true, true, 3, 39, 'Tsumo'),
	(720, 3, 20, true, false, 3, 39, 'Tsumo'),
	(721, 3, 25, true, true, 3, 48, 'Tsumo'),
	(722, 3, 25, true, false, 3, 48, 'Tsumo'),
	(723, 3, 30, true, true, 3, 60, 'Tsumo'),
	(724, 3, 30, true, false, 3, 60, 'Tsumo'),
	(725, 3, 40, true, true, 3, 78, 'Tsumo'),
	(726, 3, 40, true, false, 3, 78, 'Tsumo'),
	(727, 3, 50, true, true, 3, 96, 'Tsumo'),
	(728, 3, 50, true, false, 3, 96, 'Tsumo'),
	(729, 3, 60, true, true, 3, 120, 'Tsumo'),
	(730, 3, 60, true, false, 3, 117, 'Tsumo'),
	(731, 3, 70, true, true, 3, 120, 'Tsumo'),
	(732, 3, 70, true, false, 3, 120, 'Tsumo'),
	(733, 4, 20, true, true, 3, 78, 'Tsumo'),
	(734, 4, 20, true, false, 3, 78, 'Tsumo'),
	(735, 4, 25, true, true, 3, 96, 'Tsumo'),
	(736, 4, 25, true, false, 3, 96, 'Tsumo'),
	(737, 4, 30, true, true, 3, 120, 'Tsumo'),
	(738, 4, 30, true, false, 3, 117, 'Tsumo'),
	(739, 4, 40, true, true, 3, 120, 'Tsumo'),
	(740, 4, 40, true, false, 3, 120, 'Tsumo'),
	(741, 5, 0, true, true, 3, 120, 'Tsumo'),
	(742, 5, 0, true, false, 3, 120, 'Tsumo'),
	(743, 6, 0, true, true, 3, 180, 'Tsumo'),
	(744, 6, 0, true, false, 3, 180, 'Tsumo'),
	(745, 7, 0, true, true, 3, 180, 'Tsumo'),
	(746, 7, 0, true, false, 3, 180, 'Tsumo'),
	(747, 8, 0, true, true, 3, 240, 'Tsumo'),
	(748, 8, 0, true, false, 3, 240, 'Tsumo'),
	(749, 9, 0, true, true, 3, 240, 'Tsumo'),
	(750, 9, 0, true, false, 3, 240, 'Tsumo'),
	(751, 10, 0, true, true, 3, 240, 'Tsumo'),
	(752, 10, 0, true, false, 3, 240, 'Tsumo'),
	(753, 11, 0, true, true, 3, 360, 'Tsumo'),
	(754, 11, 0, true, false, 3, 360, 'Tsumo'),
	(755, 12, 0, true, true, 3, 360, 'Tsumo'),
	(756, 12, 0, true, false, 3, 360, 'Tsumo'),
	(757, 13, 0, true, true, 3, 480, 'Tsumo'),
	(758, 13, 0, true, false, 3, 480, 'Tsumo'),
	(759, 26, 0, true, true, 3, 960, 'Tsumo'),
	(760, 26, 0, true, false, 3, 960, 'Tsumo'),
	(761, 39, 0, true, true, 3, 1440, 'Tsumo'),
	(762, 39, 0, true, false, 3, 1440, 'Tsumo'),
	(763, 0, 0, true, false, 0, 120, 'Nagashi-win'),
	(764, 0, 0, true, true, 0, 120, 'Nagashi-win'),
	(765, 0, 0, false, false, 0, 80, 'Nagashi-win'),
	(766, 0, 0, false, true, 0, 80, 'Nagashi-win'),
	(767, 0, 0, true, false, 0, -40, 'Nagashi-loss'),
	(768, 0, 0, true, true, 0, -40, 'Nagashi-loss'),
	(769, 0, 0, false, false, 0, -20, 'Nagashi-loss'),
	(770, 0, 0, false, true, 0, -20, 'Nagashi-loss');


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: yakuman_record; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: buckets_vectors; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: vector_indexes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 1, false);


--
-- Name: event_event_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."event_event_id_seq"', 1, false);


--
-- Name: game_ruleset_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."game_ruleset_id_seq"', 1, false);


--
-- Name: permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."permissions_id_seq"', 1, false);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."roles_id_seq"', 1, true);


--
-- Name: score_lookup_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."score_lookup_id_seq"', 770, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."users_id_seq"', 1, false);


--
-- PostgreSQL database dump complete
--

-- \unrestrict MgURAJYuVujtyR3J7ezyirxhG2IqEBcbaWoHzybfWhczBKyViV0xrkZ5AWka6an

RESET ALL;
