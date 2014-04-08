define(['angular', 'angular.route', 'angular.animate', 'angular.translate', 'angular.ui.bootstrap', 'angular.translate.loader'], function(angular, bootstrap, animate, translate, translateLoader){
    var aoh = angular.module('aoh', ['ngRoute', 'ngAnimate', 'pascalprecht.translate', 'ui.bootstrap']);
    return aoh;
})