require(['angular', 'angular.animate', 'angular.translate', 'angular.ui.bootstrap', 'angular.translate', 'angular.translate.loader'], function(angular, ngAnimate){
    var app = angular.module('aoh', ['ngAnimate', 'ui.bootstrap']);
    
    angular.bootstrap(document, [app.name]);
})