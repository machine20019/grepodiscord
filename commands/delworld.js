"use strict";

const util = require('util');
const models = require('../models');

module.exports = {
  name: "delworld",
  description: "Deletes a world from supported worlds.",
  usage: "!delworld <world id>",
  example: "!delworld us46",
  permissions: "admin",
  callback: function (msg, command, args) {
    let bot = this.bot,
        config = this.config,
        chatLog = this.chatLog;

    if (!args.length || args[0].length !== 4) {
      let msgArray = [];
      msgArray.push("```\n");
      msgArray.push(module.exports.description);
      msgArray.push(util.format("Usage: %s", module.exports.usage));
      msgArray.push(util.format("Example: %s", module.exports.example));
      msgArray.push("```");
      return bot.sendMessage(msg.channel, msgArray);
    }

    models.Servers
      .destroy({
        where: { server: args[0] }
      })
      .then(() => {
        models.Servers.findAll({}).then(serverList => {
          // update server list
          config.serverList = serverList;
          
          bot.sendMessage(msg.channel, util.format("Deleted world %s", args[0]));
          chatLog("Info", util.format("World added: %s", args[0]));
        });
      });
  }
};