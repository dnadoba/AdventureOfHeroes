define(['aoh', 'general/utili/bytesToSize'], function(aoh, bytesToSize) {
    aoh.filter('bytesToSize', function(){
        return function(bytes){
            return bytesToSize(bytes);
        };
    });
}); 