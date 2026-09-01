'use strict';

const searchTools = require('./search');
const categoriesTools = require('./categories');
const topicsTools = require('./topics');
const postsTools = require('./posts');
const usersTools = require('./users');
const moderationTools = require('./moderation');
const statsTools = require('./stats');

module.exports = {
	registerAll(server, getContextUid, settings = {}) {
		// Read-only tools
		if (settings.enableReadTools !== 'off') {
			searchTools.register(server, getContextUid);
			categoriesTools.register(server, getContextUid);
			usersTools.register(server, getContextUid);
			statsTools.register(server, getContextUid);
		}

		// Write tools (topics, posts)
		if (settings.enableWriteTools !== 'off') {
			topicsTools.register(server, getContextUid);
			postsTools.register(server, getContextUid);
		}

		// Moderation tools
		if (settings.enableModTools === 'on') {
			moderationTools.register(server, getContextUid);
		}
	},
};
