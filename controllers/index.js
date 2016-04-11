'use strict';

const _ = require('underscore');
const http = require('http');
const models = require('../models');

// Index Controller
class Index {

  /**
   * Constructor
   * @return {Object} Route configuration
   */
  constructor() {

    // define routes
    return {
      index: {
        method: 'get',
        name: 'index',
        uri: '/',
        handler: this.index.bind(this)
      }
    };
  }

  /**
   * Index handler
   * @param  {Object} req Express request
   * @param  {Object} res Express response
   */
  index(bot, req, res) {
    let servers = {};

    bot.servers.forEach(server => {
      let channels = {};

      server.channels.forEach(channel => {
        channels[channel.id] = channel.name;
      });

      servers[server.id] = {
        id: server.id,
        name: server.name,
        channels: channels
      };
    });

    return res.status(200).send(servers);
  }
}

module.exports = new Index();
