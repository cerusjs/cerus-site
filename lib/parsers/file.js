const fs = require("fs");
const highlight = require("highlight.js");

class file {
	constructor(root, path, module_name) {
		this.nodes = [];
		this.lines = fs.readFileSync(root + "/" + path, "utf-8").split("\n");
		this.stats = fs.statSync(root + "/" + path);
		this.module_name = module_name;
		this.root = root;
		this.file = {
			created: this.stats.birthtime,
			length: this.lines.length,
			name: path,
			nodes: [],
			path: root + "/" + path,
			size: this.stats.size,
			source: [],
			updated: this.stats.updated,
			words: 0
		};

		console.log("  " + this.file.name + ": " + this.file.length + " lines");
		this.parse();
		this.clean();
		this.sort();
		this.file.nodes = this.nodes;
	}

	parse() {
		let current_node = undefined;
		let in_node = false;
		let in_string = false;
		let depth = 0;
		let state = undefined;

		this.lines.forEach((line, index) => {
			var parsed = highlight.highlight("js", line.replace(/\r+/g, ""), undefined, state);
			
			var line = line.trim().replace(/\t+/g, "").replace(/\r+/g, "");

			this.file.source.push(parsed.value);
			state = parsed.top;

			if(current_node !== undefined) {
				current_node.lines.push(this.clean_line(line));
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
					current_node = {};
					current_node.depth = depth;
					current_node.lines = [];
					current_node.file = this.file.name;
					current_node.root = this.root;
					current_node.line = index + 1;
				}
				else if((j === line.indexOf("*/") || j === line.indexOf("**/")) && current_node !== undefined) {
					if(line.indexOf("*/") > line.indexOf("/**") || line.indexOf("**/") > line.indexOf("/**")) {
						if(line === "*/" || line === "**/") {
							current_node.lines = current_node.lines.slice(0, -1);
						}
						
						this.nodes.push(current_node);
						in_node = false;
						current_node = undefined;
					}
				}
			}
		});

		this.nodes = this.nodes.map(node => (new (require("./node"))(node, this.module_name)).data);
	}

	clean_line(line) {
		return line.startsWith("*") ? line.substring(2, line.length).replace(/\s*$/,"") : line.trim();
	}

	clean() {
		let depth = 0;
		let path = "";

		this.nodes = this.nodes.map(node => {
			file.words += node.words;

			if(path === "") {
				depth = node.depth;
			}

			if(node.depth > depth) {
				path += "." + node.name;
			}
			else if(node.depth === depth) {
				path = path.substring(0, path.lastIndexOf(".") + 1) + node.name;
			}
			else if(node.depth === 0) {
				path = node.name;
			}
			else {
				path = path.split(".").slice(0, node.depth).join(".") + "." + node.name;
			}

			if(node.id) {
				path = node.id;
			}
			else {
				node.id = path;
			}

			depth = node.depth;

			return node;
		});
	}

	sort() {
		let nodes = [];

		this.nodes.forEach(node => {
			if(node.type === "class") {
				node.children = [];
				nodes.push(node);
			}
			else {
				var id = node.id.substring(0, node.id.lastIndexOf("."));
				
				nodes.forEach(parent => {
					if(parent.id === id) {
						parent.children.push(node);
					}
				});
			}
		});

		this.nodes = nodes;
	}
}

module.exports = file;