"use strict";

const http = require('http');
const util = require('util');

class Api {

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

  get (opts) {
    let endpoint = util.format("/api/v1/%s/monitor/%s?time=%s&alliances=%s", opts.server, opts.endpoint, 
      opts.monitor.last_check, opts.monitor.alliances);
    console.log(endpoint);
    return this.request(endpoint);
  }
}

module.exports = new Api();