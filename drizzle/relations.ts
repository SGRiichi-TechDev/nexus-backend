import { defineRelations } from "drizzle-orm";
import * as schema from "./schema.js";

export const relations = defineRelations(schema, (r) => ({
	appSettings: {
		user: r.one.users({
			from: r.appSettings.updatedBy,
			to: r.users.id
		}),
	},
	users: {
		appSettings: r.many.appSettings(),
		auditLogs: r.many.auditLog(),
		telegramAdminActions: r.many.telegramAdminActions(),
		telegramAdminLinkTokens: r.many.telegramAdminLinkTokens(),
		telegramAdminLinks: r.many.telegramAdminLinks(),
		telegramOutboxes: r.many.telegramOutbox(),
		userRolesGrantedBy: r.many.userRoles({
			alias: "userRoles_grantedBy_users_id"
		}),
		userRolesUserId: r.many.userRoles({
			alias: "userRoles_userId_users_id"
		}),
		playerInfo: r.one.playerInfo({
			from: r.users.playerId,
			to: r.playerInfo.playerId
		}),
		venueOrganisersGrantedBy: r.many.venueOrganisers({
			alias: "venueOrganisers_grantedBy_users_id"
		}),
		venueOrganisersUserId: r.many.venueOrganisers({
			alias: "venueOrganisers_userId_users_id"
		}),
	},
	auditLog: {
		user: r.one.users({
			from: r.auditLog.actorUserId,
			to: r.users.id
		}),
	},
	cityLookup: {
		countryLookup: r.one.countryLookup({
			from: r.cityLookup.countryCode,
			to: r.countryLookup.countryCode
		}),
		eventInfos: r.many.eventInfo(),
	},
	countryLookup: {
		cityLookups: r.many.cityLookup(),
		eventInfos: r.many.eventInfo(),
	},
	eventInfo: {
		cityLookup: r.one.cityLookup({
			from: r.eventInfo.cityCode,
			to: r.cityLookup.cityCode
		}),
		countryLookup: r.one.countryLookup({
			from: r.eventInfo.countryCode,
			to: r.countryLookup.countryCode
		}),
		eventFormat: r.one.eventFormat({
			from: r.eventInfo.formatId,
			to: r.eventFormat.formatId
		}),
		eventInfo: r.one.eventInfo({
			from: r.eventInfo.parentEventId,
			to: r.eventInfo.eventId,
			alias: "eventInfo_parentEventId_eventInfo_eventId"
		}),
		eventInfos: r.many.eventInfo({
			alias: "eventInfo_parentEventId_eventInfo_eventId"
		}),
		venue: r.one.venue({
			from: r.eventInfo.venueId,
			to: r.venue.venueId
		}),
		rulesetInfo: r.one.rulesetInfo({
			from: r.eventInfo.rulesetId,
			to: r.rulesetInfo.rulesetId
		}),
		playerInfos: r.many.playerInfo({
			from: r.eventInfo.eventId.through(r.eventResult.eventId),
			to: r.playerInfo.playerId.through(r.eventResult.playerId)
		}),
		gameInfos: r.many.gameInfo(),
	},
	eventFormat: {
		eventInfos: r.many.eventInfo(),
	},
	venue: {
		eventInfos: r.many.eventInfo(),
		gameInfos: r.many.gameInfo(),
		modes: r.many.mode(),
		venueOrganisers: r.many.venueOrganisers(),
	},
	rulesetInfo: {
		eventInfos: r.many.eventInfo(),
		gameInfos: r.many.gameInfo(),
		ruleDetail: r.one.ruleDetails({
			from: r.rulesetInfo.moreDetails,
			to: r.ruleDetails.ruleDetailsId
		}),
	},
	playerInfo: {
		eventInfos: r.many.eventInfo(),
		gameInfos: r.many.gameInfo(),
		handPlayerResults: r.many.handPlayerResult(),
		handTransactionsPayeePlayerId: r.many.handTransaction({
			alias: "handTransaction_payeePlayerId_playerInfo_playerId"
		}),
		handTransactionsPayerPlayerId: r.many.handTransaction({
			alias: "handTransaction_payerPlayerId_playerInfo_playerId"
		}),
		handInfos: r.many.handInfo(),
		playerDetails: r.many.playerDetails(),
		registrations: r.many.registrations(),
		users: r.many.users(),
	},
	gameInfo: {
		eventInfo: r.one.eventInfo({
			from: r.gameInfo.eventId,
			to: r.eventInfo.eventId
		}),
		mode: r.one.mode({
			from: r.gameInfo.modeId,
			to: r.mode.modeId
		}),
		umaPositionalLookup: r.one.umaPositionalLookup({
			from: r.gameInfo.positionalUmaId,
			to: r.umaPositionalLookup.positionalUmaId
		}),
		rulesetInfo: r.one.rulesetInfo({
			from: r.gameInfo.rulesetId,
			to: r.rulesetInfo.rulesetId
		}),
		venue: r.one.venue({
			from: r.gameInfo.venueId,
			to: r.venue.venueId
		}),
		playerInfos: r.many.playerInfo({
			from: r.gameInfo.gameId.through(r.gameResult.gameId),
			to: r.playerInfo.playerId.through(r.gameResult.playerId)
		}),
		handInfos: r.many.handInfo(),
		handPlayerResults: r.many.handPlayerResult(),
	},
	mode: {
		gameInfos: r.many.gameInfo(),
		venue: r.one.venue({
			from: r.mode.venueId,
			to: r.venue.venueId
		}),
	},
	umaPositionalLookup: {
		gameInfos: r.many.gameInfo(),
	},
	handInfo: {
		gameInfo: r.one.gameInfo({
			from: r.handInfo.gameId,
			to: r.gameInfo.gameId
		}),
		handPlayerResults: r.many.handPlayerResult(),
		handTransactions: r.many.handTransaction(),
		playerInfos: r.many.playerInfo({
			from: r.handInfo.handId.through(r.handWin.handId),
			to: r.playerInfo.playerId.through(r.handWin.winnerPlayerId)
		}),
	},
	handPlayerResult: {
		gameInfoRelation: r.one.gameInfo({
			from: r.handPlayerResult.gameInfo,
			to: r.gameInfo.gameId
		}),
		handInfo: r.one.handInfo({
			from: r.handPlayerResult.handId,
			to: r.handInfo.handId
		}),
		playerInfo: r.one.playerInfo({
			from: r.handPlayerResult.playerId,
			to: r.playerInfo.playerId
		}),
	},
	handTransaction: {
		handInfo: r.one.handInfo({
			from: r.handTransaction.handId,
			to: r.handInfo.handId
		}),
		playerInfoPayeePlayerId: r.one.playerInfo({
			from: r.handTransaction.payeePlayerId,
			to: r.playerInfo.playerId,
			alias: "handTransaction_payeePlayerId_playerInfo_playerId"
		}),
		playerInfoPayerPlayerId: r.one.playerInfo({
			from: r.handTransaction.payerPlayerId,
			to: r.playerInfo.playerId,
			alias: "handTransaction_payerPlayerId_playerInfo_playerId"
		}),
	},
	handWin: {
		yakuLookups: r.many.yakuLookup({
			from: r.handWin.handWinId.through(r.handYaku.handWinId),
			to: r.yakuLookup.yakuId.through(r.handYaku.yakuId)
		}),
	},
	yakuLookup: {
		handWins: r.many.handWin(),
	},
	playerDetails: {
		playerInfo: r.one.playerInfo({
			from: r.playerDetails.playerId,
			to: r.playerInfo.playerId
		}),
	},
	registrations: {
		playerInfo: r.one.playerInfo({
			from: r.registrations.playerId,
			to: r.playerInfo.playerId
		}),
	},
	permissions: {
		roles: r.many.roles({
			from: r.permissions.id.through(r.rolePermissions.permissionId),
			to: r.roles.id.through(r.rolePermissions.roleId)
		}),
	},
	roles: {
		permissions: r.many.permissions(),
		userRoles: r.many.userRoles(),
	},
	ruleDetails: {
		rulesetInfos: r.many.rulesetInfo(),
	},
	telegramAdminActions: {
		user: r.one.users({
			from: r.telegramAdminActions.userId,
			to: r.users.id
		}),
	},
	telegramAdminLinkTokens: {
		user: r.one.users({
			from: r.telegramAdminLinkTokens.userId,
			to: r.users.id
		}),
	},
	telegramAdminLinks: {
		user: r.one.users({
			from: r.telegramAdminLinks.userId,
			to: r.users.id
		}),
	},
	telegramOutbox: {
		user: r.one.users({
			from: r.telegramOutbox.userId,
			to: r.users.id
		}),
	},
	userRoles: {
		userGrantedBy: r.one.users({
			from: r.userRoles.grantedBy,
			to: r.users.id,
			alias: "userRoles_grantedBy_users_id"
		}),
		role: r.one.roles({
			from: r.userRoles.roleId,
			to: r.roles.id
		}),
		userUserId: r.one.users({
			from: r.userRoles.userId,
			to: r.users.id,
			alias: "userRoles_userId_users_id"
		}),
	},
	venueOrganisers: {
		userGrantedBy: r.one.users({
			from: r.venueOrganisers.grantedBy,
			to: r.users.id,
			alias: "venueOrganisers_grantedBy_users_id"
		}),
		userUserId: r.one.users({
			from: r.venueOrganisers.userId,
			to: r.users.id,
			alias: "venueOrganisers_userId_users_id"
		}),
		venue: r.one.venue({
			from: r.venueOrganisers.venueId,
			to: r.venue.venueId
		}),
	},
}))