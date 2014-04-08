if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define(['cluster/config', 'cluster/socket.io', 'cluster/mysqlPool', 'general/user/session', 'vendors/utili/q', 'vendors/utili/moment', 'cluster/utili/logger'], 
function(config, io, mysqlPool, Session, Q, moment, logger){
    /**
     * create a new user
     * @params {string} name
     * @params {string} email
     * @params {string} password
     * @returns {Promise} promise
     */
    function createUser(name, email, password){
        return Q.Promise(function(resolve, reject){
            mysqlPool.query(
                'INSERT INTO user\n'+
                '(email, password, name, createDate, lastLoginDate) VALUES\n' + 
                '(?, PASSWORD(?), ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
                [email, password, name], 
                function(error, result){
                    if(error){
                        reject(error);
                    }else{
                        resolve({
                            id : result.insertId,
                            name : name,
                            email : email,
                            createDate : moment(),
                            lastLoginDate : moment(),
                        });
                    }
                });
        });
    }
    
    io.on('connection', function(socket){
        socket.on('createUser', function(name, email, password, callback){
            // allready logged in?
            if(socket.session === undefined){
                createUser(name, email, password)
                .then(function(userData){
                    var session = Session.create(userData, socket, mysqlPool);
                    callback(true, session.clientData());
                }).catch(function(error){
                    logger.error(error, error);
                    callback(false, 'REGISTRATION_ERROR');
                });
            }else{
                // Client is already logged in
                callback(true, socket.session.clientData());
            }
        });
    });
});