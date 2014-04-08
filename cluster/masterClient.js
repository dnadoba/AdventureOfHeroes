if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define([
'core/configMaster',
'general/promise.io/client',
'vendors/utili/q'
], 
function(config, PromiseClient, Q){
    function MasterClusterClient(port, host, authKey){
        
        this.client = new PromiseClient(port, host, authKey);
        
    }
    
    /**
     * @param {Number} villageId
     * @returns {Promise} promise
     *          @returns {Array} userList - a list with the id's from the user
     */
    
    MasterClusterClient.prototype.getVillageUserList = function(villageId){
        return this.client.get('villageUserList', villageId);
    };
    
    /**
     * joins or creates a village on a slaves the user joins this village
     * @param {Number} userId
     * @param {Number} villageId
     * @returns {Promise} promise - resolve with the address and port to the slave, rejected otherwise
     */
    MasterClusterClient.prototype.userJoinVillage = function(userId, villageId){
        return this.client.get('userJoinVillage', {
            userId : userId,
            villageId : villageId,
        });
    };
    
    return new MasterClusterClient(
        config.get('masterServer.portForCluster'), 
        config.get('masterServer.address'), 
        config.get('masterServer.authKey')
    );
});