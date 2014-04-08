if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

/**
 * create a mysql pool from cluster config
 * shared instance
 */

define(['cluster/config', 'general/mysqlPool'], function(config, createMysqlPool){
    var poolConfig = config.get('mysql');
    var pool = createMysqlPool(poolConfig);
    
    return pool;
})