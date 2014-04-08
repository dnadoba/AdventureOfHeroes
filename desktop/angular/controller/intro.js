define([
'configs/client', 
'aoh', 
'vendors/utili/q',
'general/socket', 
'desktop/patcher/patcher',
// modal template
'text!templates/desktop/modal/clientVersionError.html',
'text!templates/desktop/modal/requestQuota.html',
// modal controller
'desktop/angular/controller/handshakeError',
], 
function(config, aoh, Q, socket, patcher, modalClientVersionErrorTemplate, modalRequestQuotaTemplate){
    aoh.controller('introCtrl', ['$scope', '$timeout', '$modal', function($scope, $timeout, $modal){
        $scope.loading = !config.debug;
        // set loading text to connecting
        window.loadingText.setText('connecting');
        socket.once("connect", function(){
            $scope.loading = false;
            
            window.loadingText.clearInterval();
            window.loadingText.clearDots();
            window.loadingText.setText('connected');
            
        });
        socket.socket.on('error', function(reason){
            // client version is wrong
            if(reason == 'handshake unauthorized'){
                // show modal with information and then reload the page
                $modal.open({
                    template : modalClientVersionErrorTemplate,
                    controller : 'handshakeErrorModalCtrl'
                })
                .result
                .finally(function(){
                    location.reload();
                });
            }
        });
        function getEnoughQuota(callback){
            //check if we have enough quota for the filesystem
            patcher.hasEnoughQuota()
            .then(callback)
            .catch(function(){
                var modalInstance = $modal.open({
                    template : modalRequestQuotaTemplate,
                    backdrop : 'static',
                });
                function requestQuota(){
                    patcher.requestQuota()
                    .then(function(){
                        modalInstance.close();
                        callback();
                    })
                    .catch(function(){
                        setTimeout(function() {
                            requestQuota();
                        }, 400);
                    });
                }
                requestQuota();
            }).done();
        }
        
        getEnoughQuota(function(){
            
        })
        
        //establish the connection
        socket.socket.connect();
    }]);
});