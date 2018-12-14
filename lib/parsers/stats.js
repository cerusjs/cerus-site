class stats {
	constructor(path, module) {
		this.stats = {};
		this.package = {};
		this.module = module;
		this.path = path;

		this.parse_package();
		this.parse_reference();
		this.parse_folder();
	}

	parse_package() {
		try {
			let _package = require(path + "/package.json");
	
			this.stats.version = _package.version;
			this.stats.description = _package.description;
			this.stats.dependencies = _package.dependencies || {};
			this.stats.devdependencies = _package.devDependencies || {};
			this.stats.author = _package.author;
			this.stats.repository = _package.repository instanceof Object ? _package.repository.url : undefined;
			this.stats.home = _package.homepage;
	
			console.log("stats:");
			console.log("  version: " + this.stats.version);
			console.log("  description: " + this.stats.description);
			console.log("  author: " + this.stats.author);
		}
		catch(e) {}
	}

	parse_reference() {
		var files = this.module.reference;
		let lines = 0;

		if(files !== undefined) {
			files.forEach(file => lines += file.length);

			this.stats.lines = lines;
			this.stats.files = files.length;
	
			console.log("  lines: " + stats.lines);
			console.log("  files: " + stats.files);
		}
	}

	parse_folder() {
		var folder_stats = require("fs").statSync(this.path);

		this.stats.size = require("nodejs-fs-utils").fsizeSync(this.path);
		this.stats.updated = folder_stats.ctime;
		this.stats.created = folder_stats.birthtime;

		console.log("  size: " + stats.size);
	}
}

module.exports = stats;