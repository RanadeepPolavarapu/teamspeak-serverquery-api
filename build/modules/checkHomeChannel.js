'use strict';

var _moduleUtils = require('../util/moduleUtils');

var _moduleUtils2 = _interopRequireDefault(_moduleUtils);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = function (teamspeak, config) {
    if (!config.moduleEnabled) {
        return;
    }

    var homeChannelTimes = {};
    var maxHomeChannelTimes = config.maxSeconds / 2;
    (function checkHomeChannel() {
        teamspeak.send('clientlist', {
            '-away': true,
            '-times': true,
            '-groups': true
        }, function (err, response) {
            if (!response) {
                response = [];
            } else if (!Array.isArray(response)) {
                response = response.data;
            }

            var newHomeChannelTimes = {};
            for (var i in response) {
                var client = response[i];
                if (client.client_type === 0) {

                    var clientServerGroupsArray = client.client_servergroups.toString().split(',').map(function (n) {
                        return Number(n);
                    });

                    if (!_moduleUtils2.default.arrayHasIntersects(clientServerGroupsArray, config.ignoreServerGroupIds) && client.cid === config.homeChannelId) {
                        var homeChannelTime = homeChannelTimes[client.client_database_id] ? homeChannelTimes[client.client_database_id] + 1 : 1;
                        if (homeChannelTime > maxHomeChannelTimes) {
                            teamspeak.send('sendtextmessage', {
                                targetmode: 1,
                                target: client.clid,
                                msg: config.pokeMessage
                            });
                            teamspeak.send('clientmove', {
                                clid: client.clid,
                                cid: config.destinationChannelId
                            });
                        } else {
                            newHomeChannelTimes[client.client_database_id] = homeChannelTime;
                        }
                    }
                }
            }

            homeChannelTimes = newHomeChannelTimes;
            setTimeout(function () {
                checkHomeChannel();
            }, 2000);
        });
    })();
};