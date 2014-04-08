

require([
    'configs/client',
    'angular',
    'aoh', 
    'desktop/patcher/patcher',
    'desktop/game/mouse.js',
    //filter
    'general/angular/filter/bytesToSize.js',
    // translation config
    'general/angular/config/translate.js',
    // require controller
    'desktop/angular/controller/intro',
    'desktop/angular/controller/login',
    'desktop/angular/controller/register',
    'desktop/angular/controller/game',
], function(config, angular, app, patcher, mouse){
    // remove the hideBeforBootstrap class
    var container = angular.element(document.querySelectorAll('.hideBeforBootstrap'));
    container.removeClass('hideBeforBootstrap');
    document.getElementById('gameCanvas').onclick = function(){
        mouse.lock();
    };
    
    //Bootstrap angular app
    angular.bootstrap(document, [app['name']]);
    
});