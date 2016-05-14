#!/usr/bin/env node

import TeamSpeakSQClient from './teamspeak-serverquery-api';

var config = JSON.parse(require('fs').readFileSync('tsModuleBot.config.json'));

(function ts3ModuleBotInit() {
    var teamspeak = new TeamSpeakSQClient(config.host);
    teamspeak.send('login', {
        client_login_name: config.loginName,
        client_login_password: config.loginPassword,
    }, (err, response) => {
        teamspeak.send('use', {
            sid: config.serverId,
        }, (err, response) => {
            teamspeak.send('clientupdate', {
                client_nickname: config.clientName,
            }, (err, response) => {
                teamspeak.send('servernotifyregister', {
                    event: 'textprivate',
                });

                // Execute all modules.
                for (module in config.modules) {
                    require('./modules/' + module)(teamspeak, config.modules[module]);
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
