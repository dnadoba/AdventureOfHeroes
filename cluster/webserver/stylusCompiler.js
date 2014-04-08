/**
 * Created by Jango on 07.03.14.
 */

if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define(
    ['cluster/config', 'path', './express', 'stylus', 'nib'],
    function(config, path, app, stylus, nib){

        //get root dir
        var rootDir = path.dirname(require.nodeRequire.main.filename);

        function compile(str, path) {
            return stylus(str)
                .set('filename', path)
                .set('compress', !config.get('debug'))
                .use(nib())
                .import('nib');

        }

        app.use(stylus.middleware({
            src: path.join(rootDir, config.get('stylus.src')),
            dest: path.join(rootDir, config.get('stylus.dest')),
            compile: compile
        }));
    }
);