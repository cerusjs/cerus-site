module.exports = function(node_, module) {
	var node = {};

	// Set all the defaults
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
	node.lines = node_.lines;
	node.links = [];
	node.name = undefined;
	node.nofunction = false;
	node.override = undefined;
	node.params = []; // {type, name, description, optional, array, child, default}
	node.readonly = false;
	node.return = {type: undefined, description: undefined};
	node.since = undefined;
	node.size = node_.lines.join("\n").length;
	node.static = false;
	node.summary = undefined;
	node.throws = []; // {type, description}
	node.todo = undefined;
	node.type = "function";
	node.version = undefined;
	node.words = node_.lines.join(" ").split(" ").length;
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
			link.path = words[1];

			if(words.length !== 2) {
				throw new Error("a inline link must contain one parameter");
			}

			switch(link.type) {
				case "link": 
					if(link.path.indexOf("#") >= 0) {
						link.module = link.path.substring(0, link.path.indexOf("#"));
						link.path = link.path.replace(link.module + "#", "");
					}

					if(link.path.lastIndexOf(".") < 0) {
						link.class = link.path;
					}
					else {
						link.class = link.path.substring(0, link.path.lastIndexOf("."));
						link.function = link.path.substring(link.path.lastIndexOf(".") + 1, link.path.length);
					}

					val = val.replace("{@" + link.text + "}", 
						"<a href=\"/views/" + (link.module || module) + "/reference/" + link.class + ".html" + 
						(link.function !== undefined ? "#" + link.function : "") + "\">" + words[1] + "</a>");
					break;
				
				case "tutorial":
					val = val.replace("{@" + link.text + "}", "<a href=\"/views/" + (link.module || module) + "/tutorials/" + link.path + ".html" + "\">" + words[1] + "</a>");
					break;

				default:
					throw new Error("the inline tag " + link.type + " is unknown");
			}
		}

		val = require("./markdown")(val);

		return val;
	}

	// Go through all the lines to parse the tags
	for(var i = 0; i < node_.lines.length; i++) {
		var line = node_.lines[i];

		// If the lines starts with a @, create a new tag
		if(line.startsWith("@")) {
			if(Object.keys(tag).length > 0) {
				tags.push(tag);
			} 
			
			tag = {};
			tag.lines = [];
			tag.type = tag_(line);

			tag.lines.push(line.replace("@" + tag.type, "").trim());
		}

		// If the first line doesn't start with a tag, assume it's the description
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

	// If there is still a tag unpushed, push it to the array
	if(Object.keys(tag).length > 0) {
		tags.push(tag);
	}

	// Go through all the tags to parse them
	for(var i = 0; i < tags.length; i++) {
		var tag = tags[i];

		switch(tag.type) {
			// Accepts all lines until new tag
			case "desc":
				tag.type = "description";
			case "description":
				// Remove the first line if it's empty
				if(tag.lines[0] === "") {
					tag.lines.slice(0, 1);
				}

				// Set the specified tag to a joined string of all the lines
				node[tag.type] = update(tag.lines.join(" "));
				break;

			case "example":
				// Remove the first line if it's empty
				if(tag.lines[0] === "") {
					tag.lines.splice(0, 1);
				}

				// Add a new example to the list with the joined string highlighted
				node.examples.push(require("./markdown")("```javascript\n" + tag.lines.join("\n") + "\n```"));
				break;

			// Accept only special parameters (return)
			case "return":
			case "returns":
				// Cleanup the first line
				var type = clean(tag.lines[0]).split(" ")[0];

				// If the type is invalid, throw an Error
				if(type === undefined || (!type.startsWith("{") || !type.endsWith("}"))) {
					throw new Error("there was no valid type specified with the " + tag.type + " tag");
				}

				// Set the type to the first word, minus the curly brackets
				node.return.type = type.substring(1, type.length - 1);

				// Set the description to the rest of the tag
				node.return.description = clean(tag.lines).join(" ").replace(type, "").trim();
				break;

			// Only accepts a special range of parameters (param)
			case "param":
			case "parameter":
			case "arg":
			case "argument":
				var param = {};

				// Cleanup the first line
				var line = clean(tag.lines[0]);

				// Set the type to the first word, minus the curly brackets
				var type = line.substring(line.indexOf("{") + 1, line.indexOf("}"));
				var rest = line.replace("{" + type + "}", "").trim();

				// Split the type if it contains multiple types
				if(type.split("|").length > 1) {
					param.type = type.split("|");

					// Add every type to the list
					for(var j = 0; j < param.type.length; j++) {
						param.type[j] = param.type[j].trim();
					}
				}
				else {
					param.type = type.trim();
				}

				// If the second word starts with a bracket it's optionsal
				if(rest.startsWith("(")) {
					// Parse the second parameter
					var tmp = rest.substring(rest.indexOf("(") + 1, rest.indexOf(")"));
					// Set the name of the param to everything before the equals symbol (if there is one)
					param.name = tmp.substring(0, tmp.indexOf("=") === -1 ? tmp.length : tmp.indexOf("=")).trim();

					// Set the default of the param to everything after the equals symbol (if there is one)
					param.default = tmp.indexOf("=") === -1 ? 
						undefined : tmp.substring(tmp.indexOf("=") + 1, tmp.length).trim();

					// Set the param to optional 
					param.optional = true;

					// Set the remaining of the line
					line = rest.replace("(" + tmp + ")", "");
				}
				else {
					// Set the name to the second word
					param.name = rest.split(" ")[0];

					// Set to param to non-optional
					param.optional = false;

					// Set the remaining of the line
					line = rest.replace(param.name, "");
				}

				// If the name contains a dot it's a child
				if(param.name.split(".").length > 1) {
					param.child = true;

					// Set the param to be an array if the first part of the name ends with []
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

				// Update the first line
				tag.lines[0] = line;

				// Set the description to a cleaned up version of the remaining lines
				param.description = clean(tag.lines).join(" ").trim();

				// Push the parameter to the array
				node.params.push(param);
				break;

			// Accept only special parameters, and pushes it to an array (throws)
			case "throws":
				// Parse the first parameter
				var type = clean(tag.lines[0]).split(" ")[0];

				// Throw an error if it's incorrect
				if(type === undefined || (!type.startsWith("{") || !type.endsWith("}"))) {
					throw new Error("there was no valid type specified with the " + tag.type + " tag");
				}

				// Push the error to the list with description
				node.throws.push({
					type: type.substring(1, type.length - 1), 
					description: clean(tag.lines).join(" ").replace(type, "").trim()
				});
				break;

			// Accepts only one argument, but lowercases the result
			case "type":
				// Throw an error when there are more than two lines and there are more than one parameter
				if(clean(tag.lines).length > 1) {
					throw new Error("the " + tag.type + " tag only supports the use of a single line");
				}
				else if(tag.lines[0].split(" ").length > 1) {
					throw new Error("the " + tag.type + " tag only accepts one parameter");
				}

				// Set the type to the first parameter
				node.type = tag.lines[0].toLowerCase();
				break;

			// Accepts only one parameter, but also uses the tag (types)
			case "variable":
				tag.type = "var";
			case "function":
			case "class":
			case "var":
				// Throw an error when there are more than two lines and there are more than one parameter
				if(clean(tag.lines).length > 1) {
					throw new Error("the " + tag.type + " tag only supports the use of a single line");
				}
				else if(tag.lines[0].split(" ").length > 1) {
					throw new Error("the " + tag.type + " tag only accepts one parameter");
				}

				// Set the type to the used tag type
				node.type = tag.type;
				node.name = tag.lines[0];
				break;

			// Accepts only one parameter, but pushes the result to an array (aliases)
			case "aliases":
			case "alias":
				tag.type = "aliases";

				// Throw an error when there are more than two lines and there are more than one parameter
				if(clean(tag.lines).length > 1) {
					throw new Error("the " + tag.type + " tag only supports the use of a single line");
				}
				else if(tag.lines[0].split(" ").length > 1) {
					throw new Error("the " + tag.type + " tag only accepts one parameter");
				}

				// Push the alias to the list
				node[tag.type].push(tag.lines[0]);
				break;

			// Accepts only one parameter, but pushes the result to an array (links)
			case "links":
			case "see":
				tag.type = "links";

				// Throw an error when there are more than two lines and there are more than one parameter
				if(clean(tag.lines).length > 1) {
					throw new Error("the " + tag.type + " tag only supports the use of a single line");
				}
				else if(tag.lines[0].split(" ").length > 1) {
					throw new Error("the " + tag.type + " tag only accepts one parameter");
				}

				// Push the link to the list
				node[tag.type].push(tag.lines[0]);
				break;

			case "fires":
			case "emits":
				tag.type = "emits";

				// Parse the event from the first parameter
				var event = clean(tag.lines[0]).split(" ")[0];

				// Throw an error when there are more than one lines or if the event is undefined
				if(clean(tag.lines).length > 1) {
					throw new Error("the " + tag.type + " tag only supports the use of a single line");
				}
				else if(event === undefined) {
					throw new Error("there was no valid event specified with the " + tag.type + " tag");
				}

				// Push the event to list and add the description
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
				// Throw an error when there are more than two lines and there are more than one parameter
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
				// Throw an error when there is more than one line
				if(clean(tag.lines).length > 1) {
					throw new Error("the " + tag.type + " tag only supports the use of a single line");
				}

				node[tag.type] = tag.lines[0];
				break;

			// Accepts no parameters and uses the tag (access types)
			case "private":
			case "public":
			case "protected":
				// Throw an error when there is more than one line and there are more than one parameter
				if(clean(tag.lines).length > 1) {
					throw new Error("the " + tag.type + " tag only supports the use of a single line");
				}
				else if(tag.lines[0].split(" ").length > 0 && tag.lines[0] !== "") {
					throw new Error("the " + tag.type + " tag accepts no parameters");
				}

				// Set the access of the node
				node.access = tag.type;
				break;

			// Sets the specified value to true
			case "yields":
			case "generator":
			case "readonly":
			case "deprecated":
			case "nofunction":
			case "async":
			case "ignore":
			case "static":
			case "override":
				// Throw an error when there is more than one line and there are more than one parameter
				if(clean(tag.lines).length > 1) {
					throw new Error("the " + tag.type + " tag only supports the use of a single line");
				}
				else if(tag.lines[0].split(" ").length > 0 && tag.lines[0] !== "") {
					throw new Error("the " + tag.type + " tag accepts no parameters");
				}

				node[tag.type] = true;
				break;

			case "date":
				// Throw an error when there is more than one line
				if(clean(tag.lines).length > 1) {
					throw new Error("the " + tag.type + " tag only supports the use of a single line");
				}

				// Set the date to the parsed date
				node[tag.type] = new Date(tag.lines[0]);
				break;

			default:
				throw new Error("the tag " + tag.type + " is unknown");
				break;
		}
	}

	// If no type has been set, throw an error
	if(node.type === undefined) {
		throw new Error("the node has no type defined");
	}

	console.log("    " + node.type + ": " + node.name);

	return node;
}