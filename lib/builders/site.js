module.exports = function(path, data) {
	var ejs = require("ejs");
	var fs = require("fs");
	var del = require("del");

	var root = __dirname + "/../..";
	var inner = {};

	// Create or reset the folder
	if(fs.existsSync(path + "/")) {
		del.sync([path + "/*"]);
	}
	else {
		fs.mkdirSync(path + "/");
	}
	console.log("/");

	// Configure the sidebar
	inner.sidebar = [];
	for(var i = 0; i < data.length; i++) {
		var module = data[i];
		var module_ = {};
		module_.name = module.name;
		module_.readme = module.readme !== undefined;
		module_.changelog = module.changelog !== undefined;
		module_.tutorials = module.tutorials !== undefined;
		module_.reference = module.reference !== undefined;
		module_.tests = module.tests !== undefined;

		inner.sidebar.push(module_);
	}

	if(data.map(x => x.readme).length > 0) {
		fs.writeFileSync(path + "/index.html", ejs.render(fs.readFileSync(root + "/views/page.ejs").toString(), 
			{
				sidebar: inner.sidebar,
				inner: "./readme",
				data: data[0].readme.data,
				selected: "readme",
				module: data[0].name
			},
			{
				filename: root + "/views/page.ejs"
			}
		));
		console.log("/index.html");
	}

	// Create the views directory.
	fs.mkdirSync(path + "/views");
	console.log("/views");

	// Create the files for each module.
	for(var i = 0; i < data.length; i++) {
		require("./module")(inner, data[i], path);
	}

	// Copies all the images, extra scripts and stylesheets.
	require("./misc")(path);
}