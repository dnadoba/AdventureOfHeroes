define([
'configs/client', //config
'vendors/utili/q',
'aoh', //model
'desktop/gameController',
'desktop/patcher/patcher',

// controllers
'general/angular/factory/socket',
'general/angular/factory/session',

], 
function(config, Q, aoh, gameController){
    aoh.controller('game', ['$scope', 'socket', 'session', function($scope, socket, session){
        function init(){
            $scope.user = {};
            $scope.village = {
                loading : false,
                info : false,
                name : false,
                creating : false,
            };
            $scope.patching = true;
            $scope.patcher = {
                assetDlCtrl : false,
            };
            $scope.ingame = false;
        }
        init();
        
        $scope.$on('sessionEstablished', function(scope, userData){
            $scope.village.loading = true;
            $scope.user = userData;
        });
        $scope.$on('sessionDestroyed', function(scope){
            gameController.destroyVillage();
            if($scope.patcher.assetDlCtrl){
                $scope.patcher.assetDlCtrl.stop();
            }
            init();
        });
        
        $scope.changeTheme = function(theme){
            $scope.village.themeClass = theme + '-theme';
            $scope.village.theme = theme;
        };
        //default
        $scope.changeTheme('light');
        
        socket.on('joinVillage', function(villageId, hostInfo){
            gameController.destroyVillage();
            $scope.village.loading = true;
            $scope.village.assetDlCtrl = false;
            $scope.village.loadingImage = false;
            $scope.village.name = false;
            $scope.village.creating = false;
            
            gameController.download(villageId).then(function(data){
                var assetDlCtrl = data.assetDownloadController;
                var villageInfo = data.villageInfo;
                var loadingImage = data.loadingImage;
                $scope.$apply(function(){
                    $scope.village.name = villageInfo.name;
                    if(assetDlCtrl !== false){
                        $scope.patcher.assetDlCtrl = assetDlCtrl;
                    }
                    $scope.changeTheme(villageInfo.theme);
                });
                
                loadingImage.then(function(url){
                    $scope.$apply(function() {
                        $scope.village.loadingImage = url;
                    });
                }).done();
                
                if(assetDlCtrl !== false){
                    assetDlCtrl.start();
                    assetDlCtrl.load.progress(function(){
                        $scope.$apply(function(){
                            
                        });
                    });
                    return assetDlCtrl.load;
                }else{
                    return Q.resolve();
                }
                
                
            }).then(function(){
                $scope.$apply(function(){
                    $scope.patcher.assetDlCtrl = false;
                    $scope.village.creating = 0.0001;
                });
                var gameSocket = gameController.createSocket(hostInfo, villageId, session.hash);
                gameSocket.on("startPackage", function(startPackage){
                    gameController.createVillage(gameSocket, startPackage)
                    .progress(function(progress){
                        $scope.$apply(function() {
                            $scope.village.creating = progress;
                        })
                    })
                    .then(function(village){
                        window.village = village;
                        $scope.$apply(function() {
                            $scope.village.creating = false;
                            $scope.village.loading = false;
                            $scope.ingame = true;
                        })
                    }).done();
                });
                
            }).done();
        });
    }]);
});