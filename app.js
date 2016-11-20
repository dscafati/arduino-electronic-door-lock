'use strict';

/*
 * Express Dependencies
 */
var express = require('express');
var app = express();
var port = 3000;
var fs = require('fs');
var path = require('path');
var storage = require('./storage');
var db = storage.getDb();
var bodyParser     =        require("body-parser");
var exec = require('child_process').exec;
var execSync = require('child_process').execSync;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
/*
 * Use Handlebars for templating
 */
var exphbs = require('express3-handlebars');
var hbs;

// For gzip compression
app.use(express.compress());

/*
 * Config for Production and Development
 */
if (process.env.NODE_ENV === 'production') {
    // Set the default layout and locate layouts and partials
    app.engine('handlebars', exphbs({
        defaultLayout: 'main',
        layoutsDir: 'dist/views/layouts/',
        partialsDir: 'dist/views/partials/'
    }));

    // Locate the views
    app.set('views', __dirname + '/dist/views');
    
    // Locate the assets
    app.use(express.static(__dirname + '/dist/assets'));

} else {
    app.engine('handlebars', exphbs({
        // Default Layout and locate layouts and partials
        defaultLayout: 'main',
        layoutsDir: 'views/layouts/',
        partialsDir: 'views/partials/',
        helpers: {
            times: function(n, block) {
                var accum = '';
                for(var i = 0; i < n; ++i)
                    accum += block.fn(i);
                return accum;
            },
            inc: function(n){
                return parseInt(n)+1;
            },
            ifEq : function(v1,v2, options){
                if(v1 === v2) {
                    return options.fn(this);
                }
                return options.inverse(this);
            },
            formatTime: function(value){
                var h = Math.floor(value);
                var m = (value - h);
                m = Math.round(m * 60);
                if (m < 10 ){
                    m = "0" + m;
                }else{
                    m = m.toString();
                }
                return h + ":" + m + " hs";
            }
        }
    }));

    // Locate the views
    app.set('views', __dirname + '/views');
    
    // Locate the assets
    app.use(express.static(__dirname + '/assets'));
}

// Set Handlebars
app.set('view engine', 'handlebars');



function unformatTime(str){
    var numbers = str.split(":");
    var h = parseInt(numbers[0]);
    var m = parseInt(numbers[1]) / 60;

    return (h + m).toFixed(2);

}
function isDoorOpened(){

    var cmd = "redis-cli get door_flag";
    var state = true;
    var redis = execSync(cmd).toString();
    state = !!redis;
    return state;
}

// On start: Load existing keys on memory
var cmd = "redis-cli flushall";
exec(cmd);

db.runAsync("SELECT * FROM claves", function(rows){

    rows.forEach(function(row){
        var cmd = "redis-cli set " + row.codigo + " valid";
        exec(cmd, function(error, stdout, stderr) {});
    })
});



/*
 * Routes
 */
// Index Page
app.get('/', function(request, response, next) {
    var args = {}
    args.tab_index = true;
    args.is_door_opened = isDoorOpened();
    args.claves = db.run("SELECT * FROM claves ORDER BY id DESC LIMIT 3");
    args.logs = db.run("SELECT * FROM log ORDER BY id DESC LIMIT 3");

    response.render('index', args);
});
// Claves
app.all('/claves', function(request, response, next) {
    var args = {}
    var page = (request.query.page) ? parseInt(request.query.page)-1 : 0;
    var eachPage = 15;
    args.tab_claves = true;
    args.is_door_opened = isDoorOpened();
    args.formErrors = [];
    args.formSuccess = '';

    if (request.method == 'POST'){
        var user = request.body.user;
        var code = parseInt(request.body.code);
        var h_desde = request.body.h_desde;
        var h_hasta = request.body.h_hasta;

        var re = /([01]?[0-9]|2[0-3]):[0-5][0-9]/;

        if (!user){
            args.formErrors.push('Nombre de usuario obligatorio');
        }
        if (!code || code < 0 || code > 9999){
            args.formErrors.push('Código inválido. Solo 4 digitos de 0000 a 9999');
        }
        if( !h_desde.match(re) ){
            args.formErrors.push('Valor de "Hora desde" inválido');
        }
        if( !h_hasta.match(re) ){
            args.formErrors.push('Valor de "Hora hasta" inválido');
        }

        if( unformatTime(h_hasta) <= unformatTime(h_desde) ){
            args.formErros.push('El valor de "Hora hasta" debe ser menor que el valor de "Hora desde"');
        }

        if(args.formErrors.length==0){
            var a2 = db.insert('claves',{user:user, codigo:code, h_desde: unformatTime(h_desde), h_hasta:unformatTime(h_hasta)}, function(response){
                if(response.error){
                    args.formErrors.push("Se ha producido un error, el código ya estaba en uso?");
                }else{
                    args.formSuccess = "Código agregado con éxito";
                }
            });
        }

    }

    args.claves = db.run("SELECT * FROM claves ORDER BY id DESC LIMIT ?, ?", [page*eachPage, eachPage]);
    var total = db.run("SELECT COUNT(*) AS total FROM claves")[0].total;

    args.currentPage = page;
    args.totalPages = Math.ceil(total/eachPage);
    args.showPagination = args.totalPages > 0;

    response.render('claves', args);
});
// Log
app.get('/log', function(request, response, next) {
    var args = {}
    var page = (request.query.page) ? parseInt(request.query.page)-1 : 0;
    var eachPage = 15;
    args.tab_log = true;
    args.is_door_opened = isDoorOpened();

    args.logs = db.run("SELECT * FROM log ORDER BY id DESC LIMIT ?, ?", [page*eachPage, eachPage]);
    var total = db.run("SELECT COUNT(*) AS total FROM log")[0].total;

    args.currentPage = page;
    args.totalPages = Math.ceil(total/eachPage);
    args.showPagination = args.totalPages > 1;

    response.render('log', args);
});
// Borrar clave
app.get('/delete', function(request, response, next) {
    var args = {}
    db.run("DELETE FROM claves WHERE id = '?'", [request.query.id]);
    response.redirect('/claves');
});
// Vaciar log
app.get('/erase', function(request, response, next) {
    var args = {}

    //db.run('DELETE FROM log');
    //db.close();
    response.redirect('/log');
});


/*
 * Start it up
 */
app.listen(process.env.PORT || port);
console.log('Express started on port ' + port);
