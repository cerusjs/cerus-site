module.exports = function(root, paths, module) {
	var files = [];
	var files_ = [];
	var fs = require("fs");

	function convert(path) {
		var paths = fs.readdirSync(root + "/" + path);

		for(var i = 0; i < paths.length; i++) {
			if(fs.lstatSync(root + "/" + path + "/" + paths[i]).isDirectory()) {
				convert(path + "/" + paths[i]);
			}
			else {
				files.push(path + "/" + paths[i]);
			}
		}
	}

	for(var i = 0; i < paths.length; i++) {
		if(fs.lstatSync(root + "/" + paths[i]).isDirectory()) {
			convert(paths[i]);
		}
		else {
			files.push(paths[i]);
		}
	}

	files.sort(function(a, b){
		if(a < b) {
			return -1;
		}
		else if(a > b) {
			return 1;
		}
		else {
			return 0;
		}
	});

	for(var i = 0; i < files.length; i++) {
		files_.push(require("./code")(root + "/" + files[i], module));
	}

	return files_;
}