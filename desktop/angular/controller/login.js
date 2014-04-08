define([
'configs/client', //config
'aoh', //model

// controllers
'general/angular/factory/socket',
'general/angular/factory/session'

], 
function(config, aoh, socket){
    aoh.controller('loginCtrl', ['$scope', '$timeout', 'socket', 'session', function($scope, $timeout, socket, session){
        $scope.rememberEmail = JSON.parse(localStorage.getItem('rememberEmail'));
        // not set
        if($scope.rememberEmail === null){
            $scope.rememberEmail = true;
        }
        
        if($scope.rememberEmail){
            $scope.email = localStorage.getItem('email');
            // email saved then focus password input
            if($scope.email !== null){
                // TODO: create directive or something else for this
                document.querySelector('#userPassword').focus();
            }
        }
        // save useres desition
        $scope.rememberEmailChange = function(){
            localStorage.setItem('rememberEmail', $scope.rememberEmail);
            // delete saved email
            if(!$scope.rememberEmail){
                localStorage.removeItem('email');
            }else{
                localStorage.setItem('email', $scope.email);
            }
        };
        
        // login by auth
        $scope.login = function(){
            $scope.error = '';
            session.loginByAuth($scope.email, $scope.password)
            .then(function(){
                $scope.$apply(function(){
                    if($scope.rememberEmail){
                        localStorage.setItem('email', $scope.email);
                    }else{
                        $scope.email = '';
                    }
                    $scope.password = '';
                });
            })
            .catch(function(){
                $scope.$apply(function(){
                    $scope.error = 'LOGIN_WRONG';
                    $scope.password = '';
                });
            });
        };
    }]);
});