if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}
/**
 * SessionManager - creates and manage all session on this cluster process
 */

define([
'general/user/user', 
'vendors/utili/moment', 
'crypto', 
'cluster/utili/logger', 
'events', 
'util', 
'cluster/masterClient',
], function(User, moment, crypto, logger, events, util, master){
    
    
    var SessionManager = new (events.EventEmitter)();
    SessionManager.setMaxListeners(100);
    
    function Session(userData, socket, mysqlPool){
        events.EventEmitter.call(this);
        
        this.mysqlPool = mysqlPool;
        this.socket = socket;
        this.socket.session = this;
        this.user = new User(userData);
        master.userJoinVillage(this.user.id, this.user.villageId)
        .then((function(hostInfo){
            socket.emit('joinVillage', this.user.villageId, hostInfo);
        }).bind(this)).done();
        
        // session data
        this.hash = userData.hash || this.createHash(userData);
        
        // get new information aboute the client
        
        var headers = socket.handshake.headers;
        this.lastUseDate = moment();

        this.lastIp = socket.handshake.address.address;
        this.lastUserAgent = headers['user-agent'];
        
        
        
        this.replaceSession();
        this.updateLastLogin();
    }
    
    util.inherits(Session, events.EventEmitter);
    
    /**
     * creates a secure session hash
     * @param {Object} userData - queryed user data from the database
     * @returns {string} hash
     */
    Session.prototype.createHash = function(userData){
        // TODO !!! - create real hashing algorythm
        return userData.id + Math.random();
    };
    /**
     * REPLACE the current session in the databese
     * @param {mysqlPool} mysqlPool
     */
    Session.prototype.replaceSession = function(){
        this.mysqlPool.query('REPLACE INTO loginSession\n' +
                        '(uid, hash, lastIp, lastUserAgent, lastUseDate) VALUES\n' +
                        '(?, ?, ?, ?, ?)',
                        [this.user.id, this.hash, this.lastIp, this.lastUserAgent, this.lastUseDate.toDate()],
                        function(error){
                            if(error){
                                logger.error(error, error);
                            }
                        });
    };
    
    /**
     * update the useres 'lastLogin' field in the database
     */
    Session.prototype.updateLastLogin = function(){
        this.user.lastLoginDate = moment();
        this.mysqlPool.query('UPDATE user SET lastLoginDate = CURRENT_TIMESTAMP WHERE id = ?', [this.user.id], function(error){
            if(error){
                logger.error(error, error);
            }
        });
    };
    
    /**
     * @returns {Object} clientData - returns an object with importent data for the first client bootstrap
     */
    
    Session.prototype.clientData = function(){
        return {
            hash : this.hash,
            name : this.user.name,
        };
    };
    
    
    /**
     * @fires #SessionManager#disconnect
     */
    Session.prototype.disconnect = function(){
        this.emit('disconnect');
    };
    /**
     * delete the session in the database and disconnect the session
     */
    Session.prototype.destroy = function(){
        this.socket.emit('sessionDestroy');
        this.mysqlPool.query(
            'DELETE loginSession WHERE uid = ? and hash = ?', 
            [this.user.id, this.hash],
            function(error){
                if(error){
                    logger.error(error, error);
                }
            });
        this.disconnect();
    };
    
    Session.prototype.loadVillage = function(villageId){
        this.socket.emit('loadVillage', villageId);
    }
    
    /**
     * creates a new session
     * @param {Object} userData - Object with the queryed user data from the database
     * @param {Socket} socket - socket.io socket with the current connection
     * @param {mysqlPool} mysqlPool - a mysqlPool database connection
     * @fires SessionManager#connection
     */
    SessionManager.create = function(userData, socket, mysqlPool){
        var session = new Session(userData, socket, mysqlPool);
        //SessionManager.emit('connect', session);
        return session;
    };
    
    return SessionManager;
});