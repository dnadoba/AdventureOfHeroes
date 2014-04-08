if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}
define([
'vendors/utili/q',
'events',
'core/slave/mysqlPool',
'performance-now',
'./GameObjectList',
'./GameObjects/EnvironmentObject',
'./GameObjects/BuildingObject',
'./GameObjects/VillagerObject',
'./GameObjects/MonsterObject',
'./GameObjects/UserObject',
], function(Q, events, mysqlPool, now, GameObjectList, EnvironmentObject, BuildingObject, VillageObject, MonsterObject, UserObject){
    function Village(villageId){
        this.id = villageId;
        this.userId = 0;
        this.name = '';
        
        this.addedLastFrame = [];
        this.removedLastFrame = [];
        
        this.userList = new GameObjectList();
        this.userList.on('added', this.onGameObjectListAdded.bind(this));
        this.userList.on('removed', this.onGameObjectListRemoved.bind(this));
        
        this.villageList = new GameObjectList();
        this.villageList.on('added', this.onGameObjectListAdded.bind(this));
        this.villageList.on('removed', this.onGameObjectListRemoved.bind(this));
        
        this.buildingList = new GameObjectList();
        this.buildingList.on('added', this.onGameObjectListAdded.bind(this));
        this.buildingList.on('removed', this.onGameObjectListRemoved.bind(this));
        
        this.environmentList = new GameObjectList();
        this.environmentList.on('added', this.onGameObjectListAdded.bind(this));
        this.environmentList.on('removed', this.onGameObjectListRemoved.bind(this));
        
        this.monsterList = new GameObjectList();
        this.monsterList.on('added', this.onGameObjectListAdded.bind(this));
        this.monsterList.on('removed', this.onGameObjectListRemoved.bind(this));
        
        this.awaitUsers = {};
        
        this.established = this.loadAllData();

        this.lastVID = 0;
        
        this.lastUpdate = 0;
    }
    
    Village.prototype.onGameObjectListAdded = function(gameObject){
        this.addedLastFrame.push(gameObject);
    };
    
    Village.prototype.onGameObjectListRemoved = function(gameObject){
        this.removedLastFrame.push(gameObject);
    };
    
    Village.prototype.loadAllData = function(){
        return Q.all([
            this.loadVillageData(),
            this.loadGameObjectData('villageEnvironment', EnvironmentObject, this.environmentList),
            this.loadGameObjectData('villageBuilding', BuildingObject, this.buildingList),
            this.loadGameObjectData('villageVillager', VillageObject, this.villageList),
            this.loadMonsterData(),
        ]);
    };
    Village.prototype.loadVillageData = function(){
        return Q.Promise((function(resolve, reject){
            mysqlPool.query('SELECT * FROM village WHERE id = ?', [this.id], (function(error, rows){
                if(error){
                    reject(error);
                    return;
                }
                if(rows.length <= 0){
                    reject(new Error('No village found with id = ' + this.id));
                    return;
                }
                var data = rows[0];
                this.userId = data.userId;
                this.name = data.name;
                resolve();
            }).bind(this));
        }).bind(this));
    };
    Village.prototype.loadGameObjectData = function(tableName, gameObjectClass, objectList){
        return Q.Promise((function(resolve, reject){
            mysqlPool.query('SELECT * FROM ?? WHERE vid = ?', [tableName, this.id], (function(error, rows){
                if(error){
                    reject(error);
                    return;
                }
                for(var i = 0; i < rows.length; i++){
                    var data = rows[i];
                    var envObject = new gameObjectClass(this.getNextVID(), data);
                    objectList.add(envObject);
                }
                resolve();
            }).bind(this));
        }).bind(this));
    };
    Village.prototype.loadMonsterData = function(){
        return Q.Promise((function(resolve, reject){
            //TODO
            resolve();
        }).bind(this));
    };
    
    Village.prototype.waitForUser = function(userId){
        console.log("Wait for user:", userId);
        var promise = Q.Promise((function(resolve, reject){
            mysqlPool.query('SELECT * FROM user WHERE id = ?', [userId], (function(error, rows){
                if(error){
                    console.log("error", error);
                    reject(error);
                    return;
                }
                if(rows.length <= 0){
                    reject(new Error('No user found by id = ' + userId));
                    return;
                }
                var data = rows[0];
                resolve(data);
            }).bind(this));
        }).bind(this));
        this.awaitUsers[userId] = promise;
        return promise;
    };
    
    Village.prototype.addUser = function(userId, socket){
        var promise = this.awaitUsers[userId];
        if(promise === undefined){
            return Q.Promise(function(resolve, reject){ reject('not awaiting user id = ' + userId); });
        }else{
            return promise
            .then((function(userData){
                var userObject = new UserObject(this.getNextVID(), userData, socket);
                this.userList.add(userObject);
                userObject.sendStartPackage(now(), 0, this);
                
                delete this.awaitUsers[userId];
                
                socket.once('disconnect', (function(){
                    
                    this.removeUser(userObject.id);
                    console.log("UserDisconnect");
                }).bind(this))
                
                return userObject;
            }).bind(this));
        }
        
    };
    
    Village.prototype.removeUser = function(userId){
        delete this.awaitUsers[userId];
        
        var user = this.userList.getByID(userId);
        if(user !== false){
            user.disconnect();
            this.userList.remove(user);
        }
    };
    
    
    Village.prototype.saveData = function(mysqPool){
        var lists = [
            this.environmentList,
            this.buildingList,
            this.villageList,
            this.monsterList,
            this.userList,
        ];

        var promiseList = [];
        
        for (var i = 0; i < lists.length; i++) {
            var list = [i];
            var promise = list.saveData(mysqlPool);
            promiseList.push(promise);
        }
        
        return Q.all(promiseList);
    };
    Village.prototype.update = function(time, deltaTime){
        this.forEach(function(gameObject){
            gameObject.update(time, deltaTime, this);
        }, this);
        this.userList.forEach(function(userObject){
            userObject.lateUpdate(time, deltaTime, this);
        }, this);
        
        this.addedLastFrame = [];
        this.removedLastFrame = [];
        
    };
    Village.prototype.close = function(){
        return Q.Promise((function(resolve, reject){
            resolve();
        }).bind(this));
    };
    Village.prototype.getNextVID = function(){
        return ++this.lastVID;
    };
    Village.prototype.forEach = function(callback, context){
        var lists = [
            this.environmentList,
            this.buildingList,
            this.villageList,
            this.monsterList,
            this.userList,
        ];
        for(var i = 0; i < lists.length; i++){
            var list = lists[i];
            list.forEach(callback, context);
        }
    };
    Village.prototype.every = function(callback, context){
        var lists = [
            this.environmentList,
            this.buildingList,
            this.villageList,
            this.monsterList,
            this.userList,
        ];
        for(var i = 0; i < lists.length; i++){
            var list = lists[i];
            if(list.every(callback, context) === false){
                return false;
            }
        }
        return true;
    };
    
    Village.prototype.getByVID = function(VID){
        var lists = [
            this.userList,
            this.monsterList,
            this.villageList,
            this.buildingList,
            this.environmentList,
        ];
        for (var i = 0; i < lists.length; i++) {
            var list = lists[i];
            var gameObject = list.getByVID(VID);
            if(gameObject !== false){
                return gameObject;
            }
        }
        return false;
    };
    return Village;
});