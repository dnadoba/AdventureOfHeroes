if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

/**
 * simple create a new mysql pool from config
 */

define(['mysql'], function(mysql){
    return function createMysqlPool(config){
        var pool = mysql.createPool(config);
        return pool;
    };
});