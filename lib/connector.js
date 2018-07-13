const http = require('http');
const https = require('https');
const url = require('url');
const tls = require('tls');
const EventEmitter = require('events');

const keepAliveAgents = {
  http: new http.Agent({ keepAlive: true }),
  https: new https.Agent({ keepAlive: true })
};

class Connector extends EventEmitter {
  constructor({
    headers,
    method,
    port = 80,
    protocol,
    hostname,
    path
  }) {
    super();

    this._host = hostname;
    this._clientRequest = this._createRequest({
      headers,
      method,
      port,
      protocol,
      hostname,
      path
    });

    this._setEvents();
  }

  pipeTo(writableStream) {
    this._clientRequest.on('response', (res) => {
      res.pipe(writableStream);
    });
  }

  requestStream() {
    return this._clientRequest;
  }

  _createRequest(reqParams) {
    let handler = http;
    let agent = keepAliveAgents.http;

    if (reqParams.protocol.startsWith('https')) {
      handler = https;
      agent = keepAliveAgents.https;
    }

    return handler.request({
      ...reqParams,
      agent
    });
  }

  _setEvents() {
    this._clientRequest.on('response', (res) => {
      res.on('end', () => this.emit('finish', res));
      res.on('error', (err) => this.emit('error', err));
    });

    // this._clientRequest.on('connect', (res, socket, head) => {
    //   // console.log('BIG HOST', this._host, socket.address());
    //   // socket.write('HTTP/1.1 200 Connection Established\r\n' +
    //   //             'Proxy-agent: ardi-Node.js-Proxy\r\n' +
    //   //             '\r\n');

    //   // const cts = tls.connect({
    //   //   host: this._host,
    //   //   socket: socket
    //   // }, () => {
    //   //   // cts.write('GET / HTTP/1.1\r\n' +
    //   //   //           'Host: www.google.co.uk\r\n' +
    //   //   //           '\r\n');
    //   // });


    //   // //     // cts.write('GET / HTTP/1.1rnHost: twitter.comrnrn');
    //   // // });

    //   // cts.on('data', function (data) {
    //   //     console.log(data.toString());
    //   // });

    //   // cts.on('err', (err) => {
    //   //   console.log('ERROR tls', err);
    //   // });
    // });
  }

  static fromRequest(req) {
    let reqUrl = req.url;

    // Check if protocol is there to avoid wrong parsing
    if (reqUrl.match('^https?') === null) {
      const port = (reqUrl.match(/.+:(\d*)\/?.*/) || [])[1] || 80;
      reqUrl = (port == 443) ? `https://${reqUrl}` : `http://${reqUrl}`;
    }

    const { port = 80, protocol, hostname, path } = {...url.parse(reqUrl)};

    return new Connector({
      headers: req.headers,
      method: req.method,
      port,
      protocol,
      hostname,
      path,
    });
  }
}

module.exports = Connector;
