"use strict";

const http = require('http');
const express = require('express');
const Router = require('named-routes');
const exphbs  = require('express-handlebars');
const config = require('../lib/config');
const logger = require('../lib/logger');
const utils = require('../lib/utils');

class Server  {
  
  constructor(config) {
    this.config = config;
  }
  
  static get name() {
    return 'HTTP Server';
  }

  start(bot) {
    let app = this.app = express(),
        router = new Router();
    
    this.bot = bot;

    router.extendExpress(app);
    router.registerAppHelpers(app);

    /**
     * Start Web Server setup
     */
    app.set('port', this.config.port);
    app.set('views', this.config.views);

    app.engine('hbs', exphbs({
      extname: '.hbs',
      defaultLayout: 'main',
      partialsDir: 'views/partials/'
    }));

    app.set('view engine', 'hbs');
    app.use(express.static(this.config.public));

    app.use((req, res, next) => {
      res.setHeader('X-Powered-By', this.config.poweredBy);
      next();
    });

    // set template data
    app.locals = {
      site: {
        title: "Grepolis Informant"
      }
    };

    // load controllers
    utils.readdirRecursive(this.config.controllerPath, files => {
      files.forEach(file => {
        return this.createRoutes(require(file));
      });
    });

    app.get('/', (req, res) => {
      res.status(200).send('This is the Grepolis Discord Bot. Nothing to show here.');
    });

    // create server
    http.createServer(app).listen(app.get('port'), () => {
      logger.info('Express server listening on port %d', app.get('port'));
    });
  }

  // create routes
  createRoutes(routes) {
    for (let o in routes) {
      let route = routes[o];
      this.app[route.method](route.uri, route.name, route.handler.bind(route, this.bot));
    }
  }
}

module.exports = Server;
