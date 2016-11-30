sub run {
	return `./sqlite3 ../data/data.db "@_"`;
}

run("CREATE TABLE IF NOT EXISTS claves(id INTEGER PRIMARY KEY AUTOINCREMENT, codigo INT(4) UNIQUE, user VARCHAR(255), h_desde FLOAT, h_hasta FLOAT);");

run("CREATE TABLE IF NOT EXISTS log(id INTEGER PRIMARY KEY AUTOINCREMENT, user VARCHAR(255), accion VARCHAR(255), date_time DATE_TIME default CURRENT_TIMESTAMP);");

my $accion = '';
my $user = '';

if(@ARGV[0] eq "a"){
    $accion='Abrió la puerta';
	$user = run("select user from claves where codigo = @ARGV[1];");
}
if(@ARGV[0] eq "u"){
    $accion='Desbloqueó la puerta';
	$user = run("select user from claves where codigo = @ARGV[1];");
}
if(@ARGV[0] eq "c"){
    $accion='Puerta cerrada';
}
if(@ARGV[0] eq "i"){
    $accion='Codigo inválido introducido';
}

run("INSERT INTO log (user, accion) VALUES ('$user', '$accion');");
