"use strict"

var _ = require('underscore'),
    util = require('util');

module.exports = {
  name: "setrole",
  description: "Add user to role.",
  usage: "!setrole <username> <role>",
  permissions: "manageServer",
  callback: function (msg, command, args) {
    var bot = this.bot,
        username,
        rolename;

    if (!args.length) {
      var msgArray = [];
      msgArray.push(module.exports.description);
      msgArray.push(util.format("Usage: %s", module.exports.usage));
      return bot.sendMessage(msg.channel, msgArray);
    }

    if (!msg.channel.server) {
      return bot.sendMessage(msg.author, "I can't do that in DM");
    }

    if (!msg.channel.permissionsOf(bot.user).hasPermission("manageRoles")) {
      return bot.sendMessage(msg.channel, "I don't have permission to do that on this server.");
    }

    username = args.shift();
    rolename = args.join(' ');

    var user = _.findWhere(msg.channel.server.members, { username: username }),
        role = _.findWhere(msg.channel.server.roles, { name: rolename });

    bot.addMemberToRole(user, role, function () {
      bot.sendMessage(msg.channel, util.format("Added %s to role %s", user.username, rolename));
    });
  }
};