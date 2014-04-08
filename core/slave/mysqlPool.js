if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

/**
 * create a mysql pool from slave config
 * shared instance
 */

define(['core/configSlave', 'general/mysqlPool'], function(config, createMysqlPool){
    var poolConfig = config.get('mysql');
    var pool = createMysqlPool(poolConfig);
    
    return pool;
});