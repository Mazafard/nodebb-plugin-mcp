'use strict';

const { ResourceTemplate } = require('@modelcontextprotocol/sdk/server/mcp.js');

let categories;
let topics;
let db;

try {
	categories = require.main.require('./src/categories');
	topics = require.main.require('./src/topics');
	db = require.main.require('./src/database');
} catch (e) {
	// Fallback during local checking
}

module.exports = {
	registerAll(server, getContextUid) {
		// Resource: All Categories
		server.resource(
			'categories',
			'nodebb://categories',
			async (uri) => {
				const uid = getContextUid();
				let catList = [];
				if (categories && categories.getCategoriesByRole) {
					catList = await categories.getCategoriesByRole({ uid, privs: ['read'] });
				}
				return {
					contents: [
						{
							uri: uri.href,
							mimeType: 'application/json',
							text: JSON.stringify(catList || [], null, 2),
						},
					],
				};
			}
		);

		// Dynamic Resource Template: Topic by TID
		server.resource(
			'topic',
			new ResourceTemplate('nodebb://topic/{tid}', { list: undefined }),
			async (uri, { tid }) => {
				const uid = getContextUid();
				const topicId = parseInt(tid, 10);
				let topicData = null;
				let postsData = [];
				if (topics && topics.getTopicData) {
					topicData = await topics.getTopicData(topicId);
					if (topicData) {
						postsData = await topics.getTopicPosts(topicData, 'tid:' + topicId + ':posts', 0, 50, uid, true);
					}
				}
				return {
					contents: [
						{
							uri: uri.href,
							mimeType: 'application/json',
							text: JSON.stringify({ topic: topicData, posts: postsData }, null, 2),
						},
					],
				};
			}
		);
	},
};
