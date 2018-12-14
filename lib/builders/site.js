const ejs = require("ejs");
const fs = require("fs");
const del = require("del");

class site {
	constructor(path, modules) {
		this.modules = modules;
		this.path = path;
		this.root = __dirname + "/../..";

		this.build();
	}

	build() {
		if(fs.existsSync(this.path + "/")) {
			del.sync([this.path + "/*"]);
		}
		else {
			fs.mkdirSync(this.path + "/");
		}

		console.log("/");

		this.config_sidebar();
		this.build_index();

		fs.mkdirSync(this.path + "/views");
		console.log("/views");

		this.build_modules();

		new (require("./misc"))(this.path);
	}

	config_sidebar() {
		this.sidebar = this.modules.map(module => {
			return {
				name: module.name,
				readme: module.readme !== undefined,
				changelog: module.changelog !== undefined,
				tutorials: module.tutorials !== undefined,
				reference: module.reference !== undefined,
				tests: module.tests !== undefined
			}
		});
	}

	build_index() {
		let first_readme = this.modules.find(module => module.readme);

		if(first_readme === undefined) {
			return;
		}

		fs.writeFileSync(this.path + "/index.html", ejs.render(fs.readFileSync(this.root + "/views/page.ejs").toString(), {
				sidebar: this.sidebar,
				inner: "./readme",
				data: first_readme.readme.data,
				selected: "readme",
				module: first_readme.name
			}, {
				filename: this.root + "/views/page.ejs"
			}
		));

		console.log("/index.html");
	}

	build_modules() {
		this.modules.forEach(module => new (require("./module"))(this.sidebar, module, this.path));
	}
}

module.exports = site;