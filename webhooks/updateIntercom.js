const moment = require('moment');
const IntercomClient = require('intercom-client').Client;
const {prisma} = require('../generated/prisma-client');

const gql = String.raw;

const intercom = new IntercomClient({token: process.env.INTERCOM_TOKEN});

const updateIntercom = async (req, res) => {
	console.log('Updating number of active days last 7 days.');

	let sessionsDayFragments = '';

	for (let index = 6; index >= 0; index--) {
		sessionsDayFragments += gql`
			day${index}: userEvents(where: {
				type: ME_CALL
				createdAt_gt: "${moment()
		.subtract(index + 1, 'days')
		.format()}"
				createdAt_lt: "${moment()
		.subtract(index, 'days')
		.format()}"
			}, first: 1) {
				createdAt
			}

			dayActive${index}: userEvents(where: {
				type_in: [
					FOCUSED_TASK
					UNFOCUSED_TASK
				]
				createdAt_gt: "${moment()
		.subtract(index + 1, 'days')
		.format()}"
				createdAt_lt: "${moment()
		.subtract(index, 'days')
		.format()}"
			}, first: 1) {
				createdAt
			}
		`;
	}

	const users = await prisma.users({
		where: {
			userEvents_some: {
				createdAt_gt: moment()
					.subtract(8, 'days')
					.format(),
			},
		},
	}).$fragment(gql`
		fragment UserSessions on User {
			email
			${sessionsDayFragments}
		}
	`);

	await Promise.all(
		users.map((user) => {
			const sessions = [];
			const activeSessions = [];

			for (let index = 6; index >= 0; index--) {
				sessions.push(...user[`day${index}`]);
				activeSessions.push(...user[`dayActive${index}`]);
			}

			const sessionsCount = sessions.length;
			const activeSessionsCount = activeSessions.length;

			return intercom.users.update({
				email: user.email,
				custom_attributes: {
					'visit-days-last-7-days': sessionsCount,
					'active-days-last-7-days': activeSessionsCount,
				},
			});
		}),
	);

	console.log('Updated number of active days last 7 days.');
	res.send(200);
};

module.exports = {
	updateIntercom,
};
