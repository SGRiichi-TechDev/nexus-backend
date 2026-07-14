import { defineRelations } from "drizzle-orm";
import * as schema from "./schema.js";

export const relations = defineRelations(schema, (r) => ({
	eventInfo: {
		rulesetInfo: r.one.rulesetInfo({
			from: r.eventInfo.rulesetId,
			to: r.rulesetInfo.rulesetId
		}),
		playerInfos: r.many.playerInfo({
			from: r.eventInfo.eventId.through(r.eventResult.eventId),
			to: r.playerInfo.playerId.through(r.eventResult.playerId)
		}),
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
	},
	gameInfo: {
		mode: r.one.mode({
			from: r.gameInfo.modeId,
			to: r.mode.modeId
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
	venue: {
		gameInfos: r.many.gameInfo(),
		modes: r.many.mode(),
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
			from: r.playerDetails.pid,
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
	users: {
		userRolesGrantedBy: r.many.userRoles({
			alias: "userRoles_grantedBy_users_id"
		}),
		userRolesUserId: r.many.userRoles({
			alias: "userRoles_userId_users_id"
		}),
	},
}))