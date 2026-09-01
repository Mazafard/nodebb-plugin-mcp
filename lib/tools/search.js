'use strict';

const { z } = require('zod');

let search;
let topics;
let categories;
let privileges;

try {
	search = require.main.require('./src/search');
	topics = require.main.require('./src/topics');
	categories = require.main.require('./src/categories');
	privileges = require.main.require('./src/privileges');
} catch (e) {
	// Fallback during local syntax checking
}

module.exports = {
	register(server, getContextUid) {
		server.tool(
			'search_forum',
			'Search forum discussions, topics, and posts with optional filters for categories, terms, and sorting.',
			{
				query: z.string().min(1).describe('The search query string or keywords to find.'),
				searchIn: z.enum(['posts', 'titles']).optional().default('posts').describe('Whether to search within post content or topic titles.'),
				cid: z.number().int().positive().optional().describe('Optional category ID to restrict search to.'),
				page: z.number().int().min(1).optional().default(1).describe('Page number for paginated results.'),
			},
			async ({ query, searchIn, cid, page }) => {
				const uid = getContextUid();
				try {
					const searchData = {
						query,
						searchIn: searchIn || 'posts',
						page: page || 1,
						uid,
					};

					if (cid) {
						searchData.categories = [cid];
					}

					let result = null;
					if (search && search.search) {
						result = await search.search(searchData);
					}

					if (!result || (!result.posts && !result.topics)) {
						return {
							content: [
								{
									type: 'text',
									text: JSON.stringify({
										query,
										totalCount: 0,
										results: [],
										message: 'No results found matching query.',
									}, null, 2),
								},
							],
						};
					}

					const items = (result.posts || result.topics || []).map((item) => ({
						tid: item.tid,
						pid: item.pid,
						title: item.topic ? item.topic.title : item.title,
						snippet: item.content ? item.content.slice(0, 300) : '',
						category: item.category ? item.category.name : undefined,
						user: item.user ? item.user.username : undefined,
						timestamp: item.timestamp,
					}));

					return {
						content: [
							{
								type: 'text',
								text: JSON.stringify({
									query,
									totalCount: items.length,
									page,
									results: items,
								}, null, 2),
							},
						],
					};
				} catch (err) {
					return {
						isError: true,
						content: [
							{
								type: 'text',
								text: `Error performing search: ${err.message}`,
							},
						],
					};
				}
			}
		);
	},
};
