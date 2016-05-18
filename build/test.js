'use strict';

var _teamspeakServerqueryApi = require('./teamspeak-serverquery-api');

var _teamspeakServerqueryApi2 = _interopRequireDefault(_teamspeakServerqueryApi);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var config = JSON.parse(_fs2.default.readFileSync('tsModuleBot.config.json'));

var teamspeak = new _teamspeakServerqueryApi2.default(config.host);

function parseCommands(s) {
    var formattedCmd = s.slice(1).split(' ')[0];
    var formattedParams = {};

    // Split the first occurrence of whitespace to fetch params substring.
    var paramsRawString = s.substr(s.indexOf(' ') + 1);

    // Split via regex (group1 and group2 around the equal sign).
    var re = /(\w+)=(.+?)(?= \w+=|$)/gm;
    var m = void 0;
    var resultParamsArray = [];
    while ((m = re.exec(paramsRawString)) !== null) {
        if (m.index === re.lastIndex) re.lastIndex++;
        resultParamsArray.push(m[1]);
        resultParamsArray.push(m[2]);
    }

    console.log(resultParamsArray);

    resultParamsArray.map(function (currentValue, index, thisArray) {
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

    return [formattedCmd, formattedParams];
}

teamspeak.on('notify', function (eventName, response) {
    console.log(eventName, response.data);

    if (eventName === 'textmessage') {
        var userMessage = response.data.msg;

        console.log(userMessage);
    }
});

teamspeak.send('login', {
    client_login_name: config.loginName,
    client_login_password: config.loginPassword
}, function (err, response) {
    teamspeak.send('use', {
        sid: config.serverId
    }, function (err, response) {
        teamspeak.send('clientupdate', {
            client_nickname: config.clientName
        }, function (err, response) {

            teamspeak.send('clientlist', function (err, response) {
                console.log(response.data);
            });

            teamspeak.send('servernotifyregister', {
                event: 'textprivate'
            });

            teamspeak.send('servernotifyregister', {
                event: 'server'
            });

            teamspeak.send('servernotifyregister', {
                event: 'textserver'
            });
        });
    });
});