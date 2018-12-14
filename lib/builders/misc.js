const fs = require("fs");

class misc {
	constructor(path) {
		this.path = path;
		this.root = __dirname + "/../..";

		this.build();
	}

	build() {
		fs.mkdirSync(this.path + "/assets");
		console.log("/assets");

		fs.mkdirSync(this.path + "/assets/css");
		fs.copyFileSync(this.root + "/assets/css/stylesheet.css", this.path + "/assets/css/stylesheet.css");
		fs.copyFileSync(this.root + "/assets/css/highlight.css", this.path + "/assets/css/highlight.css");
		fs.copyFileSync(this.root + "/assets/css/markdown.css", this.path + "/assets/css/markdown.css");
		console.log("/assets/css");
		console.log("/assets/css/stylesheet.css");
		console.log("/assets/css/highlight.css");
		console.log("/assets/css/markdown.css");

		fs.mkdirSync(this.path + "/assets/js");
		fs.copyFileSync(this.root + "/assets/js/script.js", this.path + "/assets/js/script.js");
		console.log("/assets/js");
		console.log("/assets/js/script.js");

		fs.mkdirSync(this.path + "/assets/gfx");
		fs.copyFileSync(this.root + "/assets/gfx/logo.png", this.path + "/assets/gfx/logo.png");
		fs.copyFileSync(this.root + "/assets/gfx/scroll_top_icon.png", this.path + "/assets/gfx/scroll_top_icon.png");
		console.log("/assets/gfx");
		console.log("/assets/gfx/logo.png");
	}
}

module.exports = misc;