'use strict';

const { z } = require('zod');

let topics;
let posts;
let flags;
let privileges;

try {
	topics = require.main.require('./src/topics');
	posts = require.main.require('./src/posts');
	flags = require.main.require('./src/flags');
	privileges = require.main.require('./src/privileges');
} catch (e) {
	// Fallback during local checking
}

module.exports = {
	register(server, getContextUid) {
		// Tool: moderate_topic
		server.tool(
			'moderate_topic',
			'Perform moderation actions on a forum topic (lock, unlock, pin, unpin, move, delete, restore). Requires moderator privileges.',
			{
				tid: z.number().int().positive().describe('Topic ID (TID) to moderate.'),
				action: z.enum(['lock', 'unlock', 'pin', 'unpin', 'delete', 'restore', 'move']).describe('Moderation action to perform.'),
				targetCid: z.number().int().positive().optional().describe('Target Category ID (required only when action is "move").'),
			},
			async ({ tid, action, targetCid }) => {
				const uid = getContextUid();
				try {
					if (!topics) {
						return { isError: true, content: [{ type: 'text', text: 'Topics module unavailable.' }] };
					}

					// Verify moderator privileges
					if (privileges && privileges.topics) {
						const isMod = await privileges.topics.isAdminOrMod(tid, uid);
						if (!isMod) {
							return {
								isError: true,
								content: [{ type: 'text', text: `Access denied: UID ${uid} does not have moderator privileges for topic ${tid}.` }],
							};
						}
					}

					let resultMessage = '';

					switch (action) {
						case 'lock':
							if (topics.tools && topics.tools.lock) {
								await topics.tools.lock(tid, uid);
							} else if (topics.lock) {
								await topics.lock(tid, uid);
							}
							resultMessage = `Topic ${tid} locked successfully.`;
							break;
						case 'unlock':
							if (topics.tools && topics.tools.unlock) {
								await topics.tools.unlock(tid, uid);
							} else if (topics.unlock) {
								await topics.unlock(tid, uid);
							}
							resultMessage = `Topic ${tid} unlocked successfully.`;
							break;
						case 'pin':
							if (topics.tools && topics.tools.pin) {
								await topics.tools.pin(tid, uid);
							} else if (topics.pin) {
								await topics.pin(tid, uid);
							}
							resultMessage = `Topic ${tid} pinned successfully.`;
							break;
						case 'unpin':
							if (topics.tools && topics.tools.unpin) {
								await topics.tools.unpin(tid, uid);
							} else if (topics.unpin) {
								await topics.unpin(tid, uid);
							}
							resultMessage = `Topic ${tid} unpinned successfully.`;
							break;
						case 'delete':
							if (topics.tools && topics.tools.delete) {
								await topics.tools.delete(tid, uid);
							} else if (topics.delete) {
								await topics.delete(tid, uid);
							}
							resultMessage = `Topic ${tid} deleted successfully.`;
							break;
						case 'restore':
							if (topics.tools && topics.tools.restore) {
								await topics.tools.restore(tid, uid);
							} else if (topics.restore) {
								await topics.restore(tid, uid);
							}
							resultMessage = `Topic ${tid} restored successfully.`;
							break;
						case 'move':
							if (!targetCid) {
								return { isError: true, content: [{ type: 'text', text: 'targetCid is required when action is "move".' }] };
							}
							if (topics.tools && topics.tools.move) {
								await topics.tools.move(tid, { cid: targetCid, uid });
							} else if (topics.move) {
								await topics.move(tid, targetCid, uid);
							}
							resultMessage = `Topic ${tid} moved to category ${targetCid} successfully.`;
							break;
					}

					return {
						content: [
							{
								type: 'text',
								text: JSON.stringify({
									success: true,
									tid,
									action,
									message: resultMessage,
								}, null, 2),
							},
						],
					};
				} catch (err) {
					return { isError: true, content: [{ type: 'text', text: `Failed to moderate topic: ${err.message}` }] };
				}
			}
		);

		// Tool: flag_post
		server.tool(
			'flag_post',
			'Flag a post for moderator review due to spam, rules violation, or offensive content.',
			{
				pid: z.number().int().positive().describe('Post ID (PID) to flag.'),
				reason: z.string().min(3).describe('Reason for flagging the post.'),
			},
			async ({ pid, reason }) => {
				const uid = getContextUid();
				try {
					if (!flags || !flags.create) {
						return { isError: true, content: [{ type: 'text', text: 'Flags module unavailable.' }] };
					}

					const flagObj = await flags.create('post', pid, uid, reason);

					return {
						content: [
							{
								type: 'text',
								text: JSON.stringify({
									success: true,
									flagId: flagObj ? flagObj.flagId : undefined,
									pid,
									reason,
									message: 'Post flagged for review.',
								}, null, 2),
							},
						],
					};
				} catch (err) {
					return { isError: true, content: [{ type: 'text', text: `Failed to flag post: ${err.message}` }] };
				}
			}
		);
	},
};
