import net from 'net';
import events from 'events';
import util from 'util';
import LineInputStream from 'line-input-stream';

const TS3_SQ_SERVER_HOST = process.env.TS3_SQ_SERVER_HOST || 'localhost';
const TS3_SQ_SERVER_PORT = process.env.TS3_SQ_SERVER_PORT || 10011;

const IS_DEVELOPMENT = process.env.NODE_ENV !== 'production';

export default class TeamSpeakSQClient {
    constructor(host, port) {
        events.EventEmitter.call(this);

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

        self.socket = net.connect(self.port, self.host);

        self.socket.on('error', err => {
            self.emit('error', err);
        });

        self.socket.on('close', () => {
            self.emit('close', self.queue);
        });

        self.socket.on('end', () => {
            self.emit('end', self.queue);
        });

        self._onConnect();

        return self;
    }

    _onConnect() {
        var self = this;

        self.socket.on('connect', () => {
            self.reader = LineInputStream(self.socket);

            self.reader.on('line', data => {
                var readerDataStr = data.trim();

                if (self.status < 0) {
                    self.status++;
                    if (self.status === 0) {
                        self.advance_queue();
                    }

                    return;
                }

                self._onData(readerDataStr);
            });

            self.emit('connect');
        });

        return self;
    }
}

util.inherits(TeamSpeakSQClient, events.EventEmitter);
var TS = new TeamSpeakSQClient('localhost', 10011);
