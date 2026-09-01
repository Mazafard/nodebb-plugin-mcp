'use strict';

const { SSEServerTransport } = require('@modelcontextprotocol/sdk/server/sse.js');
const requireNodeBB = require('./nodebb');
const mcpServerFactory = require('./mcp-server');
const Auth = require('./auth');
const Settings = require('./settings');

const activeSessions = new Map();

class CustomSSEServerTransport extends SSEServerTransport {
	constructor(endpoint, res, baseUrl) {
		super(endpoint, res);
		this._fullBaseUrl = baseUrl.replace(/\/+$/, '');
	}

	async start() {
		if (this._sseResponse) {
			throw new Error('SSEServerTransport already started!');
		}

		this.res.writeHead(200, {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache, no-transform',
			'Connection': 'keep-alive',
			'X-Accel-Buffering': 'no',
		});

		if (typeof this.res.flushHeaders === 'function') {
			this.res.flushHeaders();
		}

		const endpointPath = this._endpoint.startsWith('/') ? this._endpoint : `/${this._endpoint}`;
		const fullEndpointUrl = `${this._fullBaseUrl}${endpointPath}?sessionId=${this._sessionId}`;

		this.res.write(`event: endpoint\ndata: ${fullEndpointUrl}\n\n`);
		if (typeof this.res.flush === 'function') {
			this.res.flush();
		}

		this._sseResponse = this.res;

		const heartbeat = setInterval(() => {
			if (this._sseResponse && !this.res.writableEnded) {
				this.res.write(': keepalive\n\n');
				if (typeof this.res.flush === 'function') {
					this.res.flush();
				}
			}
		}, 15000);

		this.res.on('close', () => {
			clearInterval(heartbeat);
			this._sseResponse = undefined;
			if (typeof this.onclose === 'function') {
				this.onclose();
			}
		});
	}
}

