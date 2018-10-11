const User = {
  id: node => node.id,
  email: node => node.email,
  firstName: node => node.firstName,
  lastName: node => node.lastName,
  company: (node, args, ctx) => ctx.db.user({ id: node.id }).company(),
}

module.exports = {
  User,
}
