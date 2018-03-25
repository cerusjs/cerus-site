module.exports = function(path, name) {
	var config;
	var fs = require("fs");
	var module = {};

	console.log("----- loading: " + name + " -----");

	// Try to load the config for this module
	try {
		config = require(path + "/site.json");
	}
	catch(e) {
		throw e;
	}

	module.name = name;

	// Ignore the config if it wants to be ignored
	if(config.ignore) {
		console.log("ignored");
		return undefined;
	}

	// If this config has a readme, read it and add it
	if(config.readme) {
		module.readme = {};
		module.readme.used = true;
		module.readme.path = path + "/" + config.readme;
		console.log("readme: " + module.readme.path);

		var data = fs.readFileSync(module.readme.path, "utf-8");

		if(data instanceof Error) {
			throw data;
		}
		else if(data instanceof Buffer) {
			data = data.toString('utf8');
		}

		module.readme.data = require("./markdown")(data);
	}

	// If this config has a changelog, read it and add it
	if(config.changelog) {
		module.changelog = {};
		module.changelog.used = true;
		module.changelog.path = path + "/" + config.changelog;
		console.log("changelog: " + module.changelog.path);

		var data = fs.readFileSync(module.changelog.path, "utf-8");

		if(data instanceof Error) {
			throw data;
		}
		else if(data instanceof Buffer) {
			data = data.toString('utf8');
		}

		module.changelog.data = require("./markdown")(data);
	}

	// If this config has tutorials, parse these in the tutorials class
	if(config.tutorials) {
		console.log("tutorials: ");

		module.tutorials = require("./tutorials")(path + "/" + config.tutorials);
	}

	// If this config has reference classes, parse these in the reference class
	if(config.reference) {
		console.log("reference: ");

		module.reference = require("./reference")(path, config.reference, name);
	}

	// If this condif has tests, skip them for now
	if(config.tests) {
		//module.tests = require("./tests")(path, config.tests);
	}

	// Lastly, parse all the statistics
	module.stats = require("./stats")(path, module);

	console.log("-----!loading: " + name + "!-----");

	return module;
}