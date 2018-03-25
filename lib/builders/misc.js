module.exports = function(path) {
	var fs = require("fs");

	var root = __dirname + "/../..";

	// Create the assets folder
	fs.mkdirSync(path + "/assets");
	console.log("/assets");

	// Copy the stylesheets
	fs.mkdirSync(path + "/assets/css");
	fs.copyFileSync(root + "/assets/css/stylesheet.css", path + "/assets/css/stylesheet.css");
	fs.copyFileSync(root + "/assets/css/highlight.css", path + "/assets/css/highlight.css");
	fs.copyFileSync(root + "/assets/css/markdown.css", path + "/assets/css/markdown.css");
	console.log("/assets/css");
	console.log("/assets/css/stylesheet.css");
	console.log("/assets/css/highlight.css");
	console.log("/assets/css/markdown.css");

	// Copy the scripts
	fs.mkdirSync(path + "/assets/js");
	fs.copyFileSync(root + "/assets/js/script.js", path + "/assets/js/script.js");
	console.log("/assets/js");
	console.log("/assets/js/script.js");

	// Copy the images
	fs.mkdirSync(path + "/assets/gfx");
	fs.copyFileSync(root + "/assets/gfx/logo.png", path + "/assets/gfx/logo.png");
	console.log("/assets/gfx");
	console.log("/assets/gfx/logo.png");
}