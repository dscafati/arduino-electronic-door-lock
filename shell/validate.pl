#Current time
my ($sec,$min,$hour,$mday,$mon,$year,$wday,$yday,$isdst) = localtime(time);

#Stored time
my $stdout = `redis-cli get @ARGV[0]`;

if($stdout!=null){

	my ($h_desde,$h_hasta) = split(/:/,$stdout,2);

	my $current_dec = ($hour + $min/60);

	if( $h_desde <= $current_dec && $h_hasta >= $current_dec){
		print "Valid";
	}else{
		print "Invalid";
	}
}else{
	print "Invalid";
}
