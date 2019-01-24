const sendEmail = require('./SendEmail.js');

async function sendCustomersEveningEmail({email, ...data}) {
	return sendEmail({
		email,
		data,
		templateId: 'd-ce9155013d1e4f77920aa27685757a6e',
	});
}

module.exports = {
	sendCustomersEveningEmail,
};
