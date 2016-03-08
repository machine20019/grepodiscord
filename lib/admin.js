'use strict'

var _ = require('underscore'),
    util = require('util'),
    models = require('../models');

exports.handle = function (bot, msg, config, serverId) {
  var channel = msg.channel,
      server = config.adminServers.list[serverId],
      serverChannel = _.findWhere(channel.server.channels, { name: 'server' }),
      defaultChannel = _.findWhere(channel.server.channels, { id: server.default_channel }),
      passwordReq = server.password.length ? true : false,
      role = _.findWhere(msg.channel.server.roles, { name: server.default_role });

  if (msg.author == bot.user) {
    return;
  }

  if (channel.id === server.info_channel) {
    if (passwordReq && msg.content === server.password) {
      // password valid, promote member
      bot.addMemberToRole(msg.author, role, function () {
        // log this action
        bot.sendMessage(serverChannel, util.format("User promoted with password: %s", msg.author.username), 
          function () {
            // announce user joining
            if (server.show_joins) {
              bot.sendMessage(defaultChannel, util.format("%s has joined the room.", msg.author.username));
            }
            // delete message from room
            bot.deleteMessage(msg);
          });
      });
    } else {
      // delete all messages in this room
      bot.deleteMessage(msg);
    }
  }
};