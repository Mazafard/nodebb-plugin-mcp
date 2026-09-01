'use strict';

const Routes = require('./lib/routes');

const plugin = {
	async init(params) {
		Routes.init(params);
	},

	async addAdminNavigation(header) {
		header.plugins = header.plugins || [];
		header.plugins.push({
			route: '/plugins/mcp',
			icon: 'fa-brain',
			name: 'MCP (AI Agent Protocol)',
		});
		return header;
	},
};

module.exports = plugin;
