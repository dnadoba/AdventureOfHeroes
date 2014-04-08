//from stackoverflow: http://stackoverflow.com/a/18650828/3008259

define(function(){
    return function bytesToSize(bytes) {
        var k = 1000;
        var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        if (bytes === 0) return '0 Bytes';
        var i = parseInt(Math.floor(Math.log(bytes) / Math.log(k)),10);
        return (bytes / Math.pow(k, i)).toPrecision(3) + ' ' + sizes[i];
    };
})