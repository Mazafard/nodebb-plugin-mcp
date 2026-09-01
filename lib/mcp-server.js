'use strict';

const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const tools = require('./tools');
const resources = require('./resources');
const prompts = require('./prompts');
const Settings = require('./settings');

class NodeBBMcpServer {
	constructor() {
		this.server = null;
		this.currentContextUid = 1;
	}

	async createServer(contextUid = 1) {
		const settings = await Settings.get();

		const server = new McpServer(
			{
				name: 'nodebb-mcp-server',
				version: '1.0.0',
			},
			{
				capabilities: {
					tools: {},
					resources: {},
					prompts: {},
				},
			}
		);

		let activeUid = contextUid;
		const getContextUid = () => activeUid;

		// Register tools, resources, and prompts
		tools.registerAll(server, getContextUid, settings);
		resources.registerAll(server, getContextUid);
		prompts.registerAll(server, getContextUid);

		return { server, setContextUid: (uid) => { activeUid = uid; } };
	}
}

module.exports = new NodeBBMcpServer();
