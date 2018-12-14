
const module_parser = require("./parsers/module");
const site_builder = require("./builders/site");

class site {
	constructor() {
		this.config = require(`${process.cwd()}/config.json`);
		this.modules = this.config.index;
	}

	parse() {
		this.modules = this.modules.map(module_name => (new module_parser(`${process.cwd()}/${module_name}`, module_name)).module);
	}

	build() {
		console.log("----- building -----");

		new site_builder(`${process.cwd()}/${(this.config.folder || "public")}`, this.modules);

		console.log("-----!building!-----");
	}
}

module.exports = site;