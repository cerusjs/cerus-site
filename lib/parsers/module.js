module.exports = function(path, name) {
	var config;
	var fs = require("fs");
	var module = {};

	console.log("----- loading: " + name + " -----");

	try {
		config = require(path + "/site.json");
	}
	catch(e) {
		throw e;
	}

	module.name = name;

	if(config.ignore) {
		console.log("ignored");
		return undefined;
	}

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

	if(config.tutorials) {
		console.log("tutorials: ");

		module.tutorials = require("./tutorials")(path + "/" + config.tutorials);
	}

	if(config.reference) {
		console.log("reference: ");

		module.reference = require("./reference")(path, config.reference, name);
	}

	if(config.tests) {
		module.tests = require("./tests")(path, config.tests);
	}

	module.stats = require("./stats")(path, module);

	console.log("-----!loading: " + name + "!-----");

	return module;
}