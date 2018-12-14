const ejs = require("ejs");
const fs = require("fs");
const path = require("path");

class module_ {
	constructor(sidebar, data, path) {
		this.sidebar = sidebar;
		this.data = data;
		this.path = path;
		this.root = __dirname + "/../..";
		this.name = data.name;

		this.build();
	}

	build() {
		fs.mkdirSync(this.path + "/views/" + this.name);
		console.log("/views/" + this.name);

		if(this.data.readme) {
			this.build_readme();
		}

		if(this.data.changelog) {
			this.build_changelog();
		}

		if(this.data.tutorials && this.data.tutorials.list.length > 0) {
			this.build_tutorials();
		}

		if(this.data.reference) {
			this.build_reference();
		}
	}

	build_readme() {
		this.render("/readme.html", {
			inner: "./readme",
			data: this.data.readme.data,
			selected: "readme"
		});
	}

	build_changelog() {
		this.render("/changelog.html", {
			inner: "./readme",
			data: this.data.changelog.data,
			selected: "changelog"
		});
	}

	build_tutorials() {
		let data = {
			inner: "./readme",
			selected: "tutorials",
			list: {
				type: "tutorials",
				items: this.data.tutorials.list.map(tutorial => ({name: tutorial.title, file: tutorial.file + ".html"})), 
				module: this.name
			}
		};

		fs.mkdirSync(this.path + "/views/" + this.name + "/tutorials");
		console.log("/views/" + this.name + "/tutorials");

		this.data.tutorials.list.forEach((tutorial, index) => {
			data.data = tutorial.data;
			data.list.value = tutorial.file + ".html";

			if(index === 0) {
				this.render("/tutorials.html", data);
			}

			this.render("/tutorials/" + tutorial.file + ".html", data);
		});
	}

	build_reference() {
		let classes = [];

		fs.mkdirSync(this.path + "/views/" + this.name + "/reference");
		console.log("/views/" + this.name + "/reference");

		fs.mkdirSync(this.path + "/views/" + this.name + "/source");
		console.log("/views/" + this.name + "/source");

		this.data.reference.forEach(file => {
			file.file = file.name + ".html";

			file.nodes.forEach(node => {
				node.file = node.name + ".html";
				node.source = file.file;
				node.source_path = file.name;
				node.module = this.name;
				node.functions = [];
				node.variables = [];

				node.children.forEach(child => {
					if(child.type === "function") {
						node.functions.push(child);
					}
					else {
						node.variables.push(child);
					}
				});

				classes.push(node);
			});
		});

		let data = {
			inner: "./reference",
			selected: "reference",
			list: {
				type: "reference",
				items: classes.map(_class => ({name: _class.name, file: _class.file})), 
				module: this.name
			}
		};
		
		classes.forEach((_class, index) => {
			data.data = _class;
			data.list.value = _class.file;

			if(index === 0) {
				this.render("/reference.html", data);
			}

			this.render("/reference/" + _class.file, data);
		});

		this.data.reference.forEach(file => {
			this.create_dir_recursively(file.file);
			this.render("/source/" + file.file, {
				inner: "./source",
				data: {
					name: file.name,
					source: file.source
				},
				selected: "reference",
				list: {
					type: "source", 
					items: this.data.reference.map(file => ({name: file.name, file: file.file})), 
					module: this.name,
					value: file.file
				}
			});
		});
	}

	create_dir_recursively(path_) {
		let dir = this.path + "/views/" + this.name + "/source/" + path.dirname(path_);

		dir.split(path.sep).reduce((current_path, folder) => {
			current_path += folder + path.sep;

			if(!fs.existsSync(current_path)){
				console.log(current_path.replace(this.path, "").replace(/\\/g, "/"));
				fs.mkdirSync(current_path);
			}

			return current_path;
		}, '');

	}

	default_data(data) {
		return Object.assign({}, {
			sidebar: this.sidebar,
			module: this.name
		}, data);
	}

	render(to, data, from = this.root + "/views/page.ejs") {
		fs.writeFileSync(this.path + "/views/" + this.name + to, ejs.render(fs.readFileSync(from).toString(), this.default_data(data), {filename: from}));
		console.log("/views/" + this.name + to);
	}
}

module.exports = module_;