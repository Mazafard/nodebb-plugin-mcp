'use strict';

const { z } = require('zod');

let topics;
let posts;
let privileges;

try {
	topics = require.main.require('./src/topics');
	posts = require.main.require('./src/posts');
	privileges = require.main.require('./src/privileges');
} catch (e) {
	// Fallback during local checking
}

module.exports = {
	register(server, getContextUid) {
		// Tool: get_topic
		server.tool(
			'get_topic',
			'Retrieve topic metadata and its posts by Topic ID (TID).',
			{
				tid: z.number().int().positive().describe('Topic ID (TID) to fetch.'),
				page: z.number().int().min(1).optional().default(1).describe('Page number of posts (default: 1).'),
				perPage: z.number().int().min(1).max(50).optional().default(20).describe('Number of posts per page (default: 20, max: 50).'),
			},
			async ({ tid, page, perPage }) => {
				const uid = getContextUid();
				try {
					if (!topics || !topics.getTopicData) {
						return {
							content: [{ type: 'text', text: JSON.stringify({ tid, error: 'Topics module unavailable' }) }],
						};
					}

					// Check privileges
					if (privileges && privileges.topics) {
						const canRead = await privileges.topics.can('topics:read', tid, uid);
						if (!canRead) {
							return {
								isError: true,
								content: [{ type: 'text', text: `Access denied: UID ${uid} cannot view topic ${tid}` }],
							};
						}
					}

					const topicData = await topics.getTopicData(tid);
					if (!topicData) {
						return {
							isError: true,
							content: [{ type: 'text', text: `Topic ${tid} not found.` }],
						};
					}

					const start = (page - 1) * perPage;
					const stop = page * perPage - 1;
					const postData = await topics.getTopicPosts(topicData, 'tid:' + tid + ':posts', start, stop, uid, true);

					const formattedPosts = (postData || []).map(p => ({
						pid: p.pid,
						index: p.index,
						user: p.user ? p.user.username : 'Unknown',
						uid: p.uid,
						content: p.content,
						timestamp: p.timestamp,
						votes: p.votes || 0,
						deleted: !!p.deleted,
					}));

					return {
						content: [
							{
								type: 'text',
								text: JSON.stringify({
									tid: topicData.tid,
									title: topicData.title,
									cid: topicData.cid,
									slug: topicData.slug,
									postcount: topicData.postcount,
									viewcount: topicData.viewcount,
									tags: topicData.tags ? topicData.tags.map(t => t.value || t) : [],
									locked: !!topicData.locked,
									pinned: !!topicData.pinned,
									page,
									perPage,
									posts: formattedPosts,
								}, null, 2),
							},
						],
					};
				} catch (err) {
					return {
						isError: true,
						content: [{ type: 'text', text: `Error fetching topic: ${err.message}` }],
					};
				}
			}
		);

		// Tool: get_recent_topics
		server.tool(
			'get_recent_topics',
			'Get the most recently active or popular topics across all categories the user has access to.',
			{
				page: z.number().int().min(1).optional().default(1).describe('Page number (default: 1).'),
				filter: z.enum(['recent', 'popular', 'top', 'unread']).optional().default('recent').describe('Topic filter type.'),
			},
			async ({ page, filter }) => {
				const uid = getContextUid();
				try {
					if (!topics || !topics.getLatestTopics) {
						return {
							content: [{ type: 'text', text: JSON.stringify({ topics: [] }) }],
						};
					}

					let result;
					if (filter === 'popular' && topics.getPopularTopics) {
						result = await topics.getPopularTopics({ uid, start: (page - 1) * 20, stop: page * 20 - 1 });
					} else if (filter === 'unread' && topics.getUnreadTopics) {
						result = await topics.getUnreadTopics({ uid, start: (page - 1) * 20, stop: page * 20 - 1 });
					} else {
						result = await topics.getLatestTopics({ uid, start: (page - 1) * 20, stop: page * 20 - 1 });
					}

					const topicsList = ((result && result.topics) || result || []).map(t => ({
						tid: t.tid,
						title: t.title,
						cid: t.cid,
						category: t.category ? t.category.name : undefined,
						user: t.user ? t.user.username : 'Unknown',
						postcount: t.postcount,
						lastposttime: t.lastposttime,
					}));

					return {
						content: [
							{
								type: 'text',
								text: JSON.stringify({
									filter,
									page,
									topics: topicsList,
								}, null, 2),
							},
						],
					};
				} catch (err) {
					return {
						isError: true,
						content: [{ type: 'text', text: `Error fetching recent topics: ${err.message}` }],
					};
				}
			}
		);

		// Tool: create_topic
		server.tool(
			'create_topic',
			'Create a new discussion topic in a specific category.',
			{
				cid: z.number().int().positive().describe('Category ID where the topic should be created.'),
				title: z.string().min(3).max(255).describe('Title of the new topic.'),
				content: z.string().min(2).describe('Markdown/text content of the main opening post.'),
				tags: z.array(z.string()).optional().describe('Optional tags for the topic.'),
			},
			async ({ cid, title, content, tags }) => {
				const uid = getContextUid();
				try {
					if (!topics || !topics.post) {
						return {
							isError: true,
							content: [{ type: 'text', text: 'Topic creation module unavailable in current environment.' }],
						};
					}

					const topicResult = await topics.post({
						uid,
						cid,
						title,
						content,
						tags: tags || [],
					});

					return {
						content: [
							{
								type: 'text',
								text: JSON.stringify({
									success: true,
									tid: topicResult.topicData ? topicResult.topicData.tid : topicResult.tid,
									pid: topicResult.postData ? topicResult.postData.pid : topicResult.pid,
									slug: topicResult.topicData ? topicResult.topicData.slug : undefined,
									title,
									cid,
								}, null, 2),
							},
						],
					};
				} catch (err) {
					return {
						isError: true,
						content: [{ type: 'text', text: `Failed to create topic: ${err.message}` }],
					};
				}
			}
		);
	},
};
