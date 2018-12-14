const assert = require("assert");
const markdown = require("./markdown");

class node {
	constructor(node_data, module_name) {
		this.data = {
			access: "public",
			aliases: [],
			async: false,
			author: undefined,
			copyright: undefined,
			date: undefined,
			default: undefined,
			deprecated: false,
			depth: node_data.depth,
			description: undefined,
			emits: [], // {event, description}
			examples: [],
			file: node_data.file,
			generator: false,
			id: undefined,
			ignore: false,
			license: undefined,
			line: node_data.line,
			lines: node_data.lines,
			links: [],
			name: undefined,
			nofunction: false,
			module: module_name,
			override: undefined,
			params: [], // {type, name, description, optional, array, child, default}
			readonly: false,
			return: {type: undefined, description: undefined},
			since: undefined,
			size: node_data.lines.join("\n").length,
			static: false,
			summary: undefined,
			throws: [], // {type, description}
			todo: undefined,
			type: "function",
			version: undefined,
			words: node_data.lines.join(" ").split(" ").length,
			yields: false
		};
		this.node_data = node_data;
		this.module_name = module_name;
		this.tags = [];

		this.parse();
	}

	parse() {
		let current_tag;

		this.node_data.lines.forEach((line, index) => {
			if(line.startsWith("@")) {
				if(current_tag) {
					this.tags.push(current_tag);
				}

				current_tag = new tag(this);
			}
			else if(index === 0) {
				current_tag = new tag(this, "desc");
			}

			current_tag.add_line(line);
		});

		this.tags.push(current_tag);
		this.tags.forEach(tag => tag.parse());
	}

	get_tag_type(line) {
		var _line = line.substring(1, line.length);

		if(_line.startsWith("@")) {
			return this.get_tag_type(_line);
		}

		var tag_type = _line.split(" ")[0];

		if(tag_type === undefined) {
			throw new Error("a tag cannot be nameless");
		}

		return tag_type.toLowerCase();
	}
}

module.exports = node;

