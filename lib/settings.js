'use strict';

const requireNodeBB = require('./nodebb');

let meta = requireNodeBB('./src/meta');
let db = requireNodeBB('./src/database');

const SETTINGS_KEY = 'plugin-mcp:settings';
const TOKENS_HASH = 'plugin-mcp:tokens';

const defaultSettings = {
	enabled: 'on',
	botUid: '1',
	requireAuth: 'on',
	enableReadTools: 'on',
	enableWriteTools: 'on',
	enableModTools: 'off',
	rateLimitPerMinute: 60,
	logRequests: 'on',
};

const Settings = {
	async get() {
		if (!meta.settings) meta = requireNodeBB('./src/meta');
		const raw = (meta.settings && meta.settings.get) ? (await meta.settings.get('mcp') || {}) : {};
		return Object.assign({}, defaultSettings, raw);
	},

	async set(data) {
		if (!meta.settings) meta = requireNodeBB('./src/meta');
		return (meta.settings && meta.settings.set) ? await meta.settings.set('mcp', data) : null;
	},

	async getTokens() {
		if (!db.getObject) db = requireNodeBB('./src/database');
		const tokens = db.getObject ? await db.getObject(TOKENS_HASH) : null;
		if (!tokens) return [];
		return Object.keys(tokens).map((token) => {
			try {
				return JSON.parse(tokens[token]);
			} catch (e) {
				return { token, uid: 1, label: 'API Key', createdAt: Date.now() };
			}
		});
	},

	async addToken({ token, uid, label }) {
		if (!db.setObjectField) db = requireNodeBB('./src/database');
		const payload = {
			token,
			uid: parseInt(uid, 10) || 1,
			label: (label || 'API Key').trim(),
			createdAt: Date.now(),
		};
		if (db.setObjectField) {
			await db.setObjectField(TOKENS_HASH, token, JSON.stringify(payload));
		}
		return payload;
	},

	async deleteToken(token) {
		if (!db.deleteObjectField) db = requireNodeBB('./src/database');
		if (db.deleteObjectField) {
			await db.deleteObjectField(TOKENS_HASH, token);
		}
	},

	async getTokenData(token) {
		if (!token) return null;
		if (!db.getObjectField) db = requireNodeBB('./src/database');
		const raw = db.getObjectField ? await db.getObjectField(TOKENS_HASH, token) : null;
		if (!raw) return null;
		try {
			return JSON.parse(raw);
		} catch (e) {
			return null;
		}
	},
};

module.exports = Settings;
