import TeamSpeakSQClient from './teamspeak-serverquery-api';

var config = JSON.parse(require('fs').readFileSync('tsModuleBot.dev.config.json'));

var teamspeak = new TeamSpeakSQClient(config.host);

teamspeak.on('notify', (eventName, response) => {
    console.log(eventName, response.data);
});

teamspeak.send('login', {
    client_login_name: config.loginName,
    client_login_password: config.loginPassword,
}, (err, response) => {
    teamspeak.send('use', {
        sid: config.serverId,
    }, (err, response) => {
        teamspeak.send('clientupdate', {
            client_nickname: config.clientNamer,
        }, (err, response) => {

            teamspeak.send('clientlist', (err, response) => {
                console.log(response.data);
            });

            teamspeak.send('servernotifyregister', {
                event: 'textprivate',
            });

            teamspeak.send('servernotifyregister', {
                event: 'server',
            });
        });
    });
});
