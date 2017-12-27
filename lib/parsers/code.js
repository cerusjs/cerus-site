module.exports = function(path, module) {
	var file = {};
	var fs = require("fs");
	var path_ = require("path");

	var data = fs.readFileSync(path, "utf-8");
	var stats = fs.statSync(path);
	var lines = data.split("\n");

	file.source = [];
	file.length = lines.length;
	file.name = path_.basename(path);
	file.path = path;
	file.size = stats.size;
	file.updated = stats.mtime;
	file.created = stats.birthtime;
	file.nodes = [];

	console.log("  " + file.name + ": " + file.length + " lines");

	function clean(line) {
		return line.startsWith("*") ? line.substring(1, line.length).trim() : line.trim();
	}

	var in_node = false;
	var node = {};
	var nodes = [];
	var depth = 0;

	var highlight = require("highlight.js");
	var state = undefined;

	for(var i = 0; i < lines.length; i++) {
		var parsed = highlight.highlight("js", lines[i].replace(/\r+/g, ""), undefined, state);
		file.source.push(parsed.value);
		state = parsed.top;

		var line = lines[i].trim().replace(/\t+/g, "").replace(/\r+/g, "");

		if(in_node) {
			node.lines.push(clean(line));
		}

		for(var j = 0; j < line.length; j++) {
			if(line.charAt(j) === "{") {
				depth++;
			}
			else if(line.charAt(j) === "}") {
				depth--;
			}
			else if(j === line.indexOf("/**")) {
				in_node = true;
				node = {};
				node.depth = depth;
				node.lines = [];
				node.file = file.name;
				node.line = i + 1;
			}
			else if(j === line.indexOf("*/") || j === line.indexOf("**/")) {
				if(line.indexOf("*/") > line.indexOf("/**") || line.indexOf("**/") > line.indexOf("/**")) {
					if(line === "*/" || line === "**/") {
						node.lines = node.lines.slice(0 ,-1);
					}

					nodes.push(node);
					in_node = false;
				}
			}
		}
	}

	for(var i = 0; i < nodes.length; i++) {
		file.nodes.push(require("./node")(nodes[i], module));
	}

	var path = "";
	var cur_depth = 0;

	for(var i = 0; i < file.nodes.length; i++) {
		var node = file.nodes[i];

		if(path === "") {
			cur_depth = node.depth;
		}

		if(node.depth > cur_depth) {
			path += "." + node.name;
		}
		else if(node.depth === cur_depth) {
			path = path.substring(0, path.lastIndexOf(".") + 1) + node.name;
		}
		else {
			path = path.split(".").slice(0, node.depth).join(".") + "." + node.name;
		}

		cur_depth = node.depth;
		node.id = node.id || path;
	}

	var nodes = [];

	for(var i = 0; i < file.nodes.length; i++) {
		var node = file.nodes[i];

		if(node.type === "class") {
			node.children = [];
			nodes.push(node);
		}
		else {
			var id = node.id.substring(0, node.id.lastIndexOf("."));

			for(var j = 0; j < nodes.length; j++) {
				if(nodes[j].id === id) {
					nodes[j].children.push(node);
					break;
				}
			}
		}
	}

	//file.source = require("./markdown")("```javascript\n" + file.source.join("\n") + "\n```").split("\n");
	
	file.nodes = nodes;

	return file;
}