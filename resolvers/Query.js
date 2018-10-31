const { sendMetric } = require('../stats');
const { getUserId } = require('../utils')

const Query = {
  me: (root, args, ctx) => ctx.db.user({ id: getUserId(ctx) }),
  customer: (root, { id }, ctx) => ctx.db.user({ id: getUserId(ctx) }).company().customer({ id }),
  quote: async (root, { id, token }, ctx) => {
    // public access with a secret token inserted in a mail
    if (token) {
      const [quote] = await ctx.db.quotes({ where: { id, token } });

      if (!quote) {
        return null;
      }

      sendMetric({metric: 'inyo.quote.viewed.total'});

      if (quote.viewedByCustomer) {
        await ctx.db.updateQuote({
          where: { id },
          data: { viewedByCustomer: true },
        });

        quote.viewedByCustomer = true;

        sendMetric({metric: 'inyo.quote.viewed.unique'});
      }

      return quote;
    }

    const [quote] = await ctx.db.quotes({
      where: {
        id,
        customer: {
          serviceCompany: {
            owner: { id: getUserId(ctx) },
          },
        },
      },
    });

    return quote;
  },
  itemComments: async (root, { itemId, token }, ctx) => {
    if (token) {
      const comments = await ctx.db.comments({
        where: {
          item: {
            id: itemId,
            section: {
              option: {
                quote: { token },
              },
            },
          },
        },
	  });

	  const customer = await ctx.db.quote({ token }).customer();

      await ctx.db.updateManyComments({
        where: { id_in: comments.map(comment => comment.id) },
        data: {
			viewedByCustomer: true,
			views: {
				create: {
					customer: { connect: { id: customer.id } }
				},
			},
		},
      });

      return comments.map(comment => ({...comment, viewedByCustomer: true}));
	}

	const userId = getUserId(ctx);

    const comments = await ctx.db.comments({
      where: {
        item: {
          id: itemId,
          section: {
            option: {
              quote: {
                customer: {
                  serviceCompany: {
                    owner: { id: userId },
                  },
                },
              },
            },
          },
        },
      },
    });

    await ctx.db.updateManyComments({
		where: { id_in: comments.map(comment => comment.id) },
		data: {
			viewedByUser: true,
			views: {
				create: {
					user: { connect: { id: userId } }
				},
			},
		},
    });

    return comments.map(comment => ({
      ...comment,
      viewedByUser: true,
    }));
  },
}

module.exports = {
  Query,
}
