const fs = require("fs");

class reference {
	constructor(root, paths, module_name) {
		this.files = [];
		this.module_name = module_name;
		this.root = root;

		this.index(paths);
		this.sort();
		this.parse();
	}

	index(paths = []) {
		paths.forEach(path => {
			if(fs.lstatSync(`${this.root}/${path}`).isDirectory()) {
				this.index(fs.readdirSync(`${this.root}/${path}`).map(sub_path => `${path}/${sub_path}`));
			}
			else {
				this.files.push(path);
			}
		});
	}

	sort() {
		this.files = this.files.sort((a, b) => {
			if(a < b) {
				return -1;
			}
			else if(a > b) {
				return 1;
			}

			return 0;
		});
	}

	parse() {
		this.files = this.files.map(file => (new (require("./file"))(this.root, file, this.module_name)).file);
	}
}

module.exports = reference;