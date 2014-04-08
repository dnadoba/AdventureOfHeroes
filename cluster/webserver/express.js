if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define(
    ['cluster/config', 'http', 'express', 'path'],
    function(config, http, express, path){

        // init http server and express
        var app = express();

        app.server = http.Server(app);

        app.server.listen(config.get('http-port'));

        //app.use(express.compress());
        
        return app;
})
