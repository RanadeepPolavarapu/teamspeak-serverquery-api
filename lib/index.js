'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _net = require('net');

var _net2 = _interopRequireDefault(_net);

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

var _lineInputStream = require('line-input-stream');

var _lineInputStream2 = _interopRequireDefault(_lineInputStream);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var TS3_SQ_SERVER_HOST = process.env.TS3_SQ_SERVER_HOST || 'localhost';
var TS3_SQ_SERVER_PORT = process.env.TS3_SQ_SERVER_PORT || 10011;

var IS_DEVELOPMENT = process.env.NODE_ENV !== 'production';

var TeamSpeakSQClient = function () {
    function TeamSpeakSQClient(host, port) {
        _classCallCheck(this, TeamSpeakSQClient);

        _events2.default.EventEmitter.call(this);

        var self = this;
        self.host = host || TS3_SQ_SERVER_HOST;
        self.port = port || TS3_SQ_SERVER_PORT;
        self.status = -2;
        self.reader = null;
        self.queue = [];
        self.executing = null;

        self.init_cmds();

        self.connect();

        return self;
    }

    _createClass(TeamSpeakSQClient, [{
        key: 'connect',
        value: function connect() {
            var self = this;

            self.socket = _net2.default.connect(self.port, self.host);

            self.socket.on('error', function (err) {
                self.emit('error', err);
            });

            self.socket.on('close', function () {
                self.emit('close', self.queue);
            });

            self.socket.on('end', function () {
                self.emit('end', self.queue);
            });

            self._on_connect();

            return self;
        }
    }, {
        key: '_on_connect',
        value: function _on_connect() {
            var self = this;

            self.socket.on('connect', function () {
                self.reader = (0, _lineInputStream2.default)(self.socket);

                self.reader.on('line', function (data) {
                    var data_str = data.trim();

                    if (self.status < 0) {
                        self.status++;
                        if (self.status === 0) {
                            self.advance_queue();
                        }

                        return;
                    }

                    self._on_data(data_str);
                });

                self.emit('connect');
            });

            return self;
        }
    }]);

    return TeamSpeakSQClient;
}();

exports.default = TeamSpeakSQClient;


_util2.default.inherits(TeamSpeakSQClient, _events2.default.EventEmitter);
var TS = new TeamSpeakSQClient('localhost', 10011);