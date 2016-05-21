'use strict';

var _moduleUtils = require('../util/moduleUtils');

var _moduleUtils2 = _interopRequireDefault(_moduleUtils);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = function (teamspeak, config) {
    if (!config.moduleEnabled) {
        return;
    }

    (function advertiser() {
        teamspeak.send('sendtextmessage', {
            targetmode: config.targetMode,
            target: config.targetId,
            msg: config.message
        }, function (err, response) {
            setTimeout(function () {
                advertiser();
            }, config.messageIntervalInSeconds * 1000);
        });
    })();
};