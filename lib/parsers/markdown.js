module.exports = function(input) {
	if(typeof input !== "string") {
		throw new TypeError("input must be a string to be parsed");
	}

	var marked = require("marked");

	marked.setOptions({
		highlight: function(code, lang) {
			return require("highlight.js").highlight(lang, code).value;
		},
		langPrefix:'hljs '
	});
	
	return marked(input);
}