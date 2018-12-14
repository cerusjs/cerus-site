function delay(func, time = 0) {
	setTimeout(func, time);
}

var sidebar = function() {
	var self = {};

	self.index = function() {
		location = "/";
	}

	self.toggle = function() {
		var sidebar = document.getElementsByClassName("sidebar")[0];
		var content = document.getElementsByClassName("content")[0];
		var overlay = document.getElementsByClassName("overlay")[0];

		if(sidebar === undefined || content === undefined || overlay === undefined) {
			throw new TypeError("there was a block that couldn't be found");
		}

		if(sidebar.className.endsWith("opened")) {
			sidebar.className = "sidebar closed";
			content.className = "content closed";

			overlay.className = "overlay closed";
			delay(() => overlay.style.display = "none", 300);
		}
		else {
			sidebar.className = "sidebar opened";
			content.className = "content opened";

			if(window.innerWidth < 720) {
				overlay.style.display = "block";
				delay(() => overlay.className = "overlay opened", 0);
			}
		}
	}

	self.item = function(name) {
		var item = document.getElementById(name + "-item");

		if(item === undefined) {
			throw new TypeError("the specified item wasn't found");
		}

		var button = item.getElementsByClassName("fas")[0];

		if(button === undefined) {
			throw new TypeError("there was a block that couldn't be found");
		}

		let items = document.getElementsByClassName("sidebar")[0].getElementsByClassName("item");

		console.log(items);

		Array.from(items).forEach(sidebar_item => {
			if(item === sidebar_item) {
				return;
			}

			let button = sidebar_item.getElementsByClassName("fas")[0];

			sidebar_item.className = "item closed";
			button.className = "fas fa-plus";
		});

		if(item.className.endsWith("closed")) {
			item.className = "item opened";
			button.className = "fas fa-minus";
		}
		else {
			item.className = "item closed";
			button.className = "fas fa-plus";
		}
	}

	return self;
}

var title_ = function(type, module) {
	var self = {};

	self.mail = function() {
		window.location.href = "mailto:cerusjs@gmail.com";
	}

	self.github = function() {
		window.open("https://github.com/cerusjs", '_blank').focus();
	}

	self.open = function(file) {
		window.location.href = "/views/" + module + "/" + type + "/" + file.value;
	}

	return self;
}

var source = function() {
	var line = document.getElementById(document.location.hash.substring(1));

	if(line === undefined) {
		throw new TypeError("the specified line couldn't be found");
	}

	line.className = "line selected";
}

var scroll = function() {

}

class scrollHelper {
	constructor() {
		this._element = document.getElementById("scrollTop");

		this._element.addEventListener("click", function() {
			this.scroll(0, 0);
		}.bind(this));

		window.addEventListener("scroll", function() {
			this.show();
		}.bind(this));
	}

	scroll(x, y) {
		assert("x", x, "number");
		assert("y", y, "number");

		window.scrollTo(x, y);
	}

	show() {
		if(window.innerWidth >= 1080) {
			return;
		}

		if(this._timeout) {
			clearTimeout(this._timeout);
		}

		if(window.scrollY <= 100) {
			this.hide();

			return;
		}

		this._element.className = "scroll visible";

		this._timeout = setTimeout(function() {
			this.hide();
		}.bind(this), 1500);
	}

	hide() {
		this._timeout = undefined;
		this._element.className = "scroll";
	}
}

var assert = function(name, value, expected) {
	if(typeof value !== expected) {
		throw new TypeError("the argument " + name + " must be a " + expected);
	}
}

if(window.innerWidth >= 1080) {
	sidebar().toggle();
}

if(document.location.pathname.split("/")[3] === "source") {
	source();
}

new scrollHelper();