const Routes = {
	init(params) {
		const { router, middleware } = params;
		const routeHelpers = requireNodeBB('./src/routes/helpers');
		const nconf = requireNodeBB('nconf');

		let winston;
		try {
			winston = requireNodeBB('winston');
		} catch (e) {
			winston = console;
		}

		// Helper to resolve current forum URL
		const getBaseUrl = (req) => {
			const host = req ? req.headers.host : null;
			const protocol = (req && (req.headers['x-forwarded-proto'] || (req.socket && req.socket.encrypted ? 'https' : 'http'))) || 'http';
			if (host) {
				return `${protocol}://${host}`;
			}
			return (nconf && typeof nconf.get === 'function') ? nconf.get('url') : 'http://localhost:4567';
		};

		// 1. Health Handler
		const healthHandler = async (req, res) => {
			const settings = await Settings.get();
			const baseUrl = getBaseUrl(req);
			return res.json({
				status: 'ok',
				plugin: 'nodebb-plugin-mcp',
				version: '1.0.0',
				enabled: settings.enabled === 'on',
				activeSessions: activeSessions.size,
				authRequired: settings.requireAuth === 'on',
				sseEndpoint: `${baseUrl}/api/v3/plugins/mcp/sse`,
			});
		};

		// 2. SSE Handler
		const sseHandler = async (req, res) => {
			const settings = await Settings.get();
			if (settings.enabled !== 'on') {
				return res.status(503).json({ error: 'MCP Server is currently disabled in NodeBB ACP.' });
			}

			if (req.socket) {
				req.socket.setTimeout(0);
				req.socket.setNoDelay(true);
				req.socket.setKeepAlive(true);
			}

			const user = req.mcpUser || { uid: 1 };
			const baseUrl = getBaseUrl(req);

			try {
				const transport = new CustomSSEServerTransport('/api/v3/plugins/mcp/messages', res, baseUrl);
				const { server } = await mcpServerFactory.createServer(user.uid);

				activeSessions.set(transport.sessionId, {
					transport,
					server,
					uid: user.uid,
					connectedAt: Date.now(),
				});

				winston.info(`[plugin/mcp] 🔌 AI Agent connected via SSE | Session: ${transport.sessionId} | UID: ${user.uid} (${user.label || 'API'})`);

				req.on('close', () => {
					winston.info(`[plugin/mcp] 🔌 AI Agent disconnected | Session: ${transport.sessionId}`);
					activeSessions.delete(transport.sessionId);
				});

				await server.connect(transport);
			} catch (err) {
				winston.error('[plugin/mcp] SSE Connection Error: ' + err.message);
				if (!res.headersSent) {
					res.status(500).json({ error: 'Failed to establish SSE connection', details: err.message });
				}
			}
		};

		// 3. Messages Handler (Handles incoming JSON-RPC POST requests)
		const messagesHandler = async (req, res) => {
			let sessionId = req.query.sessionId || req.headers['x-session-id'] || req.headers['mcp-session-id'];

			// If sessionId is missing from client query, fall back to the most recent active session
			if (!sessionId && activeSessions.size > 0) {
				const sessions = Array.from(activeSessions.keys());
				sessionId = sessions[sessions.length - 1];
				winston.info(`[plugin/mcp] ℹ️ Using fallback active session: ${sessionId}`);
			}

			let session = sessionId ? activeSessions.get(sessionId) : null;

			// If still no session exists (e.g. stateless HTTP POST), create a fallback session on the fly
			if (!session) {
				const user = req.mcpUser || { uid: 1 };
				const { server } = await mcpServerFactory.createServer(user.uid);
				// Process standalone request if possible or return 404
				return res.status(404).json({
					error: 'Session not found',
					message: 'No active SSE connection found for session. Please connect via GET /api/v3/plugins/mcp/sse first.',
					sessionId: sessionId || 'none',
				});
			}

			try {
				winston.info(`[plugin/mcp] 📥 Processing MCP message | Session: ${sessionId} | Method: ${req.body ? req.body.method : 'unknown'}`);
				await session.transport.handlePostMessage(req, res, req.body);
			} catch (err) {
				winston.error('[plugin/mcp] Handle Message Error: ' + err.message);
				if (!res.headersSent) {
					res.status(500).json({ error: 'Failed to process message', details: err.message });
				}
			}
		};

		// Register API routes
		router.get('/api/v3/plugins/mcp/health', healthHandler);
		router.get('/api/v3/plugins/mcp/sse', Auth.middleware(), sseHandler);
		router.post('/api/v3/plugins/mcp/messages', messagesHandler);

		router.get('/plugins/mcp/health', healthHandler);
		router.get('/plugins/mcp/sse', Auth.middleware(), sseHandler);
		router.post('/plugins/mcp/messages', messagesHandler);

		// ACP Page Route
		const renderAdminPage = async (req, res) => {
			const settings = await Settings.get();
			const tokens = await Settings.getTokens();
			const forumUrl = getBaseUrl(req);

			res.render('admin/plugins/mcp', {
				settings,
				tokens,
				forumUrl,
				activeSessionsCount: activeSessions.size,
				title: 'Model Context Protocol (MCP) Settings',
			});
		};

		if (routeHelpers && routeHelpers.setupAdminPageRoute) {
			routeHelpers.setupAdminPageRoute(router, '/admin/plugins/mcp', renderAdminPage);
		} else {
			router.get('/admin/plugins/mcp', middleware.admin.buildHeader, renderAdminPage);
		}

		// ACP Token Management API Routes
		const checkAdminPrivs = (middleware && middleware.admin && middleware.admin.checkPrivileges)
			? middleware.admin.checkPrivileges
			: (req, res, next) => next();

		const createTokenHandler = async (req, res) => {
			try {
				const { uid, label, token: customToken } = req.body;
				const crypto = require('crypto');
				const token = customToken ? customToken.trim() : ('nb_mcp_' + crypto.randomBytes(24).toString('hex'));
				const tokenData = await Settings.addToken({ token, uid: uid || 1, label: label || 'Default Agent' });
				return res.json({ success: true, tokenData });
			} catch (err) {
				return res.status(500).json({ error: err.message });
			}
		};

		const deleteTokenHandler = async (req, res) => {
			try {
				const { token } = req.params;
				await Settings.deleteToken(token);
				return res.json({ success: true });
			} catch (err) {
				return res.status(500).json({ error: err.message });
			}
		};

		router.post('/api/v3/plugins/mcp/admin/tokens', checkAdminPrivs, createTokenHandler);
		router.delete('/api/v3/plugins/mcp/admin/tokens/:token', checkAdminPrivs, deleteTokenHandler);
	},

	getActiveSessionsCount() {
		return activeSessions.size;
	},
};

module.exports = Routes;
