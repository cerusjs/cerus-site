module.exports = function(path, data) {
	var ejs = require("ejs");
	var fs = require("fs");
	var del = require("del");

	var root = __dirname + "/../..";
	var inner = {};
	var index = false;

	// Create or reset the folder
	if(fs.existsSync(path + "/")) {
		del.sync([path + "/*"]);
	}
	else {
		fs.mkdirSync(path + "/");
	}

	// Configure the sidebar
	inner.sidebar = [];
	for(var i = 0; i < data.length; i++) {
		var module = data[i];
		var module_ = {};
		module_.name = module.name;

		if(module.readme) {
			module_.readme = true;
		}

		if(module.changelog) {
			module_.changelog = true;
		}

		if(module.tutorials) {
			module_.tutorials = true;
		}

		if(module.reference) {
			module_.reference = true;
		}

		if(module.tests) {
			module_.tests = true;
		}

		inner.sidebar.push(module_);
	}

	// Create the views directory.
	fs.mkdirSync(path + "/views");

	// Create the files for each module.
	for(var i = 0; i < data.length; i++) {
		if(!index && data[i].readme) {
			index = true;

			// Create the index file.
			fs.writeFileSync(path + "/index.html", ejs.render(fs.readFileSync(root + "/views/page.ejs").toString(), 
				{
					sidebar: inner.sidebar,
					inner: "./readme",
					data: data[i].readme.data,
					selected: "none",
					module: module_.name
				},
				{
					filename: root + "/views/page.ejs"
				}
			));
		}

		require("./module")(inner, data[i], path);
	}

	// Copies all the images, extra scripts and stylesheets.
	require("./misc")(path);
}