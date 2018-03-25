module.exports = function(root, path, module) {
	var file = {};
	var fs = require("fs");
	var path_ = require("path");
	var data = fs.readFileSync(root + "/" + path, "utf-8");
	var stats = fs.statSync(root + "/" + path);
	var lines = data.split("\n");
	var in_node = false;
	var node = {};
	var nodes = [];
	var depth = 0;
	var highlight = require("highlight.js");
	var state = undefined;

	file.source = [];
	file.length = lines.length;
	file.name = path;
	file.path = root + "/" + path;
	file.size = stats.size;
	file.updated = stats.mtime;
	file.created = stats.birthtime;
	file.nodes = [];
	file.words = 0;

	console.log("  " + file.name + ": " + file.length + " lines");

	// Go through all the lines
	for(var i = 0; i < lines.length; i++) {
		// Highlight the code
		var parsed = highlight.highlight("js", lines[i].replace(/\r+/g, ""), undefined, state);

		// Cleanup the line before using it
		var line = lines[i].trim().replace(/\t+/g, "").replace(/\r+/g, "");

		file.source.push(parsed.value);
		state = parsed.top;

		// If currently in a node, cleanup the line and add it to the node
		if(in_node) {
			node.lines.push(clean(line));
		}

		// Go through all the columns in the line
		for(var j = 0; j < line.length; j++) {
			// Add depth when the character is a {
			if(line.charAt(j) === "{") {
				depth++;
			}
			// Remove depth when the character is a }
			else if(line.charAt(j) === "}") {
				depth--;
			}
			// Start a new node if it starts with /**
			else if(j === line.indexOf("/**")) {
				in_node = true;
				node = {};
				node.depth = depth;
				node.lines = [];
				node.file = file.name;
				node.line = i + 1;
			}
			// End the node if there is currently a node and the column equal */ or **/
			else if((j === line.indexOf("*/") || j === line.indexOf("**/")) && Object.keys(node).length > 0) {
				if(line.indexOf("*/") > line.indexOf("/**") || line.indexOf("**/") > line.indexOf("/**")) {
					if(line === "*/" || line === "**/") {
						node.lines = node.lines.slice(0, -1);
					}

					nodes.push(node);
					in_node = false;
					node = {};
				}
			}
		}
	}

	// Parse each node separately
	for(var i = 0; i < nodes.length; i++) {
		file.nodes.push(require("./node")(nodes[i], module));
	}

	var path = "";
	var cur_depth = 0;

	// Go through all the nodes to 
	for(var i = 0; i < file.nodes.length; i++) {
		var node = file.nodes[i];

		// Add the amount of words to the total amount
		file.words += node.words;

		// Reset the depth if the path is root
		if(path === "") {
			cur_depth = node.depth;
		}

		// If the new depth is higher, prefix it with a dot
		if(node.depth > cur_depth) {
			path += "." + node.name;
		}

		// If the new depth is the same remove the everything after the last dot
		else if(node.depth === cur_depth) {
			path = path.substring(0, path.lastIndexOf(".") + 1) + node.name;
		}

		// If the new depth is 0, set the path equal to the name
		else if(node.depth === 0) {
			path = node.name;
		}

		// If the new depth is lower, remove the unneeded parts and add the name
		else {
			path = path.split(".").slice(0, node.depth).join(".") + "." + node.name;
		}

		// If the id is preset, update the path
		if(node.id) {
			path = node.id;
		}

		// Set the node's id with the path
		else {
			node.id = path;
		}

		// Update the depth
		cur_depth = node.depth;
	}

	// The new nodes array
	var nodes = [];

	// Go through all the nodes to sort them
	for(var i = 0; i < file.nodes.length; i++) {
		var node = file.nodes[i];

		// If the node is a class, add it to the new array
		if(node.type === "class") {
			node.children = [];
			nodes.push(node);
		}

		else {
			var id = node.id.substring(0, node.id.lastIndexOf("."));

			// Go through all the classes and add this node if the id matches
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

function clean(line) {
	return line.startsWith("*") ? line.substring(2, line.length).replace(/\s*$/,"") : line.trim();
}