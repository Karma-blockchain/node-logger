const
  winston = require("winston"),
  logform = require("logform"),
  os = require('os'),
  { combine, timestamp, printf } = logform.format;

require("dotenv").config();

module.exports = label => {
  let appName = process.env.LOGSTASH_APP_NAME || process.cwd().split("/").slice(-1).pop()
  let logstashFormat = data => JSON.stringify({
    '@timestamp': data.timestamp,
    '@version': '1',
    'message': data.message,
    'host': os.hostname(),
    'path': process.cwd(),
    'tags': [],
    'type': process.env.LOGSTASH_MSG_TYPE || 'nodejs-logger',

    // Extra Fields
    'level': data.level,
    'logger_name': label,
    'app': appName
  })

  let simpleFormat = data => 
    `${data.timestamp} [${data.level}] ${appName} ${data.message}`

  let transports = [
    new winston.transports.Console({
      level: process.env.LOG_LEVEL || 'info',
      format: combine(
        timestamp(),
        printf(
          process.env.STDOUT_LOG_FORMAT !== "simple"  
            ? logstashFormat : simpleFormat)
      )
    })
  ]

  if (process.env.FILE_LOG && process.env.FILE_LOG.toLowerCase() == 'true')
    transports.push(
      new winston.transports.File({
        level: process.env.LOG_LEVEL || 'info',
        filename: process.env.FILE_LOG_PATH || 'debug.log',
        maxsize: 10000000,
        format: combine(
          timestamp(),
          printf(simpleFormat)
        ),
        json: false
      })
    )

  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    //levels: {notify: 0, error: 1, warn: 2, info: 3},
    transports
  });
}
