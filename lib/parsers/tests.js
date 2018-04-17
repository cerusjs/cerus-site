module.exports = function(path, folder) {
	var child = require("child_process");
	var stdout;
	var data = {};
	
	try {
		stdout = child.execSync(path + "/node_modules/.bin/mocha --reporter json " + path + "/" + folder + "/");
	}
	catch(e) {
		stdout = e.stdout;
	}

	var json = JSON.parse(stdout);

	var stats = {};
	stats.tests = json.stats.suites;
	stats.passes = json.stats.passes;
	stats.failures = json.stats.failures;
	stats.duration = json.stats.duration;
	stats.start = json.stats.start;
	stats.end = json.stats.end;
	data.stats = stats;

	console.log("tests:");
	console.log("  passes: " + stats.passes);
	console.log("  failures: " + stats.failures);
	console.log("  duration: " + stats.duration);

	var tests = [];
	var tests_ = json.tests;

	for(var i = 0; i < tests_.length; i++) {
		var test_ = tests_[i];
		var test = {};
		var words = test_.fullTitle.split(" ");
		var path = "";
		var start = 0;

		for(var j = 0; j < words.length; j++) {
			if(j === 0 || words[j].startsWith("#") || words[j] === "constructor") {
				path += words[j].replace("#", "").trim() + ".";
			}
			else {
				start = test_.fullTitle.indexOf(words[j]);
				break;
			}
		}

		if(path.length > 0) {
			path = path.substring(0, path.length - 1);
		}

		test.path = path;
		test.function = path.split(".")[path.split(".").length - 1];
		test.class = path.indexOf(".") > 0 ? test.path.replace("." + test.function, "") : "";
		test.action = test_.title;
		test.context = test_.fullTitle.substring(start, test_.fullTitle.length).replace(test_.title, "").trim();
		test.duration = test_.duration;
		test.retries = test_.currentRetry;

		if(test_.err !== undefined && Object.keys(test_.err).length > 0) {
			var error = {};

			error.message = test_.err.message;
			error.actual = test_.err.actual;

			var stack = [];
			var stack_ = test_.err.stack.split("\n");

			for(var j = 0; j < stack_.length; j++) {
				if(j !== 0) {
					stack.push(stack_[j].substring(stack_[j].indexOf("(") + 1, stack_[j].indexOf(")")).trim());
				}
			}

			error.stack = stack;
			test.error = error;
			test.state = "passed";
		}
		else {
			test.error = undefined;
			test.state = "failed";
		}

		tests.push(test);
	}

	data.tests = tests;

	return data;
}