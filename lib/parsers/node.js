var markdown = require("./markdown");

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
				array.splice(i, 1);
			}
		}

		return array;
	}

	var styleMarkdown = function(val) {
		return markdown(val);
	}

	var styleLinks = function(val) {
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

					if(link.function === "constructor") {
						link.function = undefined;
						words[1] = words[1].replace(".constructor", "");
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

		return val;
	}

	var styleScript = function(val) {
		return markdown("```javascript\n" + val + "\n```")
	}
	
	var style = function(val, opts) {
		var opts_ = Object.assign({}, {
			markdown: false,
			links: true,
			script: false
		}, opts);

		if(opts_["script"]) {
			val = styleScript(val);
		}
		else if(opts_["markdown"]) {
			val = styleMarkdown(val);
		}

		if(opts_["links"]) {
			val = styleLinks(val);
		}

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
			case "desc":
			case "description":
				node.description = style(clean(tag.lines).join(" "), {markdown: true});
				break;

			case "example":
				var lines = clean(tag.lines);

				if(lines.length <= 0) {
					throw new Error("the " + tag.type + " requires at least a single line");
				}

				node.examples.push(style(lines.join("\n"), {script: true, links: false}));
				break;

			case "return":
			case "returns":
				var lines = clean(tag.lines);
				
				if(lines.length <= 0) {
					throw new Error("the " + tag.type + " requires at least a single line");
				}
				
				var type = lines[0].split(" ")[0];

				if(typeof type !== "string" || (!type.startsWith("{") || !type.endsWith("}"))) {
					throw new Error("there was no valid type specified for the " + tag.type + " tag");
				}

				type = type.substring(1, type.length - 1);

				if(type.split("|").length > 1) {
					node.return.type = type.split("|");

					for(var j = 0; j < node.return.type.length; j++) {
						node.return.type[j] = node.return.type[j].trim();
					}
				}
				else {
					node.return.type = type.trim();
				}

				node.return.description = style(clean(tag.lines).join(" ").replace(lines[0].split(" ")[0], "").trim());
				break;

			case "param":
			case "parameter":
			case "arg":
			case "argument":
				var param = {};
				var lines = clean(tag.lines);

				if(lines.length <= 0) {
					throw new Error("the " + tag.type + " requires at least a single line");
				}

				var line = lines[0];
				var type = line.substring(0, line.indexOf("}") + 1);

				if(type.length < 0 || !type.startsWith("{") || !type.endsWith("}")) {
					throw new Error("there was no valid type specified for the " + tag.type + " tag");
				}

				type = type.substring(1, type.length - 1);

				if(type.split("|").length > 1) {
					param.type = type.split("|");

					for(var j = 0; j < param.type.length; j++) {
						param.type[j] = param.type[j].trim();
					}
				}
				else {
					param.type = type.trim();
				}

				var rest = line.replace("{" + type + "}", "").trim();

				if(rest.startsWith("(")) {
					var tmp = rest.substring(rest.indexOf("(") + 1, rest.indexOf(")"));

					param.name = tmp.substring(0, tmp.indexOf("=") === -1 ? tmp.length : tmp.indexOf("=")).trim();
					param.default = tmp.indexOf("=") === -1 ? undefined : tmp.substring(tmp.indexOf("=") + 1, tmp.length).trim();
					param.optional = true;

					if(param.name.length <= 0) {
						throw new Error("there is now valid name specified for the " + tag.type + " tag");
					}
					else if(param.default !== undefined && param.default.length <= 0) {
						throw new Error("there is now valid default value specified for the " + tag.type + " tag");
					}

					line = rest.replace("(" + tmp + ")", "");
				}
				else {
					param.name = rest.split(" ")[0];
					param.optional = false;

					if(param.name.length <= 0) {
						throw new Error("there is now valid name specified for the " + tag.type + " tag");
					}

					line = rest.replace(param.name, "");
				}

				tag.lines[0] = line;

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

				param.description = style(clean(tag.lines).join(" ").trim());
				node.params.push(param);
				break;

			case "throws":
				var lines = clean(tag.lines);
					
				if(lines.length <= 0) {
					throw new Error("the " + tag.type + " requires at least a single line");
				}
				
				var type = lines[0].split(" ")[0];

				if(typeof type !== "string" || (!type.startsWith("{") || !type.endsWith("}"))) {
					throw new Error("there was no valid type specified for the " + tag.type + " tag");
				}

				node.throws.push({
					type: type.substring(1, type.length - 1), 
					description: style(clean(tag.lines).join(" ").replace(type, "").trim())
				});
				break;

			case "type":
				if(clean(tag.lines).length > 1) {
					throw new Error("the " + tag.type + " tag only supports the use of a single line");
				}
				else if(clean(tag.lines)[0].split(" ").length > 1) {
					throw new Error("the " + tag.type + " tag only accepts one parameter");
				}

				node.type = tag.lines[0].toLowerCase();
				break;

			case "variable":
				tag.type = "var";
			case "function":
			case "class":
			case "var":
				if(clean(tag.lines).length > 1) {
					throw new Error("the " + tag.type + " tag only supports the use of a single line");
				}
				else if(clean(tag.lines)[0].split(" ").length > 1) {
					throw new Error("the " + tag.type + " tag only accepts one parameter");
				}

				node.type = tag.type;
				node.name = clean(tag.lines[0]);
				break;

			case "aliases":
			case "alias":
				tag.type = "aliases";

				if(clean(tag.lines).length > 1) {
					throw new Error("the " + tag.type + " tag only supports the use of a single line");
				}
				else if(clean(tag.lines)[0].split(" ").length > 1) {
					throw new Error("the " + tag.type + " tag only accepts one parameter");
				}

				node[tag.type].push(clean(tag.lines)[0]);
				break;

			case "links":
			case "see":
				tag.type = "links";

				if(clean(tag.lines).length > 1) {
					throw new Error("the " + tag.type + " tag only supports the use of a single line");
				}
				else if(clean(tag.lines)[0].split(" ").length > 1) {
					throw new Error("the " + tag.type + " tag only accepts one parameter");
				}

				node[tag.type].push(clean(tag.lines)[0]);
				break;

			case "fires":
			case "emits":
				tag.type = "emits";

				var event = clean(tag.lines)[0].split(" ")[0];

				if(event === undefined) {
					throw new Error("there was no valid event specified with the " + tag.type + " tag");
				}

				node.emits.push({
					event: event.substring(0, event.length), 
					description: style(clean(tag.lines).join(" ").replace(event, "").trim())
				});
				break;

			case "version":
			case "since":
			case "access":
			case "id":
				if(clean(tag.lines).length > 1) {
					throw new Error("the " + tag.type + " tag only supports the use of a single line");
				}
				else if(clean(tag.lines)[0].split(" ").length > 1) {
					throw new Error("the " + tag.type + " tag only accepts one parameter");
				}

				node[tag.type] = clean(tag.lines)[0];
				break;

			case "copyright":
			case "author":
			case "license":
			case "default":
			case "todo":
			case "summary":
				if(clean(tag.lines).length > 1) {
					throw new Error("the " + tag.type + " tag only supports the use of a single line");
				}

				node[tag.type] = style(clean(tag.lines)[0]);
				break;

			case "private":
			case "public":
			case "protected":
				if(clean(tag.lines).length > 1) {
					throw new Error("the " + tag.type + " tag only supports the use of a single line");
				}
				else if(clean(tag.lines)[0].split(" ").length > 0 && clean(tag.lines)[0] !== "") {
					throw new Error("the " + tag.type + " tag accepts no parameters");
				}

				node.access = tag.type;
				break;

			case "yields":
			case "generator":
			case "readonly":
			case "deprecated":
			case "nofunction":
			case "async":
			case "ignore":
			case "static":
			case "override":
				if(clean(tag.lines).length > 1) {
					throw new Error("the " + tag.type + " tag only supports the use of a single line");
				}

				node[tag.type] = true;
				break;

			case "date":
				if(clean(tag.lines).length > 1) {
					throw new Error("the " + tag.type + " tag only supports the use of a single line");
				}

				node[tag.type] = new Date(clean(tag.lines[0]));
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