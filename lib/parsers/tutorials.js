module.exports = function(path) {
	var config;
	var fs = require("fs");
	var tutorials = {};

	// Try to read the tutorials config
	try {
		config = require(path + "/tutorials.json");
	}
	catch(e) {
		throw e;
	}

	tutorials.index = config.index;
	tutorials.list = config.tutorials;

	// Sort all the tutorials by name
	tutorials.list.sort(function(a, b) {
		return tutorials.index.indexOf(a.file) - tutorials.index.indexOf(b.file);
	});

	// Load every tutorial and add markup
	for(var i = 0; i < tutorials.list.length; i++) {
		var data = fs.readFileSync(path + "/" + tutorials.list[i].file, "utf-8");

		console.log("  " + tutorials.list[i].file + ": " + tutorials.list[i].title);

		if(data instanceof Error) {
			throw data;
		}
		else if(data instanceof Buffer) {
			data = data.toString('utf8');
		}

		tutorials.list[i].data = require("./markdown")(data);
		tutorials.list[i].length = tutorials.list[i].data.split("\n").length;
	}

	return tutorials;
}