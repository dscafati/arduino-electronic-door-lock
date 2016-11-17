#!/usr/bin/env node
var cli = require('cli');
var storage = require('../storage');
var db = storage.getDb();

cli.parse();

cli.main(function (args, options) {
    var output = 'invalid';
    var output_stream = process.stdout;
    if (this.argc) {
        var current = new Date();
        var hours = current.getHours();
        var minutes = current.getMinutes();
        current = hours + minutes/60;

        // Codes are unique even for the same person at different time range
        var rows = db.run("SELECT user, h_desde, h_hasta FROM claves WHERE codigo=?", [args[0]]);
        if(rows.length > 0){
            if( current > rows[0].h_desde && current < rows[0].h_hasta){
                output = "success";
                // Async
                db.insert("log", {user:rows[0].user, accion:"Desbloqueó la puerta"}, function(){});
            }
        }
    }
    output_stream.write(output);
});