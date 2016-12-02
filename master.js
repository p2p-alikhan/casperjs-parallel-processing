// Benchmarking script execution time
var start = Date.now();
process.on("exit", function() {
var end = Date.now();
console.log("Time taken: %ds", (end - start)/1000);
});

// initializing dependencies
var bbPromise = require('bluebird');
var _ = require('lodash');
var fs = require('fs');
var util = require("util");
var debug = require('debug')('main:application');
var spawn = require('child_process').spawn;
var program = require('commander');

	// Show help & validate required parameters if are empty
	program
		.version('1.0.0')
		.option('-t, --term <required>', 'Search term')
		.option('-c, --concurrency <required>', 'Number of parellel processes to run',parseInt)
		.option('-p, --pages <required>', 'Number of google pages to search',parseInt)
		.parse(process.argv);

	if(!program.term || !program.concurrency || !program.pages){
		debug('Please provide required aurguments');
		program.help();
		return false;
	} 

	var results = [];

	// Launching multiple child processes & aggregating their results in array, wrapped in promise pattern
	function launchProcess(arg) {
        
		return new bbPromise(function(resolve, reject) {

			var process = spawn('casperjs', ['./worker.js', arg]);
			process.stdout.on('data', function(data) {
				results.push(JSON.parse(data.toString()));
				//console.log(util.inspect(data, {showHidden: false, depth: null}));
			});

			process.stderr.on('data', function(err) {
				reject(err.toString());
			});

			process.on('exit', function() {
				resolve();
			});
		});
	}

    /*
	Generating multiple urls based on term parameter, also wrapped in promise pattern
	Here we are utilizing google's exact match pattern for accurate searching
	*/	
	function generateUrls() {

		debug('Function generateUrls() executed');
		
		return new bbPromise(function(resolve, reject) {		

			//var url = encodeURI("https://www.google.com/search?q=\"php functions\"");
			var url = encodeURI('https://www.google.com/search?q="'+program.term+'"');
			var urls_list = [];	
			var start = 0;
			_.times(program.pages, function(){
				urls_list.push(url+"&start="+start); 
				start += 10;
			});
			
			resolve(urls_list);
		})
	}

    // Calling our main handler now
	generateUrls().then(function(urls_list) {
		
		//debug('Urls list generated! %j', urls_list);
		debug('Urls list generated!');
		console.log('\t'+urls_list.join('\r\n\t'));
		
		// what to parallel and how much
		bbPromise.map(urls_list, launchProcess, { concurrency: parseInt(program.concurrency) }).then(function() {
		
			debug('All child processes completed!');
			var output = _.flattenDeep(results);
			debug('Final output!');	
			console.log('\t'+output.join('\r\n\t'));				
			fs.writeFile("output.json", output.join('\r\n'), function(err) {
				debug('Final output written to file for further processing!');
			});		

		});

	});
