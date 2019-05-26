const {
    createLogger,
    format,
    transports
} = require("winston");
const {
    combine,
    timestamp,
    label,
    printf,
    prettyPrint,
    splat,
    simple,
    json,
    colorize
} = format;

const winstonTimestampColorize = require("winston-timestamp-colorize");

const myFormat = printf(({
    level,
    message,
    timestamp
}) => {
    return `[${level} | ${timestamp}] ${message}`;
});

const sqlFormat = printf(({
    message
}) => {
    return message;
});

const ENV = process.env.NODE_ENV;

const LEVEL = Symbol.for("level");

function filterOnly(level) {
    return format(function (info) {
        if (info[LEVEL] === level) {
            return info;
        }
    })();
}

const enumerateErrorFormat = format(info => {
    if (info.message instanceof Error) {
        info.message = Object.assign({
            message: info.message.message,
            stack: info.message.stack
        }, info.message);
    }

    if (info instanceof Error) {
        return Object.assign({
            message: info.message,
            stack: info.stack
        }, info);
    }

    return info;
});

const jsonLogger = createLogger({
    format: combine(
        splat(),
        timestamp(),
        enumerateErrorFormat(),
        json(),
        // prettyPrintDebug()
    ),
    transports: [
        new transports.File({
            level: "error",
            filename: "logs/error.log"
        }),
        new transports.File({
            filename: "logs/combined.log"
        }),
        new transports.File({ level: "verbose", filename: "logs/verbose.log", format: filterOnly("verbose") }),
    ],
    exceptionHandlers: [
        new transports.File({
            filename: "logs/exceptions.log"
        })
    ]
});

const prettyLogger = createLogger({
    format: combine(
        colorize(),
        splat(),
        timestamp(),
        winstonTimestampColorize(),
        // simple(),
        myFormat,
        // prettyPrint()
    ),
    transports: [new transports.Console()]
});

const sqlLogger = createLogger({
    format: combine(
        simple(),
        sqlFormat
    ),
    transports: [
        new transports.File({
            level: "verbose",
            filename: "logs/sql.log",
            format: filterOnly("verbose")
        }),
    ]
});

jsonLogger.add(sqlLogger);

if (ENV !== "production")
    jsonLogger.add(prettyLogger);

// const logger = winston.createLogger({
//     transports: [
//         new winston.transports.Console(),
//         new winston.transports.File({ filename: 'combined.log' })
//     ]
// });

module.exports = jsonLogger;