if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define(['winston'], function(winston){
    var logger = new (winston.Logger)({
        transports: [
            new (winston.transports.Console)(),
        ],
    });
    return logger;
});