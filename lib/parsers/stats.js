module.exports = function(path, module) {
	var package = {};
	var stats = {};

	try {
		package = require(path + "/package.json");

		stats.version = package.version;
		stats.description = package.description;
		stats.dependencies = package.dependencies || {};
		stats.devdependencies = package.devDependencies || {};
		stats.author = package.author;
		stats.repository = package.repository instanceof Object ? package.repository.url : undefined;
		stats.home = package.homepage;

		console.log("stats:");
		console.log("  version: " + stats.version);
		console.log("  description: " + stats.description);
		console.log("  author: " + stats.author);
	}
	catch(e) {}

	var lines = 0;
	var files = module.reference;

	if(files !== undefined) {
		for(var i = 0; i < files.length; i++) {
			lines += files[i].length;
		}

		stats.lines = lines;
		stats.files = files.length;

		console.log("  lines: " + stats.lines);
		console.log("  files: " + stats.files);
	}

	var stats_ = require("fs").statSync(path);
	stats.size = require("nodejs-fs-utils").fsizeSync(path);
	stats.updated = stats_.ctime;
	stats.created = stats_.birthtime;

	console.log("  size: " + stats.size);

	return stats;
}