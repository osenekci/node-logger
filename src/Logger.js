const fs = require('fs');
const moment = require('moment');
const chalk = require('chalk');

/**
 * Logger
 */
class Logger {
  /**
   * Log level has a priority logic.
   * debug > info > warn > error
   *
   * @param {{
   *  level:?string,
   *  mode:?string,
   *  file:?string
   * }} [config]
   */
  constructor(config) {
    config = Object.assign({
      level: 'DEBUG',
      mode: 'CONSOLE',
      file: null,
    }, config);
    this._modes = {
      ALL: 1,
      CONSOLE: 2,
      FILE: 3,
    };
    this._logLevels = {
      DEBUG: 4,
      INFO: 3,
      WARN: 2,
      ERROR: 1,
    };
    this._queue = [];
    this._fileLocked = false;
    this._level = this._logLevels[config.level.toUpperCase()];
    this._mode = this._modes[config.mode.toUpperCase()];
    this._file = config.file || null;
  }

  /**
   * @param {*} message
   * @return {boolean}
   */
  error(message) {
    return this._log(this._logLevels.ERROR, message);
  }

  /**
   * @param {*} message
   * @return {boolean}
   */
  warn(message) {
    return this._log(this._logLevels.WARN, message);
  }

  /**
   * @param {*} message
   * @return {boolean}
   */
  debug(message) {
    return this._log(this._logLevels.DEBUG, message);
  }

  /**
   * @param {*} message
   * @return {boolean}
   */
  info(message) {
    return this._log(this._logLevels.INFO, message);
  }

  /**
   * @param {number} level
   * @return {string}
   * @private
   */
  _getLogLevelName(level) {
    let name = null;
    Object.keys(this._logLevels).forEach((key) => {
      if (this._logLevels[key] === level) {
        name = key;
      }
    });
    return name;
  }

  /**
   * @param {number} type
   * @param {*} message
   * @return {boolean}
   */
  _log(type, message) {
    // Ignore log if lower than the log level
    if (this._level < type) {
      return false;
    }
    if (typeof message !== 'string') {
      if (Array.isArray(message) || typeof message === 'object') {
        message = JSON.stringify(message);
      } else {
        message = message + '';
      }
    }
    const levelName = this._getLogLevelName(type);
    const logDate = moment().locale('en').format('YYYY-MM-DD HH:mm:ss Z');

    const processId = process.pid;
    const formattedMessage = '[' + levelName + '][' +
      processId + '][' + logDate + ']: ' + message;
    if (this._mode === this._modes.ALL || this._mode === this._modes.CONSOLE) {
      this._writeConsole(type, formattedMessage);
    }
    if (this._mode === this._modes.ALL || this._mode === this._modes.FILE && this._file) {
      this._writeFile(formattedMessage);
    }
    return true;
  }

  /**
   * @param {string} message
   * @private
   */
  _writeFile(message) {
    this._queue.push(message);
    this._releaseFileAppendQueue();
  }

  /**
   * @private
   */
  _releaseFileAppendQueue() {
    if (this._fileLocked) {
      return;
    }
    this._fileLocked = true;
    const tmpQueue = this._queue;
    this._queue = [];
    fs.appendFile(this._file, tmpQueue.join('\n') + '\n', () => {
      this._fileLocked = false;
      if (this._queue.length > 0) {
        this._releaseFileAppendQueue();
      }
    });
  }

  /**
   * @param {number} type
   * @param {string} message
   * @private
   */
  _writeConsole(type, message) {
    switch (type) {
      case this._logLevels.ERROR:
        console.log(chalk.red(message));
        break;
      case this._logLevels.WARN:
        console.log(chalk.yellow(message));
        break;
      default:
        console.log(message);
        break;
    }
  }
}

module.exports = Logger;
