	// Casper.js initialization
	var casper = require('casper').create({
		//verbose: true,
		//logLevel: "debug",
		loadImages: false,
		loadPlugins: false,
		pageSettings: {
		userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_2) AppleWebKit/537.11 (KHTML, like Gecko) Chrome/53.0.1271.97 Safari/537.11"
	  }
	});

	// Casper's way of handling command line arguments
	var url = casper.cli.get(0);

	// Parsing urls from page content
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

	// Finally run casper.js
	casper.start(url);
	var links = [];
	casper.then(function() {
		links = this.evaluate(processLinks);
	});
		
	casper.run(function() {
		this.echo(JSON.stringify(links)).exit();	
	});   

