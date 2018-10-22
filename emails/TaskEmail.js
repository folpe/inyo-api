const sendEmail = require('./SendEmail.js');

async function sendTaskValidationEmail({email, user, customerName, itemName, projectName, sectionsi, quoteUrl}) {
  return sendEmail(email, {user, customerName, projectName, itemName, sections, quoteUrl}, 'd-83233d7427a642a9a9218f3f7d7db5e0');
}

module.exports = {
  sendTaskValidationEmail,
}
