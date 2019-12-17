const gql = String.raw;
const slugify = require('slugify');
const sendGridClient = require('@sendgrid/client');

const {formatName} = require('../utils');

sendGridClient.setApiKey(process.env.SENDGRID_API_KEY);

async function sendEmail({
	email, meta, data, templateId,
}, ctx) {
	let assistantName = 'Edwige';

	let userSignatureName = '';

	if (meta && meta.userId) {
		const user = await ctx.db.user({id: meta.userId}).$fragment(gql`
			fragment UserWithSettings on User {
				lastName
				firstName
				settings {
					assistantName
				}
			}
		`);

		userSignatureName = formatName(user.firstName, user.lastName);

		({assistantName} = user.settings);
	}

	const assistantEmailName = slugify(assistantName.toLowerCase());

	const request = {
		method: 'POST',
		url: '/v3/mail/send',
		body: {
			from: {
				name: assistantName,
				email: `${assistantEmailName}@inyo.me`,
			},
			reply_to: {
				email: 'suivi@inyo.me',
				name: 'Suivi Inyo',
			},
			personalizations: [
				{
					to: [
						{
							email,
						},
					],
					dynamic_template_data: {...data, assistantName, userSignatureName},
				},
			],
			template_id: templateId,
		},
	};

	try {
		return sendGridClient.request(request);
	}
	catch (err) {
		console.log('Error when calling SendGrid', err.response.body.errors);
		throw new Error('Error when sending email');
	}
}

module.exports = sendEmail;
