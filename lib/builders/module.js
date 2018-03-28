module.exports = function(inner, data, path) {
	var ejs = require("ejs");
	var fs = require("fs");

	var name = data.name;
	var root = __dirname + "/../..";

	// Create the directory for this module.
	fs.mkdirSync(path + "/views/" + name);
	console.log("/views/" + name);

	// Create and initialize the readme file.
	if(data.readme) {
		fs.writeFileSync(path + "/views/" + name + "/readme.html", 
			ejs.render(fs.readFileSync(root + "/views/page.ejs").toString(), 
			{
				sidebar: inner.sidebar,
				inner: "./readme",
				data: data.readme.data,
				selected: "readme",
				module: name
			},
			{
				filename: root + "/views/page.ejs"
			}
		));
		console.log("/views/" + name + "/readme.html");
	}
	
	// CHANGELOG
	if(data.changelog) {
		fs.writeFileSync(path + "/views/" + name + "/changelog.html", 
			ejs.render(fs.readFileSync(root + "/views/page.ejs").toString(), 
			{
				sidebar: inner.sidebar,
				inner: "./readme",
				data: data.changelog.data,
				selected: "changelog",
				module: name
			},
			{
				filename: root + "/views/page.ejs"
			}
		));
		console.log("/views/" + name + "/changelog.html");
	}

	// TUTORIALS
	if(data.tutorials && data.tutorials.list.length > 0) {
		var tutorials = data.tutorials.list;

		fs.mkdirSync(path + "/views/" + name + "/tutorials");
		console.log("/views/" + name + "/tutorials");

		for(var i = 0; i < tutorials.length; i++) {
			var data_ = {
				sidebar: inner.sidebar,
				inner: "./readme",
				data: tutorials[i].data,
				selected: "tutorials",
				module: name,
				list: 
					{
						type: "tutorials", 
						items: tutorials.map(x => ({name: x.title, file: x.file + ".html"})), 
						module: name,
						value: tutorials[i].file + ".html"
					}
			};

			if(i === 0) {
				fs.writeFileSync(path + "/views/" + name + "/tutorials.html", 
					ejs.render(fs.readFileSync(root + "/views/page.ejs").toString(), data_,
					{
						filename: root + "/views/page.ejs"
					}
				));
				console.log("/views/" + name + "/tutorials.html");
			}

			fs.writeFileSync(path + "/views/" + name + "/tutorials/" + tutorials[i].file + ".html", 
				ejs.render(fs.readFileSync(root + "/views/page.ejs").toString(), data_,
				{
					filename: root + "/views/page.ejs"
				}
			));
			console.log("/views/" + name + "/tutorials/" + tutorials[i].file + ".html");
		}
	}

	// REFERENCE
	if(data.reference) {
		var reference = data.reference;
		var classes = [];

		fs.mkdirSync(path + "/views/" + name + "/reference");
		console.log("/views/" + name + "/reference");

		for(var x = 0; x < reference.length; x++) {
			var file = reference[x];

			file.file = file.name + ".html";

			for(var y = 0; y < file.nodes.length; y++) {
				var class_ = {};
				var node = file.nodes[y];

				class_.access = node.access;
				class_.aliases = node.aliases;
				class_.async = node.async;
				class_.author = node.author;
				class_.copyright = node.copyright;
				class_.date = node.date;
				class_.default = node.default;
				class_.deprecated = node.deprecated;
				class_.description = node.description;
				class_.examples = node.examples;
				class_.functions = [];
				class_.generators = node.generators;
				class_.license = node.license;
				class_.line = node.line;
				class_.links = node.links;
				class_.name = node.id;
				class_.nofunction = node.nofunction;
				class_.o_file = node.file;
				class_.override = node.override;
				class_.params = node.params;
				class_.readonly = node.readonly;
				class_.since = node.since;
				class_.summary = node.summary;
				class_.throws = node.throws;
				class_.todo = node.todo;
				class_.variables = [];
				class_.version = node.version;
				class_.yields = node.yields;

				class_.file = class_.name + ".html";
				class_.source = file.file;
				class_.module = name;

				for(var z = 0; z < node.children.length; z++) {
					if(node.children[z].type === "function") {
						class_.functions.push(node.children[z]);
					}
					else {
						class_.variables.push(node.children[z]);
					}
				}

				classes.push(class_);
			}
		}

		for(var n = 0; n < classes.length; n++) {
			var class__ = classes[n];

			var data__ = {
				sidebar: inner.sidebar,
				inner: "./reference",
				data: class__,
				selected: "reference",
				module: name,
				list: 
					{
						type: "reference", 
						items: classes.map(x => ({name: x.name, file: x.file})), 
						module: name,
						value: class__.name + ".html"
					}
			};

			if(n === 0) {
				fs.writeFileSync(path + "/views/" + name + "/reference.html", 
					ejs.render(fs.readFileSync(root + "/views/page.ejs").toString(), data__,
					{
						filename: root + "/views/page.ejs"
					}
				));
				console.log("/views/" + name + "/reference.html");
			}

			fs.writeFileSync(path + "/views/" + name + "/reference/" + class__.file, 
				ejs.render(fs.readFileSync(root + "/views/page.ejs").toString(), data__,
				{
					filename: root + "/views/page.ejs"
				}
			));
			console.log("/views/" + name + "/reference/" + class__.file);
		}

		fs.mkdirSync(path + "/views/" + name + "/source");
		console.log("/views/" + name + "/source");

		for(var y = 0; y < reference.length; y++) {
			var file_ = reference[y];

			ensureDirExists(path + "/views/" + name + "/source/" + file_.file, name);

			fs.writeFileSync(path + "/views/" + name + "/source/" + file_.file, 
				ejs.render(fs.readFileSync(root + "/views/page.ejs").toString(), 
				{
					sidebar: inner.sidebar,
					inner: "./source",
					data: {name: file_.name, source: file_.source},
					selected: "reference",
					module: name,
					list: 
						{
							type: "source", 
							items: reference.map(x => ({name: x.file, file: x.file})), 
							module: name,
							value: file_.file
						}
				},
				{
					filename: root + "/views/page.ejs"
				}
			));
			console.log("/views/" + name + "/source/" + file_.file);
		}
	}
	
	// TESTS

};

var ensureDirExists = function(file, name) {
	var dir = require("path").dirname(file);

	if(require("fs").existsSync(dir)) {
		return;
	}

	ensureDirExists(dir, name);
	require("fs").mkdirSync(dir);
	console.log("/views/" + name + "/source/" + dir);
};