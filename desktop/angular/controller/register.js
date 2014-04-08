define([
'configs/client', //config
'aoh', //model

// controllers
'general/angular/factory/socket',
'general/angular/factory/session'

], 
function(config, aoh){
    aoh.controller('registerCtrl', ['$scope', '$timeout', 'socket', 'session', function($scope, $timeout, socket, session){
        $scope.register = function(){
            socket.emit('createUser', $scope.name, $scope.email, $scope.password, function(successfull, userDataOrError){
                if(successfull){
                    localStorage.setItem('email', $scope.email);
                    session.update(successfull, userDataOrError);
                }else{
                    $scope.error = userDataOrError;
                }
            });
        }
    }]);
});