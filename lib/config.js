const defaults = {
  PORT: 9300,
  HOST: '0.0.0.0',
  LOG_LEVEL: 'debug'
};

const PORT = process.env.PORT || defaults.PORT;
const HOST = process.env.HOST || defaults.HOST;
const LOG_LEVEL = process.env.LOG_LEVEL || defaults.LOG_LEVEL;

module.exports = {
  PORT,
  HOST,
  LOG_LEVEL
};
