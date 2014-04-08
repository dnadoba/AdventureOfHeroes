/**
 * Created by Jango on 06.03.14.
 */

define(['mobile/aoh'], function(aoh){
    aoh.controller('sessionCtrl', function($scope, $ionicModal){
        angular.element(document.querySelector('#hidden')).css('display', 'block');

        $scope.showLogin = true;

        $ionicModal.fromTemplateUrl('loginModal.html', function(loginModal){
            $scope.loginModal = loginModal;
        }, {
            scope : $scope,
            animation : 'slide-in-up'
        })
        $scope.showLoginModal = function(){
            $scope.loginModal.show();
        }

        $scope.closeLoginModal = function(){
            $scope.loginModal.close();
        }

        $scope.$on('$detroy', function(){
            $scope.loginModal.remove();
        })
    });
});