module.exports = function(node_, module) {
	var node = {};

	node.access = "public";
	node.aliases = [];
	node.async = false;
	node.author = undefined;
	node.copyright = undefined;
	node.date = undefined;
	node.default = undefined;
	node.deprecated = false;
	node.depth = node_.depth;
	node.description = undefined;
	node.emits = []; // {event, description}
	node.examples = [];
	node.file = node_.file;
	node.generator = false;
	node.id = undefined;
	node.ignore = false;
	node.license = undefined;
	node.line = node_.line;
	node.links = [];
	node.name = undefined;
	node.override = undefined;
	node.params = []; // {type, name, description, optional, array, child, default}
	node.readonly = false;
	node.return = {type: undefined, description: undefined};
	node.since = undefined;
	node.static = false;
	node.summary = undefined;
	node.throws = []; // {type, description}
	node.todo = undefined;
	node.type = "function";
	node.version = undefined;
	node.yields = false;

	var tags = [];
	var tag = {};
	var tag_ = function(line) {
		var new_line = line.substring(1, line.length);

		if(new_line.startsWith("@")) {
			return tag_(new_line);
		}

		var tag__ = new_line.split(" ")[0];

		if(tag__ === undefined) {
			return false;
		}

		return tag__.toLowerCase();
	}
	var clean = function(array) {
		array = array.slice(0);

		for(var i = 0; i < array.length; i++) {
			if(array[i] === undefined || array[i] === "") {
				array.splice(i);
			}
		}

		return array;
	}
	var update = function(val) {
		var links = [];
		var link = undefined;
		var copy = val.substring(0, val.length);

		for(var j = 0; j < copy.length; j++) {
			if(j === copy.indexOf("{@")) {
				link = {};
				link.text = "";
				j++;
			}
			else if(link !== undefined && j === copy.indexOf("}")) {
				links.push(link);
				link = undefined;
				copy = copy.substring(j + 1, copy.length);
				j = 0;
			}
			else if(link !== undefined) {
				link.text += copy[j];
			}
		}

		for(var i = 0; i < links.length; i++) {
			var link = links[i];
			var words = link.text.split(" ");
			link.type = words[0];

			if(words.length !== 2) {
				throw new Error("a inline link must contain one parameter");
			}

			var path = words[1];

			if(path.indexOf("#") >= 0) {
				link.module = path.substring(0, path.indexOf("#"));
				path = path.replace(link.module + "#", "");
			}

			if(path.lastIndexOf(".") < 0) {
				link.class = path;
			}
			else {
				link.class = path.substring(0, path.lastIndexOf("."));
				link.function = path.substring(path.lastIndexOf(".") + 1, path.length);
			}

			val = val.replace("{@" + link.text + "}", 
				"<a href=\"/views/" + (link.module || module) + "/reference/" + link.class + ".html" + 
				(link.function !== undefined ? "#" + link.function : "") + "\">" + words[1] + "</a>");
		}

		val = require("./markdown")(val);

		return val;
	}

	for(var i = 0; i < node_.lines.length; i++) {
		var line = node_.lines[i];

		if(line.startsWith("@")) {
			tags.push(tag);
			tag = {};
			tag.lines = [];
			tag.type = tag_(line);

			tag.lines.push(line.replace("@" + tag.type, "").trim());
		}
		else if(i === 0) {
			tag = {};
			tag.lines = [];
			tag.type = "desc";

			tag.lines.push(line.replace("@" + tag.type, "").trim());
		}
		else {
			tag.lines.push(line);
		}
	}

	if(tag !== undefined) {
		tags.push(tag);
	}

	for(var i = 0; i < tags.length; i++) {
		var tag = tags[i];

		switch(tag.type) {
			// Accepts all lines until new tag
			case "desc":
				tag.type = "description";
			case "description":
				if(tag.lines[0] === "") {
					tag.lines.slice(0, 1);
				}

				node[tag.type] = update(tag.lines.join(" "));
				break;

			case "example":
				if(tag.lines[0] === "") {
					tag.lines.splice(0, 1);
				}

				node.examples.push(require("./markdown")("```javascript\n" + tag.lines.join("\n") + "\n```"));
				break;

			// Accept only special parameters (return)
			case "return":
			case "returns":
				var type = clean(tag.lines[0]).split(" ")[0];

				if(type === undefined || (!type.startsWith("{") || !type.endsWith("}"))) {
					throw new Error("there was no valid type specified with the " + tag.type + " tag");
				}

				node.return.type = type.substring(1, type.length - 1);
				node.return.description = clean(tag.lines).join(" ").replace(type, "").trim();
				break;

			// Only accepts a special range of parameters (param)
			case "param":
			case "parameter":
			case "arg":
			case "argument":
				var param = {};
				var line = clean(tag.lines[0]);
				var type = line.substring(line.indexOf("{") + 1, line.indexOf("}"));
				var rest = line.replace("{" + type + "}", "").trim();

				if(type.split("|").length > 1) {
					param.type = type.split("|");

					for(var j = 0; j < param.type.length; j++) {
						param.type[j] = param.type[j].trim();
					}
				}
				else {
					param.type = type.trim();
				}

				if(rest.startsWith("(")) {
					var tmp = rest.substring(rest.indexOf("(") + 1, rest.indexOf(")"));
					param.name = tmp.substring(0, tmp.indexOf("=") === -1 ? tmp.length : tmp.indexOf("=")).trim();
					param.default = tmp.indexOf("=") === -1 ? 
						undefined : tmp.substring(tmp.indexOf("=") + 1, tmp.length).trim();
					param.optional = true;
					line = rest.replace("(" + tmp + ")", "");
				}
				else {
					param.name = rest.split(" ")[0];
					param.optional = false;
					line = rest.replace(param.name, "");
				}

				if(param.name.split(".").length > 1) {
					param.child = true;

					if(param.name.split(".")[0].endsWith("[]")) {
						param.array = true;
					}
					else {
						param.array = false;
					}
				}
				else {
					param.child = false;
					param.array = false;
				}

				tag.lines[0] = line;
				param.description = clean(tag.lines).join(" ").trim();
				node.params.push(param);
				break;

			// Accept only special parameters, and pushes it to an array (throws)
			case "throws":
				var type = clean(tag.lines[0]).split(" ")[0];

				if(type === undefined || (!type.startsWith("{") || !type.endsWith("}"))) {
					throw new Error("there was no valid type specified with the " + tag.type + " tag");
				}

				node.throws.push({
					type: type.substring(1, type.length - 1), 
					description: clean(tag.lines).join(" ").replace(type, "").trim()
				});
				break;

			// Accepts only one argument, but lowercases the result
			case "type":
				if(clean(tag.lines).length > 1) {
					throw new Error("the " + tag.type + " tag only supports the use of a single line");
				}
				else if(tag.lines[0].split(" ").length > 1) {
					throw new Error("the " + tag.type + " tag only accepts one parameter");
				}

				node.type = tag.lines[0].toLowerCase();
				break;

			// Accepts only one parameter, but also uses the tag (types)
			case "variable":
				tag.type = "var";
			case "function":
			case "class":
			case "var":
				if(clean(tag.lines).length > 1) {
					throw new Error("the " + tag.type + " tag only supports the use of a single line");
				}
				else if(tag.lines[0].split(" ").length > 1) {
					throw new Error("the " + tag.type + " tag only accepts one parameter");
				}

				node.type = tag.type;
				node.name = tag.lines[0];
				break;

			// Accepts only one parameter, but pushes the result to an array (aliases)
			case "aliases":
			case "alias":
				tag.type = "aliases";
				if(clean(tag.lines).length > 1) {
					throw new Error("the " + tag.type + " tag only supports the use of a single line");
				}
				else if(tag.lines[0].split(" ").length > 1) {
					throw new Error("the " + tag.type + " tag only accepts one parameter");
				}

				node[tag.type].push(tag.lines[0]);
				break;

			// Accepts only one parameter, but pushes the result to an array (links)
			case "links":
			case "see":
				tag.type = "links";
				if(clean(tag.lines).length > 1) {
					throw new Error("the " + tag.type + " tag only supports the use of a single line");
				}
				else if(tag.lines[0].split(" ").length > 1) {
					throw new Error("the " + tag.type + " tag only accepts one parameter");
				}

				node[tag.type].push(tag.lines[0]);
				break;

			case "fires":
			case "emits":
				tag.type = "emits";
				var event = clean(tag.lines[0]).split(" ")[0];

				if(clean(tag.lines).length > 1) {
					throw new Error("the " + tag.type + " tag only supports the use of a single line");
				}
				else if(event === undefined) {
					throw new Error("there was no valid event specified with the " + tag.type + " tag");
				}

				node.emits.push({
					event: event.substring(0, event.length), 
					description: clean(tag.lines).join(" ").replace(event, "").trim()
				});
				break;

			// Accepts just one parameter
			case "version":
			case "since":
			case "access":
			case "id":
				if(clean(tag.lines).length > 1) {
					throw new Error("the " + tag.type + " tag only supports the use of a single line");
				}
				else if(tag.lines[0].split(" ").length > 1) {
					throw new Error("the " + tag.type + " tag only accepts one parameter");
				}

				node[tag.type] = tag.lines[0];
				break;

			// Accepts only a single line
			case "copyright":
			case "author":
			case "license":
			case "default":
			case "todo":
			case "summary":
				if(clean(tag.lines).length > 1) {
					throw new Error("the " + tag.type + " tag only supports the use of a single line");
				}

				node[tag.type] = tag.lines[0];
				break;

			// Accepts no parameters and uses the tag (access types)
			case "private":
			case "public":
			case "protected":
				if(clean(tag.lines).length > 1) {
					throw new Error("the " + tag.type + " tag only supports the use of a single line");
				}
				else if(tag.lines[0].split(" ").length > 0 && tag.lines[0] !== "") {
					throw new Error("the " + tag.type + " tag accepts no parameters");
				}

				node.access = tag.type;
				break;

			// Sets the specified value to true
			case "yields":
			case "generator":
			case "readonly":
			case "deprecated":
			case "async":
			case "ignore":
			case "static":
			case "override":
				if(clean(tag.lines).length > 1) {
					throw new Error("the " + tag.type + " tag only supports the use of a single line");
				}
				else if(tag.lines[0].split(" ").length > 0 && tag.lines[0] !== "") {
					throw new Error("the " + tag.type + " tag accepts no parameters");
				}

				node[tag.type] = true;
				break;

			case "date":
				if(clean(tag.lines).length > 1) {
					throw new Error("the " + tag.type + " tag only supports the use of a single line");
				}

				node[tag.type] = new Date(tag.lines[0]);
				break;

			default:
				throw new Error("the tag " + tag.type + " is unknown");
				break;
		}
	}

	if(node.type === undefined) {
		throw new Error("the node has no type defined");
	}

	console.log("    " + node.type + ": " + node.name);

	return node;
}