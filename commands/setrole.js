"use strict";

const _ = require('underscore');
const util = require('util');

module.exports = {
  name: "setrole",
  description: "Add user to role.",
  usage: "!setrole <username> <role>",
  permissions: "manageServer",
  callback: function (msg, command, args) {
    let username,
        rolename;

    if (!args.length) {
      let msgArray = [];
      msgArray.push("```\n");
      msgArray.push(module.exports.description);
      msgArray.push(util.format("Usage: %s", module.exports.usage));
      msgArray.push("```");
      return this.bot.sendMessage(msg.channel, msgArray);
    }

    if (!msg.channel.server) {
      return this.bot.sendMessage(msg.author, "I can't do that in DM");
    }

    if (!msg.channel.permissionsOf(this.bot.user).hasPermission("manageRoles")) {
      return this.bot.sendMessage(msg.channel, "I don't have permission to do that on this server.");
    }

    username = args.shift();
    rolename = args.join(' ');

    let user = _.findWhere(msg.channel.server.members, { username: username }),
        role = _.findWhere(msg.channel.server.roles, { name: rolename });

    this.bot.addMemberToRole(user, role, () => {
      this.bot.sendMessage(msg.channel, util.format("Added %s to role %s", user.username, rolename));
    });
  }
};