#!/usr/bin/env node
'use strict';

var _teamspeakServerqueryApi = require('./teamspeak-serverquery-api');

var _teamspeakServerqueryApi2 = _interopRequireDefault(_teamspeakServerqueryApi);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var config = JSON.parse(require('fs').readFileSync('tsModuleBot.config.json'));

//Add module-dir to the module-paths
module.paths.push('src/modules');

(function ts3ModuleBotInit() {
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

                // Execute all modules.
                for (module in config.modules) {
                    require(module)(teamspeak, config.modules[module]);
                }
            });
        });
    });

    teamspeak.on('error', () => {});

    // Purge in-memory data upon remote server failure or disconnect.
    teamspeak.on('close', () => {
        // Attempt auto reconnect at 3 second intervals.
        setTimeout(() => {
            ts3ModuleBotInit();
        }, 3000);
    });
})();