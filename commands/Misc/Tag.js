"use strict";

const Command = require('../../lib/Command');

class Tag extends Command {
  
  constructor(config) {
    super(config);
    
    this.aliases = ["tag"];
    this.group = "Misc";
    this.description = "Tag content to be recalled later";
    this.usage = "tag <tagname> [content]";
    this.disableDM = true;
  }
  
  execute(msg, args) {
    super.execute.apply(this, arguments);
    if (!this.validate(args, 1)) return;
    
    let db = msg.client.db;
    if (!db.tags) return;
    
    if (args.length > 1) {
      
      // handle delete arg
      if (args[0] === 'delete') {
        args.shift();
        db.tags.remove({ tag: args.join(' ') }, (err) => {
          if (err) return this.log("Error", err);
          return this.sendMessage(':ok_hand:');
        });
        return;
      }
      
      // create tag
      let tag = args.shift();
      
      db.tags.update({ tag: tag }, { tag: tag, content: args.join(' ') }, { upsert: true });
      return this.sendMessage(':ok_hand:');
    }
    
    // get tag from db
    db.tags.findOne({ tag: args.join(' ') }, (err, doc) => {
      if (err) return this.log("Error", err);
      return this.sendMessage(doc.content);
    });
  }
}

module.exports = Tag;