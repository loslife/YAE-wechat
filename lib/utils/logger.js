module.exports.getLogger = getLogger;

function getLogger(){
    return wrap;
}

var log4js = require('log4js');

log4js.configure({
    appenders: [
        {
            type: 'file',
            filename: 'logs/access.log',
            maxLogSize: 2 * 1024 * 1024,
            backups: 3,
            category: 'access'
        },
        {
            type: "file",
            filename: "logs/bootstrap.log",
            maxLogSize: 2 * 1024 * 1024,
            backups: 3,
            category: 'bootstrap'
        }
    ]
});

var logger = log4js.getLogger('access');
logger.setLevel('DEBUG');

var logger2 = log4js.getLogger("bootstrap");
logger2.setLevel("INFO");

var InnerLogger = function(){
}

InnerLogger.prototype.error = function(){
    logger.error.call(logger, arguments);
}

InnerLogger.prototype.info = function(){
    logger.info.call(logger, arguments);
}

InnerLogger.prototype.debug = function(){
    logger.debug.call(logger, arguments);
}

InnerLogger.prototype.warn = function(){
    logger.warn.call(logger, arguments);
}

InnerLogger.prototype.isLevelEnabled = function(){
    logger.isLevelEnabled.call(logger, arguments);
}

InnerLogger.prototype.bootstrap = function(){
    logger2.info.call(logger2, arguments);
}

var wrap = new InnerLogger();