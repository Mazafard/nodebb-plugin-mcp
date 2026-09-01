'use strict';

const { z } = require('zod');

let topics;

try {
	topics = require.main.require('./src/topics');
} catch (e) {
	// Fallback during local checking
}

module.exports = {
	registerAll(server, getContextUid) {
		// Prompt 1: summarize_thread
		server.prompt(
			'summarize_thread',
			'Generate a concise, structured summary of a discussion thread on the forum.',
			{
				tid: z.string().describe('Topic ID (TID) to summarize.'),
			},
			async ({ tid }) => {
				const uid = getContextUid();
				const topicId = parseInt(tid, 10);
				let topicTitle = `Topic #${topicId}`;
				let threadContent = '';

				if (topics && topics.getTopicData) {
					const topicData = await topics.getTopicData(topicId);
					if (topicData) {
						topicTitle = topicData.title;
						const postsData = await topics.getTopicPosts(topicData, 'tid:' + topicId + ':posts', 0, 30, uid, true);
						threadContent = (postsData || []).map(p => `[${p.user ? p.user.username : 'User'}]: ${p.content}`).join('\n\n');
					}
				}

				return {
					messages: [
						{
							role: 'user',
							content: {
								type: 'text',
								text: `Please summarize the following forum discussion thread.\n\nThread Title: "${topicTitle}"\n\nContent:\n${threadContent}\n\nProvide:
1. Executive Overview (2-3 sentences)
2. Key Points & Consensus
3. Outstanding Questions / Action Items`,
							},
						},
					],
				};
			}
		);

		// Prompt 2: draft_announcement
		server.prompt(
			'draft_announcement',
			'Draft a welcoming, well-formatted forum announcement post with markdown formatting.',
			{
				topicTitle: z.string().describe('The topic/subject of the announcement.'),
				targetAudience: z.string().optional().describe('Target audience (e.g. all members, developers, moderators).'),
				keyDetails: z.string().describe('Key points, release notes, or rules to include.'),
			},
			async ({ topicTitle, targetAudience, keyDetails }) => {
				return {
					messages: [
						{
							role: 'user',
							content: {
								type: 'text',
								text: `Draft a professional and engaging NodeBB forum announcement topic.\n\nTitle: ${topicTitle}\nAudience: ${targetAudience || 'Community Members'}\nKey Details:\n${keyDetails}\n\nPlease format with markdown headings, bullet points, and an encouraging closing sentence.`,
							},
						},
					],
				};
			}
		);
	},
};
