#!/usr/bin/node

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import TeamSpeakSQClient from './teamspeak-serverquery-api';

var config = JSON.parse(require('fs').readFileSync('tsModuleBot.dev.config.json'));

//Add module-dir to the module-paths
module.paths.push('src/modules');

(function ts3ModuleBot() {
    var teamspeak = new TeamSpeakSQClient(config.host);
    teamspeak.send('login', {
        client_login_name: config.loginName,
        client_login_password: config.loginPassword,
    }, function (err, response) {
        teamspeak.send('use', {
            sid: config.serverId,
        }, function (err, response) {
            teamspeak.send('clientupdate', {
                client_nickname: config.clientName,
            }, function (err, response) {
                teamspeak.send('servernotifyregister', { event: 'textprivate' });

                //Execute modules
                for (module in config.modules) {
                    require(module)(teamspeak, config.modules[module]);
                }
            });
        });
    });

    teamspeak.on('error', function () {});

    //so send them to the blackhole
    teamspeak.on('close', function () {
        //Try to reconnect/restart after 3 seconds
        setTimeout(function () {
            ts3ModuleBot();
        }, 3000);
    });
})();
