var exports = module.exports = {}

var sqlite = require('sqlite-sync');
var dir = '/home/dscafati/Desktop/node/data/';

sqlite.connect(dir + 'data.db');

sqlite.run("CREATE TABLE IF NOT EXISTS claves(id INTEGER PRIMARY KEY AUTOINCREMENT, codigo INT(4) UNIQUE, user VARCHAR(255), h_desde FLOAT, h_hasta FLOAT);");
sqlite.run("CREATE TABLE IF NOT EXISTS log(id INTEGER PRIMARY KEY AUTOINCREMENT, user VARCHAR(255), accion VARCHAR(255), date_time DATE_TIME default CURRENT_TIMESTAMP);");


exports.getDir = function(){
    return dir;
}
exports.getDb = function(){
    return sqlite;
}


return module.exports;