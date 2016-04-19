'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _net = require('net');

var _net2 = _interopRequireDefault(_net);

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

var _lineInputStream = require('line-input-stream');

var _lineInputStream2 = _interopRequireDefault(_lineInputStream);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const TS3_SQ_SERVER_HOST = process.env.TS3_SQ_SERVER_HOST || 'localhost';
const TS3_SQ_SERVER_PORT = process.env.TS3_SQ_SERVER_PORT || 10011;
const IS_DEVELOPMENT = process.env.NODE_ENV !== 'production';

class TeamSpeakSQClient {
    constructor(host, port) {
        _events2.default.EventEmitter.call(this);

        const self = this;
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

    connect() {
        var self = this;

        self.socket = _net2.default.connect(self.port, self.host);

        self.socket.on('error', err => {
            self.emit('error', err);
        });

        self.socket.on('close', () => {
            self.emit('close', self.queue);
        });

        self.socket.on('end', () => {
            self.emit('end', self.queue);
        });

        self._on_connect();

        return self;
    }

    _on_connect() {
        var self = this;

        self.socket.on('connect', () => {
            self.reader = (0, _lineInputStream2.default)(self.socket);

            self.reader.on('line', data => {
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
}

exports.default = TeamSpeakSQClient;
_util2.default.inherits(TeamSpeakSQClient, _events2.default.EventEmitter);
var TS = new TeamSpeakSQClient('localhost', 10011);