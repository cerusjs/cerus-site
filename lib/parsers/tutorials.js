const fs = require("fs");

class tutorials {
	constructor(path) {
		this.path = path;
		this.config = require(path + "/tutorials.json");
		this.tutorials = {
			index: this.config.index,
			list: this.config.tutorials
		};

		this.sort();
		this.parse();
	}

	sort() {
		this.tutorials.list.sort((a, b) => {
			return this.tutorials.index.indexOf(a.file) - this.tutorials.index.indexOf(b.file);
		});
	}

	parse() {
		this.tutorials.list.forEach(tutorial => {
			var data = fs.readFileSync(this.path + "/" + tutorial.file, "utf-8");

			console.log("  " + tutorial.file + ": " + tutorial.title);
	
			if(data instanceof Error) {
				throw data;
			}
			else if(data instanceof Buffer) {
				data = data.toString('utf8');
			}
	
			tutorial.data = require("./markdown")(data);
			tutorial.length = tutorial.data.split("\n").length;
		});
	}
}

module.exports = tutorials;