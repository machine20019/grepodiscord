"use strict";

const util = require('util');

module.exports = {
  name: "join",
  description: "Tell the bot to join a server.",
  usage: "!join <invite link>",
  callback: function (msg, command, args) {
    let bot = this.bot,
        chatLog = this.chatLog;
    
    if (!args.length) {
      let msgArray = [];
      msgArray.push(module.exports.description);
      msgArray.push(util.format("Usage: %s", module.exports.usage));
      return bot.sendMessage(msg.channel, msgArray);
    }
    
    bot.joinServer(args[0], (err, server) => {
      if (err || !server) {
        chatLog("Error", util.format("Failed to join server: %s", err));
        return bot.sendMessage(msg.channel, "Unable to join server, try again.");
      }

      let msgArray = [],
          recipient;

      if (server.owner.id !== msg.author.id) {
        msgArray.push(util.format("I'm **%s**, %s invited me to this server.", bot.user.username, msg.author));
        msgArray.push("If I'm not supposed to be here, you can type !leave and I will leave the server.");
        recipient = server.owner;
      } else {
        msgArray.push(util.format("I've joined the server, **%s**.", server.name));
        recipient = msg.author;
      }

      msgArray.push("Commands will only work in the **bot** channel. If you have not already created this channel, please do now.");
      msgArray.push("Please make sure that I have sufficient permissions to read and post messages in the bot channel.");
      msgArray.push("For a list of commands type **!help**.");
      
      bot.sendMessage(recipient, msgArray);
      chatLog("Info", util.format("Joined server: **%s** Requested by: **%s**", server.name, msg.author));

    });

  }
};