// jscs:disable requireCapitalizedComments
/**
 * Created by kras on 06.07.16.
 */
'use strict';

const express = require('express');
const di = require('core/di');
const config = require('./config');
const moduleName = require('./module-name');
const pre = require('./prehandle');
const extendDi = require('core/extendModuleDi');
const alias = require('core/scope-alias');
const Service = require('./lib/interfaces/Service');

var app = module.exports = express();

app._init = function () {
  /**
   * @type {{settings: SettingsRepository, auth: Auth, sessionHandler: SessionHandler, tokenAuth: TokenAuth}}
   */
  let rootScope = di.context('app');

  rootScope.auth.exclude('\\/' + moduleName + '\\/\\w.*');
  rootScope.sessionHandler.exclude(moduleName + '/**');

  return di(
    moduleName,
    extendDi(moduleName, config.di),
    {module: app},
    'app',
    [],
    `modules/${moduleName}`
  )
    .then(scope => alias(scope, scope.settings.get(moduleName + '.di-alias')))
    .then((scope) => {
      app.use(`/${moduleName}/:service`, pre);
      for (let nm in scope) {
        if (scope.hasOwnProperty(nm) && scope[nm] instanceof Service) {
          const router = express.Router();
          scope[nm].route(router);
          app.use(`/${moduleName}/${nm}`, router);
        }
      }
    });
};
