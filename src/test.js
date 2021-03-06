import TeamSpeakSQClient from './teamspeak-serverquery-api';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('tsModuleBot.config.json'));

const teamspeak = new TeamSpeakSQClient(config.host);

function parseCommands(s) {
    const formattedCmd = s.slice(1).split(' ')[0];
    const formattedParams = {};

    // Split the first occurrence of whitespace to fetch params substring.
    let paramsRawString = s.substr(s.indexOf(' ') + 1);

    // Split via regex (group1 and group2 around the equal sign).
    const re = /(\w+)=(.+?)(?= \w+=|$)/gm;
    let m;
    const resultParamsArray = [];
    while ((m = re.exec(paramsRawString)) !== null) {
        if (m.index === re.lastIndex)
            re.lastIndex++;
        resultParamsArray.push(m[1]);
        resultParamsArray.push(m[2]);
    }

    console.log(resultParamsArray);

    resultParamsArray.map((currentValue, index, thisArray) => {
        formattedParams[currentValue] = thisArray[index + 1];
    });

    console.log(formattedParams);

    // for (let cmdOrParam of resultParamsArray) {
    //     if (cmdOrParam.indexOf('=') !== -1) {
    //         let tempParamArr = cmdOrParam.split('=');
    //         formattedParams[tempParamArr[0]] = tempParamArr[1];
    //     } else {
    //         formattedCmd = cmdOrParam;
    //     }
    // }

    return [ formattedCmd, formattedParams ];
}

teamspeak.on('notify', (eventName, response) => {
    console.log(eventName, response.data);

    if (eventName === 'textmessage') {
        let userMessage = response.data.msg;

        console.log(userMessage);
    }
});

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

            teamspeak.send('clientlist', (err, response) => {
                console.log(response.data);
            });

            teamspeak.send('servernotifyregister', {
                event: 'textprivate',
            });

            teamspeak.send('servernotifyregister', {
                event: 'server',
            });

            teamspeak.send('servernotifyregister', {
                event: 'textserver',
            });
        });
    });
});
