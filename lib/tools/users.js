'use strict';

const { z } = require('zod');

let user;

try {
	user = require.main.require('./src/user');
} catch (e) {
	// Fallback during local checking
}

module.exports = {
	register(server, getContextUid) {
		// Tool: get_user_profile
		server.tool(
			'get_user_profile',
			'Get public forum profile information by username or User ID (UID).',
			{
				uid: z.number().int().positive().optional().describe('User ID to look up.'),
				username: z.string().optional().describe('Username to look up (if UID is omitted).'),
			},
			async ({ uid, username }) => {
				const callerUid = getContextUid();
				try {
					if (!user || !user.getUserData) {
						return { isError: true, content: [{ type: 'text', text: 'User module unavailable.' }] };
					}

					let targetUid = uid;
					if (!targetUid && username) {
						targetUid = await user.getUidByUsername(username);
					}

					if (!targetUid) {
						return { isError: true, content: [{ type: 'text', text: `User not found.` }] };
					}

					const userData = await user.getUserData(targetUid);
					if (!userData) {
						return { isError: true, content: [{ type: 'text', text: `User profile for UID ${targetUid} not found.` }] };
					}

					// Scrub private information (like email, ip, password hashes)
					const cleanProfile = {
						uid: userData.uid,
						username: userData.username,
						displayname: userData.displayname || userData.username,
						status: userData.status,
						reputation: userData.reputation || 0,
						postcount: userData.postcount || 0,
						topiccount: userData.topiccount || 0,
						joindate: userData.joindate,
						lastonline: userData.lastonline,
						signature: userData.signature || '',
						banned: !!userData.banned,
					};

					return {
						content: [
							{
								type: 'text',
								text: JSON.stringify(cleanProfile, null, 2),
							},
						],
					};
				} catch (err) {
					return { isError: true, content: [{ type: 'text', text: `Error fetching user profile: ${err.message}` }] };
				}
			}
		);
	},
};
