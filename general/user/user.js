if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define(['vendors/utili/q', 'vendors/utili/moment'], function(Q, moment, master){
    function User(userData){
        this.id = userData.id;
        this.email = userData.email;
        this.name = userData.name;

        this.createDate = moment(userData.createDate);

        this.lastLoginDate = moment(userData.lastLoginDate);
        
        this.villageId = userData.vid;
    }
    
    return User;
});