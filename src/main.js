#!/usr/bin/node

import TeamSpeakSQClient from './teamspeak-serverquery-api';

var config = JSON.parse(require('fs').readFileSync('tsModuleBot.dev.config.json'));

//Add module-dir to the module-paths
module.paths.push('src/modules');

(function ts3ModuleBot() {
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
