'use strict';

/*
 * Express Dependencies
 */
var express = require('express');
var app = express();
var port = 3000;
var fs = require('fs');
var path = require('path');

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
        partialsDir: 'views/partials/'
    }));

    // Locate the views
    app.set('views', __dirname + '/views');
    
    // Locate the assets
    app.use(express.static(__dirname + '/assets'));
}

// Set Handlebars
app.set('view engine', 'handlebars');


// Database
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(':disk:');

db.serialize(function() {
    db.run("CREATE TABLE IF NOT EXISTS claves(id INTEGER PRIMARY KEY AUTOINCREMENT, codigo INT(4), user VARCHAR(255), h_desde FLOAT, h_hasta FLOAT);");
    db.run("CREATE TABLE IF NOT EXISTS log(id INTEGER PRIMARY KEY AUTOINCREMENT, user VARCHAR(255), accion VARCHAR(255), date_time DATE_TIME default 'datetime(\'now\')');");

    /*
    var stmt = db.prepare("INSERT INTO lorem VALUES (?)");
    for (var i = 0; i < 10; i++) {
        stmt.run("Ipsum " + i);
    }
    stmt.finalize();

    db.each("SELECT rowid AS id, info FROM lorem", function(err, row) {
        console.log(row.id + ": " + row.info);
    });
    */
});

db.close();














var dir = '/home/dscafati/Desktop/node/mock_data/';
function isDoorOpened(){
    var state = true;
    try{
        fs.accessSync(dir + "door_opened.flag", fs.R_OK)
    }catch(e){
        state = false;
    }
    return state;
}


/*
 * Routes
 */
// Index Page
app.get('/', function(request, response, next) {
    var args = {}
    args.tab_index = true;
    args.is_door_opened = isDoorOpened();


    response.render('index', args);
});
// ABM Claves
app.get('/claves', function(request, response, next) {
    var args = {}
    args.tab_claves = true;
    args.is_door_opened = isDoorOpened();

    response.render('claves', args);
});
// Log
app.get('/log', function(request, response, next) {
    var args = {}
    args.tab_log = true;
    args.is_door_opened = isDoorOpened();


    response.render('log', args);
});
// Borrar clave
app.get('/delete', function(request, response, next) {
    var args = {}
    response.redirect('/claves', args);
});
// Vaciar log
app.get('/erase', function(request, response, next) {
    var args = {}

    response.redirect('/log', args);
});


/*
 * Start it up
 */
app.listen(process.env.PORT || port);
console.log('Express started on port ' + port);