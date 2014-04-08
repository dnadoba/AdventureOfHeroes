/* globals: self */

importScripts("/vendors/scripts/requirejs.min.js");

var queue = [];

require(['vendors/msgpack'], function(msgpack){
    self.postMessage = self.webkitPostMessage || self.postMessage;
    self.onmessage =  function(event){
        switch(event.data.type){
            case 'unpack':
                var obj = msgpack.decode(event.data.data);
                postMessage(obj);
                break;
            case 'pack':
                var arrayBuffer = msgpack.encode(event.data.data);
                postMessage(arrayBuffer, [arrayBuffer]);
                break;
            case 'unpackAndStringify':
                var obj = msgpack.decode(event.data.data);
                postMessage(JSON.stringify(obj));
                break;
            default:
                throw new Error("Unknown MsgpackWorker operation type '" + event.data.type + "'");
        }
    };
    for (var i = 0; i < queue.length; i++) {
        var event = queue[i];
        self.onmessage(event);
    }
    delete queue;
});
self.onmessage = function(event){
    queue.push(event);
}
