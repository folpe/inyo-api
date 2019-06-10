const {verify} = require('jsonwebtoken');
const {
	rule, shield, and, or, not, deny, allow,
} = require('graphql-shield');

const {AuthError} = require('./errors');

const {APP_SECRET, ADMIN_TOKEN} = process.env;

const getUserId = (ctx) => {
	const Authorization = ctx.request.get('Authorization');

	if (Authorization) {
		const token = Authorization.replace('Bearer ', '');
		const verifiedToken = verify(token, APP_SECRET);

		return verifiedToken.userId;
	}

	return null;
};

const isAuthenticated = rule()(async (parent, args, ctx) => {
	const exists = await ctx.db.$exists.user({id: getUserId(ctx)});

	if (exists) return true;

	return new AuthError();
});

const isAdmin = rule()((parent, {token = null}, ctx) => ADMIN_TOKEN === token);

const isCustomer = rule()((parent, {token = null}, ctx) => ctx.db.$exists.customer({token}));

const isItemOwner = and(
	isAuthenticated,
	rule()((parent, {id}, ctx) => ctx.db.$exists.item({id, owner: {id: getUserId(ctx)}})),
);

const isItemCustomer = and(
	isCustomer,
	rule()(async (parent, {id, token = null}, ctx) => ctx.db.$exists.item({
		id,
		OR: [
			{
				section: {
					project: {
						OR: [
							{
								token,
							},
							{
								customer: {token},
							},
						],
					},
				},
			},
			{
				linkedCustomer: {token},
			},
		],
	})),
);

const isProjectOwner = and(
	isAuthenticated,
	rule()((parent, {id}, ctx) => ctx.db.$exists.project({
		id,
		OR: [
			{
				owner: {id: getUserId(ctx)},
			},
			{
				customer: {
					serviceCompany: {
						owner: {id: getUserId(ctx)},
					},
				},
			},
		],
	})),
);

const isProjectCustomer = and(
	isCustomer,
	rule()(async (parent, {id, token = null}, ctx) => ctx.db.$exists.project({
		id,
		customer: {
			token,
		},
	})),
);

const permissions = shield(
	{
		Query: {
			me: isAuthenticated,
			customer: isAuthenticated,
			project: or(isAdmin, or(isProjectOwner, isProjectCustomer)),
			item: or(isAdmin, or(isItemOwner, isItemCustomer)),
		},
	},
	{
		allowExternalErrors: true,
		debug: true,
		fallbackError: 'Non autorisé',
	},
);

module.exports = {
	permissions,
};