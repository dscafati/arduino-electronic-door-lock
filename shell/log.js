#!/usr/bin/env node
var cli = require('cli');
var storage = require('../storage');
var db = storage.getDb();

cli.parse({
    type:   ['t', 'type of action to log'],
    code:   ['c', 'code associated']
});

cli.main(function (args, options) {
    var output = '';
    var accion = '';
    var user = '';
    if (this.argc) {
        // Parse the action
        switch(args[0]) {
            case 'a':
                accion = 'Abrió la puerta';
                break;
            case 'c':
                accion = 'Puerta cerrada';
                break;
            case 'i':
                accion = 'Codigo inválido introducido';
                break;
        }

        // Get the user name                            <td>{{this.codigo}}</td>

        if(args[0] == 'a') {
            var rows = db.run("SELECT user FROM claves WHERE codigo = ?", [args[1]]);
            user = rows[0].user;
        }
        // Async
        db.run("INSERT INTO log (user, accion) VALUES (?, ?)",[user, accion], function(){});
    }
});