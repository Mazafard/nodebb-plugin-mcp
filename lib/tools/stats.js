'use strict';

let db;
let meta;

try {
	db = require.main.require('./src/database');
	meta = require.main.require('./src/meta');
} catch (e) {
	// Fallback during local checking
}

module.exports = {
	register(server, getContextUid) {
		server.tool(
			'get_forum_stats',
			'Get global forum statistics including total topics, posts, registered users, and active users.',
			{},
			async () => {
				try {
					let stats = {
						topics: 0,
						posts: 0,
						users: 0,
					};

					if (db && db.getObject) {
						const globalStats = await db.getObject('global');
						if (globalStats) {
							stats.topics = parseInt(globalStats.topicCount || globalStats.topicCountTotal || 0, 10);
							stats.posts = parseInt(globalStats.postCount || globalStats.postCountTotal || 0, 10);
							stats.users = parseInt(globalStats.userCount || 0, 10);
						}
					}

					return {
						content: [
							{
								type: 'text',
								text: JSON.stringify(stats, null, 2),
							},
						],
					};
				} catch (err) {
					return { isError: true, content: [{ type: 'text', text: `Error fetching forum stats: ${err.message}` }] };
				}
			}
		);
	},
};
