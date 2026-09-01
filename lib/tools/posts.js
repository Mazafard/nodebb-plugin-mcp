'use strict';

const { z } = require('zod');

let posts;
let topics;
let privileges;

try {
	posts = require.main.require('./src/posts');
	topics = require.main.require('./src/topics');
	privileges = require.main.require('./src/privileges');
} catch (e) {
	// Fallback during local checking
}

module.exports = {
	register(server, getContextUid) {
		// Tool: get_post
		server.tool(
			'get_post',
			'Fetch details and content of a single post by Post ID (PID).',
			{
				pid: z.number().int().positive().describe('Post ID (PID) to retrieve.'),
			},
			async ({ pid }) => {
				const uid = getContextUid();
				try {
					if (!posts || !posts.getPostData) {
						return { isError: true, content: [{ type: 'text', text: 'Posts module unavailable.' }] };
					}

					const postData = await posts.getPostData(pid);
					if (!postData) {
						return { isError: true, content: [{ type: 'text', text: `Post ${pid} not found.` }] };
					}

					// Check privileges
					if (privileges && privileges.posts) {
						const canRead = await privileges.posts.can('posts:read', pid, uid);
						if (!canRead) {
							return { isError: true, content: [{ type: 'text', text: `Access denied for post ${pid}` }] };
						}
					}

					return {
						content: [
							{
								type: 'text',
								text: JSON.stringify({
									pid: postData.pid,
									tid: postData.tid,
									uid: postData.uid,
									content: postData.content,
									timestamp: postData.timestamp,
									deleted: !!postData.deleted,
									upvotes: postData.upvotes || 0,
									downvotes: postData.downvotes || 0,
								}, null, 2),
							},
						],
					};
				} catch (err) {
					return { isError: true, content: [{ type: 'text', text: `Error fetching post: ${err.message}` }] };
				}
			}
		);

		// Tool: create_reply
		server.tool(
			'create_reply',
			'Post a reply to an existing forum topic.',
			{
				tid: z.number().int().positive().describe('Topic ID (TID) to reply to.'),
				content: z.string().min(2).describe('Markdown/text content of the reply post.'),
				toPid: z.number().int().positive().optional().describe('Optional parent Post ID (PID) being replied to.'),
			},
			async ({ tid, content, toPid }) => {
				const uid = getContextUid();
				try {
					if (!topics || !topics.reply) {
						return { isError: true, content: [{ type: 'text', text: 'Reply module unavailable.' }] };
					}

					const replyData = await topics.reply({
						uid,
						tid,
						content,
						toPid: toPid || undefined,
					});

					return {
						content: [
							{
								type: 'text',
								text: JSON.stringify({
									success: true,
									pid: replyData.pid,
									tid: replyData.tid,
									index: replyData.index,
									timestamp: replyData.timestamp,
								}, null, 2),
							},
						],
					};
				} catch (err) {
					return { isError: true, content: [{ type: 'text', text: `Failed to create reply: ${err.message}` }] };
				}
			}
		);

		// Tool: edit_post
		server.tool(
			'edit_post',
			'Edit the content of an existing post (and optionally topic title if main post).',
			{
				pid: z.number().int().positive().describe('Post ID (PID) to edit.'),
				content: z.string().min(2).describe('Updated post content.'),
				title: z.string().optional().describe('Updated topic title if editing the main post of a topic.'),
			},
			async ({ pid, content, title }) => {
				const uid = getContextUid();
				try {
					if (!posts || !posts.edit) {
						return { isError: true, content: [{ type: 'text', text: 'Post edit module unavailable.' }] };
					}

					const editPayload = {
						uid,
						pid,
						content,
					};

					if (title) {
						editPayload.title = title;
					}

					const result = await posts.edit(editPayload);

					return {
						content: [
							{
								type: 'text',
								text: JSON.stringify({
									success: true,
									pid,
									tid: result.topic ? result.topic.tid : undefined,
									updatedContentSnippet: content.slice(0, 150),
								}, null, 2),
							},
						],
					};
				} catch (err) {
					return { isError: true, content: [{ type: 'text', text: `Failed to edit post: ${err.message}` }] };
				}
			}
		);
	},
};
