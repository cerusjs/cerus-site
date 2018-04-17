module.exports = function() {
	var config;

	try {
		config = require(process.cwd() + "/config.json");
	} catch(e) {
		throw e;
	}

	var modules_ = config.index;
	var modules = []; // All the module models
	var module = require("./parsers/module");

	for(var i = 0; i < modules_.length; i++) {
		modules[i] = module(process.cwd() + "/" + modules_[i], modules_[i]);
	}

	console.log("----- building -----");

	require("./builders/site")(process.cwd() + "/" + (config.folder || "public"), modules);

	console.log("-----!building!-----");

	//console.log(JSON.stringify(modules, null, '  '));
}