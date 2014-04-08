define(['aoh'], function(aoh){
    aoh.controller('handshakeErrorModalCtrl', ['$scope', '$modalInstance', function($scope, $modalInstance){
        $scope.reload = function(){
            $modalInstance.close();
        }
    }])
})