#!/usr/bin/env node
'use strict';

var _teamspeakServerqueryApi = require('./teamspeak-serverquery-api');

var _teamspeakServerqueryApi2 = _interopRequireDefault(_teamspeakServerqueryApi);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var config = JSON.parse(_fs2.default.readFileSync('tsModuleBot.config.json'));

(function ts3ModuleBotInit() {
    var teamspeak = new _teamspeakServerqueryApi2.default(config.host);
    teamspeak.send('login', {
        client_login_name: config.loginName,
        client_login_password: config.loginPassword
    }, function (err, response) {
        if (err) {
            console.error('Error: ' + err);
        }

        teamspeak.send('use', {
            sid: config.serverId
        }, function (err, response) {
            teamspeak.send('clientupdate', {
                client_nickname: config.clientName
            }, function (err, response) {
                teamspeak.send('servernotifyregister', {
                    event: 'textprivate'
                });

                // Execute all modules.
                for (module in config.modules) {
                    require('./modules/' + module)(teamspeak, config.modules[module]);
                }
            });
        });
    });

    teamspeak.on('error', function () {});

    // Purge in-memory data upon remote server failure or disconnect.
    teamspeak.on('close', function () {
        // Attempt auto reconnect at 3 second intervals.
        setTimeout(function () {
            ts3ModuleBotInit();
        }, 3000);
    });
})();