'use strict';

const Settings = require('./settings');

const Auth = {
	async authenticate(req) {
		const settings = await Settings.get();

		// If auth is explicitly turned off in settings (dev mode only)
		if (settings.requireAuth !== 'on') {
			return { uid: parseInt(settings.botUid, 10) || 1, label: 'Unauthenticated Mode' };
		}

		let token = null;

		// Check Authorization Header
		const authHeader = req.headers['authorization'];
		if (authHeader && typeof authHeader === 'string') {
			if (authHeader.startsWith('Bearer ')) {
				token = authHeader.substring(7).trim();
			} else {
				token = authHeader.trim();
			}
		}

		// Fallback to query param for EventSource / SSE clients that don't support custom headers
		if (!token && req.query && req.query.token) {
			token = String(req.query.token).trim();
		}

		if (!token) {
			return null;
		}

		// Look up token in database
		const tokenData = await Settings.getTokenData(token);
		if (!tokenData) {
			return null;
		}

		return tokenData;
	},

	middleware() {
		return async (req, res, next) => {
			try {
				const user = await Auth.authenticate(req);
				if (!user) {
					return res.status(401).json({
						error: 'Unauthorized',
						message: 'Invalid or missing MCP Bearer Token. Provide via Authorization header or ?token= query parameter.',
					});
				}
				req.mcpUser = user;
				next();
			} catch (err) {
				return res.status(500).json({ error: 'Auth Error', message: err.message });
			}
		};
	},
};

module.exports = Auth;
