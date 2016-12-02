Node.js Data Mining Series: Parallel Processing With Casper.js For Automating Google Search
------------------------------

•	Node.js:  An open-source, cross-platform JavaScript runtime environment for developing a diverse variety of tools and applications.
•	Bluebird.js:  A fully featured JavaScript promises library with unmatched performance.
•	Lodash.js:  A modern JavaScript utility library delivering modularity, performance, & extras.
•	Debug.js:  A small library for logging debug messages. Since it is just a wrapper around console.log , it works in both Node and the Browser. 
•	Commander.js:  The complete solution for node.js command-line programs.
•	Phantom.js:   A scripted, headless browser used for automating web page interaction.
•	Casper.js:  a browser navigation scripting & testing utility written in Javascript for PhantomJS or SlimerJS.

Basic motivation behind writing this post:
	Being a full stack developer & Data Scientist i am always looking to find best solutions for common technical problems related to mining,
	processing, automating large data sets.
	Recently i faced a challenge of aggregating data from google search for some research purposes, Although searching manually is a very time consuming process, 
	But How i automated this process is what i am going to share here in a nice walkthrough like style.

Required tools:	
	Node.js
	Bluebird.js
	Lodash.js
	Debug.js
	Commander.js
	Phantom.js
	Casper.js

Application files:
	master.js: Responsible for launching multiple child processes for task distribution & aggregating their results.
	child.js:  A separate casper.js process which is responsible for fetching and parsing data for any given url. 
	package.json: A meta data file for installing dependencies & performing other house keeping tasks.

Install dependencies through npm:
	First we need to install required dependencies by executing following command
	npm install --no-bin-links (Note: --no-bin-links is required for vagrant environment only)
	
Launch master.js:
	Now we launch master.js with 3 required parameters
	DEBUG=main:* node master.js -t "data mining with python" -c 2 -p 2
	where
	-t = term, any term like "data mining with python"
	-c = concurrency, number of parallel processes we want to run
	-p = pages, total number of pages to crawl (by default google display's 10 results per page)	

Breakdown of master.js:

	Initializing dependencies:
		var bbPromise = require('bluebird');
		var _ = require('lodash');
		var fs = require('fs');
		var util = require("util");
		var debug = require('debug')('main:application');
		var spawn = require('child_process').spawn;
		var program = require('commander');

	Show help & validate required parameters if are empty:
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

	Launch multiple child processes & aggregating their results in array, utilizes promise pattern:
		var results = [];
		function launchProcess(arg) {

			return new bbPromise(function(resolve, reject) {

			var process = spawn('casperjs', ['./worker.js', arg]);
			process.stdout.on('data', function(data) {
				results.push(JSON.parse(data.toString()));
				//console.log(util.inspect(data.toString(), {showHidden: false, depth: null}));
			});

			process.stderr.on('data', function(err) {
				reject(err.toString());
			});

			process.on('exit', function() {
				resolve();
			});
			});
		}	

	Generate multiple urls based on term parameter, also wrapped in promise pattern.
	Here we are utilizing google's exact match pattern for accurate matching.
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

	Execute our main handler now:
		generateUrls().then(function(urls_list) {

			//debug('Urls list generated! %j', urls_list);
			debug('Urls list generated!');
			console.log('\t'+urls_list.join('\r\n\t'));

			// what to parallel and how much
			bbPromise.map(urls_list, loadProcess, { concurrency: parseInt(program.concurrency) }).then(function() {

				debug('All child processes completed!');
				var output = _.flattenDeep(results);
				debug('Final output!');	
				console.log('\t'+output.join('\r\n\t'));				
				fs.writeFile("output.json", output.join('\r\n'), function(err) {
					debug('Final output written to file for further processing!');
				});
			});
		});

Breakdown of worker.js:

	Casper.js initialization:
		var casper = require('casper').create({
			//verbose: true,
			//logLevel: "debug",
			loadImages: false,
			loadPlugins: false,
			pageSettings: {
				userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_2) AppleWebKit/537.11 (KHTML, like Gecko) Chrome/23.0.1271.97 Safari/537.11"
			}
		});

	Casper's way of handling command line arguments:
		var url = casper.cli.get(0);

	Parse urls from page content:
		function processLinks() {
			var links = document.querySelectorAll('h3.r a');
			return Array.prototype.map.call(links, function(e) {

			var url = e.getAttribute('href');
			url = url.replace("/url?q=", "").split("&")[0];
			return url;
			if (url.charAt(0) === "/") {
				return;
			}
			return url;			
			});
		}

	Finally run casper.js:	
		casper.start(url);
		var links = [];
		casper.then(function() {
			links = this.evaluate(processLinks);
		});

		casper.run(function() {
			this.echo(JSON.stringify(links)).exit();	
		});

developed by: Ali Khan (Full Stack Developer)
Linkedin: pk.linkedin.com/in/p2palikhan
Skype: ali-gaditek
