#!/usr/bin/node
'use strict';

var _teamspeakServerqueryApi = require('./teamspeak-serverquery-api');

var _teamspeakServerqueryApi2 = _interopRequireDefault(_teamspeakServerqueryApi);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var config = JSON.parse(require('fs').readFileSync('tsModuleBot.dev.config.json'));

//Add module-dir to the module-paths


/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
module.paths.push('src/modules');

(function ts3ModuleBot() {
    var teamspeak = new _teamspeakServerqueryApi2.default(config.host);
    teamspeak.send('login', {
        client_login_name: config.loginName,
        client_login_password: config.loginPassword
    }, (err, response) => {
        teamspeak.send('use', {
            sid: config.serverId
        }, (err, response) => {
            teamspeak.send('clientupdate', {
                client_nickname: config.clientName
            }, (err, response) => {
                teamspeak.send('servernotifyregister', {
                    event: 'textprivate'
                });

                //Execute modules
                for (module in config.modules) {
                    require(module)(teamspeak, config.modules[module]);
                }
            });
        });
    });

    teamspeak.on('error', () => {});

    //so send them to the blackhole
    teamspeak.on('close', () => {
        //Try to reconnect/restart after 3 seconds
        setTimeout(() => {
            ts3ModuleBot();
        }, 3000);
    });
})();