const tag_handlers = {
	desc: function() {
		this.description(...arguments);
	},
	description: function(lines, tag, node) {
		node.description = tag.style(tag.clean(lines).join(" "), {markdown: true});
	},
	example: function(lines, tag, node, type) {
		let _lines = tag.clean(lines);

		if(_lines.length <= 0) {
			throw new Error("the " + type + " tag requires at least a single line");
		}

		node.examples.push(tag.style(_lines.join("\n"), {script: true, links: false}));
	},
	return: function() {
		this.returns(...arguments);
	},
	returns: function(lines, tag, node, type) {
		let returns = {};
		let _lines = tag.clean(lines);

		assert.ok(_lines.length > 0, "the " + type + " tag requires at least a single line");

		let _type = lines[0].split(" ")[0];

		assert.ok(_type.startsWith("{") && _type.endsWith("}"), "there was no valid type specified for the " + type + " tag");

		returns.type = _type.substring(1, _type.length - 1).trim();

		if(returns.type.indexOf("|") >= 0) {
			returns.type = returns.type.split("|");

			for(let i = 0; i < returns.type.length; i++) {
				returns.type[i] = returns.type[i].trim();
			}
		}

		returns.description = tag.style(_lines.join(" ").replace(_type, "").trim());
		node.return = returns;
	},
	param: function() {
		this.argument(...arguments);
	},
	parameter: function() {
		this.argument(...arguments);
	},
	arg: function() {
		this.argument(...arguments);
	},
	argument: function(lines, tag, node, type) {
		let param = {};
		let _lines = tag.clean(lines);
		let line = _lines[0];

		assert.ok(_lines.length > 0, "the " + type + " tag requires at least a single line");
		
		let _type = line.substring(0, line.indexOf("}") + 1);

		assert.ok(_type.startsWith("{") && _type.endsWith("}"), "there was no valid type specified for the " + type + " tag");

		param.type = _type.substring(1, _type.length - 1).trim();

		if(param.type.indexOf("|") >= 0) {
			param.type = type.split("|");

			for(let i = 0; i < param.type.length; i++) {
				param.type[i] = param.type[i].trim();
			}
		}

		line = line.replace(_type, "").trim();

		if(line.startsWith("(")) {
			let inner = line.substring(1, line.indexOf(")"));
			let has_default = inner.indexOf("=") >= 0;

			param.name = inner.substring(0, has_default ? inner.indexOf("=") : inner.length).trim();
			param.default = has_default ? inner.substring(inner.indexOf("=") + 1, inner.length).trim() : undefined;
			param.optional = true;

			assert.ok(param.name.length > 0, "there is now valid name specified for the " + type + " tag");
			assert.ok(param.default === undefined || param.default.length > 0, "there is now valid default value specified for the " + type + " tag");

			line = line.replace(`(${inner})`, "");
		}
		else {
			param.name = line.split(" ")[0];
			param.optional = false;

			assert.ok(param.name.length > 0, "there is now valid name specified for the " + type + " tag");

			line = line.replace(param.name, "");
		}

		if(param.name.indexOf(".") >= 0) {
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

		_lines[0] = line;

		param.description = tag.style(_lines.join(" "));
		node.params.push(param);
	},
	throws: function(lines, tag, node, type) {
		let _lines = tag.clean(lines);
		let throws = {};
		
		assert.ok(_lines.length > 0, "the " + type + " tag requires at least a single line");
		
		var _type = _lines[0].split(" ")[0];

		assert.ok(_type.startsWith("{") && _type.endsWith("}"), "there was no valid type specified for the " + type + " tag");

		throws.type = _type.substring(1, _type.length - 1);
		throws.description = tag.style(_lines.join(" ").replace(_type, ""));
		node.throws.push(throws);
	},
	type: function(lines, tag, node, type) {
		let _lines = tag.clean(lines);

		assert.ok(_lines.length === 1, "the " + type + " tag only supports the use of a single line");
		assert.ok(_lines[0].indexOf(" ") === -1, "the " + type + " tag only accepts one parameter");

		node.type = _lines[0].trim().toLowerCase();
	},
	variable: (lines, tag, node) => {
		this.var(lines, tag, node, "var");
	},
	function: function() {
		this.var(...arguments);
	},
	class: function() {
		this.var(...arguments);
	},
	var: function(lines, tag, node, type) {
		let _lines = tag.clean(lines);

		assert.ok(_lines.length === 1, "the " + type + " tag only supports the use of a single line");
		assert.ok(_lines[0].indexOf(" ") === -1, "the " + type + " tag only accepts one parameter");

		node.type = type;
		node.name = _lines[0].trim();
	},
	see: function(lines, tag, node) {
		this.aliases(lines, tag, node, "links");
	},
	links: function(lines, tag, node) {
		this.aliases(lines, tag, node, "links");
	},
	alias: function(lines, tag, node) {
		this.aliases(lines, tag, node, "aliases");
	},
	aliases: function(lines, tag, node, type) {
		let _lines = tag.clean(lines);

		assert.ok(_lines.length === 1, "the " + type + " tag only supports the use of a single line");
		assert.ok(_lines[0].indexOf(" ") === -1, "the " + type + " tag only accepts one parameter");

		node[type].push(_lines[0].trim());
	},
	fires: function() {
		this.emits(...arguments);
	},
	emits: function(lines, tag, node, type) {
		let _lines = tag.clean(lines);
		let emits = {};
		emits.event = _lines[0].split(" ")[0];

		assert.ok(emits.event.length > 0, "there was no valid event specified with the " + type + " tag");

		emits.description = tag.style(_lines.join(" ").replace(emits.event, "").trim());
		node.emits.push(emits);
	},
	version: function() {
		this.id(...arguments);
	},
	since: function() {
		this.id(...arguments);
	},
	access:function() {
		this.id(...arguments);
	},
	id: function(lines, tag, node, type) {
		let _lines = tag.clean(lines);

		assert.ok(_lines.length === 1, "the " + type + " tag only supports the use of a single line");
		assert.ok(_lines[0].indexOf(" ") === -1, "the " + type + " tag only accepts one parameter");

		node[type] = _lines[0].trim();
	},
	copyright: function() {
		this.summary(...arguments);
	},
	author: function() {
		this.summary(...arguments);
	},
	license: function() {
		this.summary(...arguments);
	},
	default: function() {
		this.summary(...arguments);
	},
	todo: function() {
		this.summary(...arguments);
	},
	summary: function(lines, tag, node, type) {
		let _lines = tag.clean(lines);

		assert.ok(_lines.length === 1, "the " + type + " tag only supports the use of a single line");

		node[type] = tag.style(_lines[0].trim());
	},
	private: function() {
		this.protected(...arguments);
	},
	public: function() {
		this.protected(...arguments);
	},
	protected: function(lines, tag, node, type) {
		let _lines = tag.clean(lines);
		
		assert.ok(_lines.length === 0, "the " + type + " tag only supports the use of a single line");

		node.access = type;
	},
	yields: function() {
		this.override(...arguments);
	},
	generator: function() {
		this.override(...arguments);
	},
	readonly: function() {
		this.override(...arguments);
	},
	deprecated: function() {
		this.override(...arguments);
	},
	nofunction: function() {
		this.override(...arguments);
	},
	async: function() {
		this.override(...arguments);
	},
	ignore: function() {
		this.override(...arguments);
	},
	static: function() {
		this.override(...arguments);
	},
	override: function(lines, tag, node, type) {
		let _lines = tag.clean(lines);
		
		assert.ok(_lines.length === 0, "the " + type + " tag only supports the use of a single line");

		node[type] = true;
	},
	date: function(lines, tag, node, type) {
		let _lines = tag.clean(lines);

		assert.ok(_lines.length === 1, "the " + type + " tag only supports the use of a single line");
		
		node.date = new Date(_lines);
	}
};

class tag {
	constructor(node, type) {
		this.lines = [];
		this.raw_lines = [];
		this.node = node;
		this.type = type;
	}

	add_line(line) {
		this.raw_lines.push(line);
		this.lines.push(line);
	}

	parse() {
		this.clean_lines();

		let type = this.type || this.get_type();

		if(tag_handlers[type] === undefined) {
			throw new Error("the tag: " + type + " is unknown");
		}

		this.lines[0] = this.lines[0].replace(type, "").trim();

		try {
			tag_handlers[type].bind(tag_handlers)(this.lines, this, this.node.data, type);
		} 
		catch(e) {
			let path = require("path").resolve(this.node.node_data.root, this.node.node_data.file);
			
			console.error(`${path}:${this.node.node_data.line}`);
			console.error(this.raw_lines.map(line => `\t${line}`).join("\n"));
			console.error("\t ^");
			console.error();
			console.error(e.stack);
		}
	}

	get_type(line = this.lines[0]) {
		var type = line.split(" ")[0];

		if(type === undefined) {
			throw new Error("a tag cannot be typeless");
		}

		return type.toLowerCase();
	}

	clean_lines(line = this.lines[0]) {
		if(line.startsWith("@")) {
			this.clean_lines(line.substring(1, line.length));
		}
		else {
			this.lines[0] = line;
		}
	}

	clean(data) {
		let _data = data.slice(0);

		for(var i = 0; i < _data.length; i++) {
			if(_data[i] === undefined || _data[i].trim() === "") {
				_data.splice(i, 1);
			}
		}

		return _data;
	}

	style(data, options) {
		var _options = Object.assign({}, {
			markdown: false,
			links: true,
			script: false
		}, options);

		if(_options["script"]) {
			data = this.style_script(data);
		}
		else if(_options["markdown"]) {
			data = this.style_markdown(data);
		}

		if(_options["links"]) {
			data = this.style_links(data);
		}

		return data;
	}

	style_script(data) {
		return markdown("```javascript\n" + data + "\n```");
	}

	style_markdown(data) {
		return markdown(data);
	}

	style_links(data) {
		let inline_tags = [];
		let words = data.split(" ");
		let current_inline_tag;

		words.forEach(word => {
			if(word.startsWith("{@")) {
				current_inline_tag = new inline_tag(this.node);
			}
			else if(current_inline_tag !== undefined && word.endsWith("}")) {
				current_inline_tag.add_word(word);
				inline_tags.push(current_inline_tag);

				current_inline_tag = undefined;
			}
			
			if(current_inline_tag !== undefined) {
				current_inline_tag.add_word(word);
			}
		});

		inline_tags.forEach(inline_tag => {
			data = data.replace(`${inline_tag.raw_words.join(" ")}`, inline_tag.parse());
		});

		return data;
	}
}

const inline_tag_handlers = {
	link: function(words, inline_tag) {
		let path = words[0];
		let module;
		let _class;
		let _function;
		let name;

		if(path.indexOf("#") >= 0) {
			module = path.substring(0, path.indexOf("#"));
			path = path.replace(module + "#", "");
		}

		if(path.lastIndexOf(".") < 0) {
			_class = path;
		}
		else {
			_class = path.substring(0, path.lastIndexOf("."));
			_function = path.substring(path.lastIndexOf(".") + 1, path.length);
		}

		if(_function === "constructor") {
			_function = undefined;
			words[0] = words[0].replace(".constructor", "");
		}

		if(words.length > 1) {
			name = words.slice(1).join(" ");
		}

		return `<a href="/views/${module || inline_tag.node.module_name}/reference/${_class}.html${_function !== undefined ? "#" + _function : ""}">${name || words[0]}</a>`;
	},
	tutorial: function(words, inline_tag) {
		let name;

		if(words.length > 1) {
			name = words.slice(1).join(" ");
		}

		return `<a href="/views/${link.module || inline_tag.node.module_name}/tutorials/${link.path}.html">${name || words[0]}</a>`;
	}
};

class inline_tag {
	constructor(node) {
		this.raw_words = [];
		this.words = [];
		this.node = node;
	}

	add_word(word) {
		this.raw_words.push(word);
		this.words.push(word);
	}

	parse() {
		this.clean();

		let type = this.get_type();

		if(inline_tag_handlers[type] === undefined) {
			throw new Error("the inline tag " + type + " is unknown");
		}

		return inline_tag_handlers[type](this.words.slice(1), this, type);
	}

	get_type() {
		var type = this.words[0];

		if(type === undefined) {
			throw new Error("a tag cannot be typeless");
		}

		return type.toLowerCase();
	}

	clean() {
		this.clean_start();
		this.clean_end();
	}

	clean_start(word = this.words[0]) {
		if(word === "{@") {
			this.words.shift();
		}
		else if(word.startsWith("{@")) {
			this.clean_start(word.substring(2, word.length));
		}
		else if(word.endsWith("@")) {
			this.clean_start(word.substring(1, word.length));
		}
		else {
			this.words[0] = word;
		}
	}

	clean_end(word = this.words[this.words.length - 1]) {
		if(word === "}") {
			this.words.pop();
		}
		else if(word.endsWith("}")) {
			this.clean_end(word.substring(0, word.length - 1));
		}
		else {
			this.words[this.words.length - 1] = word;
		}
	}
}