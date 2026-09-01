'use strict';

const { z } = require('zod');

let categories;
let privileges;

try {
	categories = require.main.require('./src/categories');
	privileges = require.main.require('./src/privileges');
} catch (e) {
	// Fallback during local checking
}

module.exports = {
	register(server, getContextUid) {
		// Tool 1: list_categories
		server.tool(
			'list_categories',
			'List all forum categories, hierarchy, topics counts, descriptions, and access privileges.',
			{
				parentCid: z.number().int().nonnegative().optional().describe('Parent category ID to fetch subcategories for (0 or omitted for root).'),
			},
			async ({ parentCid }) => {
				const uid = getContextUid();
				try {
					let catList = [];
					if (categories && categories.getCategoriesByRole) {
						catList = await categories.getCategoriesByRole({ uid, privs: ['read', 'topics:read'] });
					} else if (categories && categories.getCategories) {
						catList = await categories.getCategories([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], uid);
					}

					const filtered = (catList || [])
						.filter(c => c && (!parentCid || c.parentCid === parentCid))
						.map(c => ({
							cid: c.cid,
							name: c.name,
							description: c.description,
							slug: c.slug,
							parentCid: c.parentCid,
							topicCount: c.topic_count || c.totalTopicCount || 0,
							postCount: c.post_count || c.totalPostCount || 0,
							disabled: !!c.disabled,
							isSection: !!c.isSection,
						}));

					return {
						content: [
							{
								type: 'text',
								text: JSON.stringify({ categories: filtered }, null, 2),
							},
						],
					};
				} catch (err) {
					return {
						isError: true,
						content: [{ type: 'text', text: `Error fetching categories: ${err.message}` }],
					};
				}
			}
		);

		// Tool 2: get_category_topics
		server.tool(
			'get_category_topics',
			'Get paginated topics within a specific category.',
			{
				cid: z.number().int().positive().describe('Category ID to retrieve topics from.'),
				page: z.number().int().min(1).optional().default(1).describe('Page number (starts at 1).'),
				sort: z.enum(['newest', 'most_posts', 'most_views']).optional().default('newest').describe('Topic sorting order.'),
			},
			async ({ cid, page, sort }) => {
				const uid = getContextUid();
				try {
					if (!categories || !categories.getCategoryTopics) {
						return {
							content: [{ type: 'text', text: JSON.stringify({ cid, page, topics: [] }) }],
						};
					}

					const data = await categories.getCategoryTopics({
						cid,
						uid,
						set: sort === 'newest' ? 'cid:' + cid + ':tids' : 'cid:' + cid + ':tids:posts',
						start: (page - 1) * 20,
						stop: page * 20 - 1,
					});

					const topicsList = (data.topics || []).map(t => ({
						tid: t.tid,
						title: t.title,
						slug: t.slug,
						user: t.user ? t.user.username : 'Guest',
						postcount: t.postcount,
						viewcount: t.viewcount,
						timestamp: t.timestamp,
						lastposttime: t.lastposttime,
						locked: !!t.locked,
						pinned: !!t.pinned,
						deleted: !!t.deleted,
					}));

					return {
						content: [
							{
								type: 'text',
								text: JSON.stringify({
									cid,
									categoryName: data.name,
									page,
									totalTopics: data.totalTopicCount || topicsList.length,
									topics: topicsList,
								}, null, 2),
							},
						],
					};
				} catch (err) {
					return {
						isError: true,
						content: [{ type: 'text', text: `Error fetching category topics: ${err.message}` }],
					};
				}
			}
		);
	},
};
