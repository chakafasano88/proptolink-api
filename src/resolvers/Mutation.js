const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { promisify } = require('util');
const { randomBytes } = require('crypto');
const { getUserId } = require('../utils')
const { transport, createEmail } = require('../mail');
const sgMail = require('@sendgrid/mail');


const Mutations = {

  async signup(parent, args, ctx, info) {

    if (args.confirmPassword !== args.password) {
      throw new Error('Your passwords do not match');
    }

    const emailExists = await ctx.db.query.user({ where: { email: args.email } })

    if (emailExists) {
      throw new Error('A user with that email already exists!');
    }

    delete args.confirmPassword;
    args.status = 1;

    const password = await bcrypt.hash(args.password, 10);

    const user = await ctx.db.mutation.createUser({ data: { ...args, password, permissions: { set: ['USER'] } } });

    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET)

    ctx.response.cookie('token', token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year cookie
    });

    return { token, user }

  },

  async login(parent, args, ctx, info) {

    const user = await ctx.db.query.user({ where: { email: args.email } })

    if (!user) {
      throw new Error('No user found for the supplied email address');
    }

    if(!user.status) {
      throw new Error('This user has not been authenticated. Please check your email for an invite.');
    }

    const valid = await bcrypt.compare(args.password, user.password)
    if (!valid) {
      throw new Error('Invalid password')

    }    

    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET)

    ctx.response.cookie('token', token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year cookie
    });

    return {
      token,
      user,
    }
  },
}

module.exports = Mutations;