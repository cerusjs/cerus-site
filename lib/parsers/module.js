const fs = require("fs");
const markdown = require("./markdown");

class module_ {
	constructor(path, name) {
		this.module = {
			name
		};
		this.path = path;

		console.log("----- loading: " + this.module.name + " -----");

		this.config = require(this.path + "/site.json");
		this.parse();
	}

	parse() {
		if(this.config.ignore) {
			console.log("ignored");
			return;
		}

		if(this.config.readme) {
			this.module.readme = {};
			this.module.readme.path = `${this.path}/${this.config.readme}`;
			this.module.readme.data = this.parse_markdown(this.module.readme.path);
			console.log("readme: " + this.config.readme);
		}

		if(this.config.changelog) {
			this.module.changelog = {};
			this.module.changelog.path = `${this.path}/${this.config.changelog}`;
			this.module.changelog.data = this.parse_markdown(this.module.changelog.path);
			console.log("changelog: " + this.config.changelog);
		}

		if(this.config.tutorials) {
			console.log("tutorials: ");

			this.module.tutorials = new (require("./tutorials"))(this.path + "/" + this.config.tutorials).tutorials;
		}

		if(this.config.reference) {
			console.log("reference: ");

			this.module.reference = new (require("./reference"))(this.path, this.config.reference, this.module.name).files;
		}

		this.module.stats = new (require("./stats"))(this.path, this.module.name);

		console.log("-----!loading: " + this.module.name + "!-----");
	}

	parse_markdown(path) {
		var data = fs.readFileSync(path, "utf-8");

		if(data instanceof Error) {
			throw data;
		}
		else if(data instanceof Buffer) {
			data = data.toString('utf8');
		}

		return markdown(data);
	}
}

module.exports = module_;