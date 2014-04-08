define(['angular', 'angular.translate', 'angular.translate.loader', 'aoh'], function(angular, translate, translateLoader, aoh){
    aoh.config(['$translateProvider', function($translateProvider){
        $translateProvider.useStaticFilesLoader({
            prefix: 'languages/',
            suffix : '.json',
        });
        $translateProvider.preferredLanguage('de');
    }]);
})