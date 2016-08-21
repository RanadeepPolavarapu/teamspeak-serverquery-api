#!/usr/bin/env node

import * as HJSON from 'hjson';
import TeamSpeakSQClient from './teamspeak-serverquery-api';
import fs from 'fs';

const config = HJSON.parse(fs.readFileSync('tsModuleBot.config.json', 'utf8'));

(function ts3ModuleBotInit() {
    const teamspeak = new TeamSpeakSQClient(config.host);
    teamspeak.send('login', {
        client_login_name: config.loginName,
        client_login_password: config.loginPassword,
    }, (err, response) => {
        if (err) {
            console.error(`Error: ${err}`);
        }

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
