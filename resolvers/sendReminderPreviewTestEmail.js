const {sendReminderEmail} = require('../events');
const {
	createItemOwnerFilter,
	formatFullName,
	formatName,
	getUserId,
	getAppUrl,
} = require('../utils');

const gql = String.raw;

const templatesId = {
	DELAY: 'd-90847153d18843ad97755874cf092130',
	FIRST: 'd-e39a839701644fd9935f437056ad535a',
	SECOND: 'd-4ad0e13f00dd485ca0d98fd1d62cd7f6',
	LAST: 'd-97b5ce25a4464a3888b359ac02f34168',
};

const sendReminderPreviewTestEmail = async (parent, {taskId, type}, ctx) => {
	const userId = getUserId(ctx);
	const [item] = await ctx.db.items({
		where: {
			AND: [
				{
					id: taskId,
				},
				createItemOwnerFilter(userId),
			],
		},
	}).$fragment(gql`
		fragment Item on Item {
			id
			name
			status
			focusedBy {
				id
			}
			owner {
				firstName
				lastName
				email
			}
			linkedCustomer {
				token
				title
				firstName
				lastName
			}
			section {
				project {
					id
					name
					customer {
						token
						title
						firstName
						lastName
					}
				}
			}
		}
	`);

	if (!item) {
		throw new Error(`Task '${taskId}' has not been found.`);
	}

	if (item.status !== 'PENDING') {
		throw new Error('Cannot send preview email in this task state.');
	}

	if (item.focusedBy) {
		throw new Error(
			'Cannot send preview email for an already focused task, use sendReminderPreviewEmail instead.',
		);
	}

	const user = item.owner;

	let customer = item.linkedCustomer;

	if (item.section) {
		const {project} = item.section;

		customer = customer || project.customer;
	}

	const basicInfos = {
		meta: {userId},
		templateId: templatesId[type],
		email: user.email,

		userEmail: user.email,
		user: formatName(user.firstName, user.lastName),
		itemId: item.id,
		itemName: item.name,
	};

	if (item.section) {
		if (
			item.linkedCustomer
			&& item.linkedCustomer !== item.section.project.customer
		) {
			const {linkedCustomer} = item;

			await sendReminderEmail(
				{
					...basicInfos,
					customerName: String(
						` ${formatFullName(
							linkedCustomer.title,
							linkedCustomer.firstName,
							linkedCustomer.lastName,
						)}`,
					).trimRight(),
					customerEmail: linkedCustomer.email,
					customerPhone: linkedCustomer.phone,
					projectName: item.section.project.name,
					url: getAppUrl(`/${linkedCustomer.token}/tasks/${item.id}`),
				},
				ctx,
			);

			return true;
		}

		if (item.section.project.customer) {
			await sendReminderEmail(
				{
					...basicInfos,
					customerName: String(
						` ${formatFullName(
							customer.title,
							customer.firstName,
							customer.lastName,
						)}`,
					).trimRight(),
					customerEmail: customer.email,
					customerPhone: customer.phone,
					projectName: item.section.project.name,
					url: getAppUrl(
						`/${customer.token}/tasks/${item.id}?projectId=${
							item.section.project.id
						}`,
					),
				},
				ctx,
			);

			return true;
		}

		throw new Error('The task linked to the reminder has no customer.');
	}
	else if (item.linkedCustomer) {
		const {linkedCustomer} = item;

		await sendReminderEmail(
			{
				...basicInfos,
				customerName: String(
					` ${formatFullName(
						linkedCustomer.title,
						linkedCustomer.firstName,
						linkedCustomer.lastName,
					)}`,
				).trimRight(),
				customerEmail: linkedCustomer.email,
				customerPhone: linkedCustomer.phone,
				url: getAppUrl(`/${linkedCustomer.token}/tasks/${item.id}`),
			},
			ctx,
		);

		return true;
	}

	throw new Error(`The task ${taskId} has no customer.`);
};

module.exports = {
	sendReminderPreviewTestEmail,
};