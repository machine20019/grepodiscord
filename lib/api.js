"use strict";

const http = require('http');
const util = require('util');
const logger = require('./logger');

class Api {

  /**
   * Create api request
   * @param  {String} endpoint URL endpoint
   * @return {Object}          Response data
   */
  request (endpoint) {
    return new Promise((resolve, reject) => {
      let url = util.format("http://www.grepinformant.com%s", endpoint),
          data = '';

      http.get(url, response => {
        response.on('data', d => {
          data += d;
        });

        response.on('end', () => {
          if (response.statusCode !== 200) {
            return reject(data);
          }
          return resolve(JSON.parse(data));
        });
      });
    });
  }

  /**
   * Get monitor
   * @param  {Object} opts Monitor options
   * @return {Object}      Response data
   */
  getMonitor (opts) {
    let endpoint = util.format("/api/v1/%s/monitor/%s?time=%s", opts.server, opts.endpoint, 
      opts.monitor.last_check);

    if (opts.monitor.alliances) {
      endpoint += util.format("&alliances=%s", opts.monitor.alliances);
    }

    logger.info("API Request: %s", endpoint);

    return this.request(endpoint);
  }
}

module.exports = new Api();