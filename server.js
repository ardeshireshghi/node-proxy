const http = require('http');
const url = require('url');
const tls = require('tls');
const net = require('net');
const pino = require('pino');

const Connector = require('./lib/connector');
const config = require('./lib/config');

const { PORT, HOST, LOG_LEVEL } = config;

const logger = pino({
  name: 'ardi-proxy-server',
  level: LOG_LEVEL
});

const logResponse = (req, response) => {
  logger.info(`Finished dealing with the request: ${req.method} ${req.url}`);
  logger.info(`Reponse Status: ${response.statusCode}`);
  logger.info('Reponse Headers', response.headers);
};

const logError = (error) => {
  logger.error(`Error: Something went wrong with the request: ${error.message}`);
};

const handleRequest = (req, res) => {
  const reqConnector = Connector.fromRequest(req);
  const connectorReq = reqConnector.request();

  const partialLogResponse = logResponse.bind(null, req);
  reqConnector.on('finish', partialLogResponse);
  reqConnector.on('error', logError);
  reqConnector.pipeTo(res);

  req.pipe(connectorReq);
};

const proxyServer = http.createServer(handleRequest);

proxyServer.on('connect', (req, cltSocket, head) => {
  // Connect to an origin server
  const srvUrl = url.parse(`http://${req.url}`);
  const srvSocket = net.connect(srvUrl.port, srvUrl.hostname, () => {
    cltSocket.write('HTTP/1.1 200 Connection Established\r\n' +
                    'Proxy-agent: ardi-Node.js-Proxy\r\n' +
                    '\r\n');

    srvSocket.once('end', () => {
      logResponse(req, {
        statusCode: 200,
        headers: {}
      });
    });

    srvSocket.write(head);
    srvSocket.pipe(cltSocket);
    cltSocket.pipe(srvSocket);
  });
});

proxyServer.listen(PORT, HOST, () => logger.info(`Listening to port ${PORT} on ${HOST}`));
