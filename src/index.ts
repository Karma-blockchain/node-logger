import { transports as wTransport, createLogger } from "winston";
import { format } from "logform";
import { hostname } from "os";
import { config } from "dotenv";

const { combine, timestamp, printf } = format;

config();

const {
  LOGSTASH_APP_NAME,
  LOGSTASH_MSG_TYPE,
  LOG_LEVEL,
  STDOUT_LOG_FORMAT,
  FILE_LOG,
  FILE_LOG_PATH,
} = process.env;

const Logger = (label) => {
  let appName =
    LOGSTASH_APP_NAME ||
    process
      .cwd()
      .split("/")
      .slice(-1)
      .pop();
  let logstashFormat = (data) =>
    JSON.stringify({
      "@timestamp": data.timestamp,
      "@version": "1",
      message: data.message,
      host: hostname(),
      path: process.cwd(),
      tags: [],
      type: LOGSTASH_MSG_TYPE || "nodejs-logger",

      // Extra Fields
      level: data.level,
      logger_name: label,
      app: appName,
    });

  let simpleFormat = (data) =>
    `${data.timestamp} [${data.level}] ${label} ${data.message}`;

  let transports: any[] = [
    new wTransport.Console({
      level: LOG_LEVEL || "info",
      format: combine(
        timestamp(),
        printf(STDOUT_LOG_FORMAT !== "simple" ? logstashFormat : simpleFormat)
      ),
    }),
  ];

  if (FILE_LOG && FILE_LOG.toLowerCase() == "true")
    transports.push(
      new wTransport.File({
        level: LOG_LEVEL || "info",
        filename: FILE_LOG_PATH || "debug.log",
        maxsize: 10000000,
        format: combine(timestamp(), printf(simpleFormat)),
        //json: false,
      })
    );

  return createLogger({
    level: LOG_LEVEL || "info",
    //levels: {notify: 0, error: 1, warn: 2, info: 3},
    transports,
  });
};

export const logger = Logger("");
export default Logger;
