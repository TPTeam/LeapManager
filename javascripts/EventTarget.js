/**
 * @preserve Copyright 2013 mrDOob. https://github.com/mrdoob/eventtarget.js/
 *           THankS mr DOob!
 */
EventTarget = function() {

	/*
	 * event = { type: 'eventName', content : data }
	 */

	var listeners = {};

	/**
	 * {function(string, function)}
	 */
	this.addEventListener = this.on = function(type, listener) {

		if (listeners[type] === undefined) {

			listeners[type] = [];

		}

		if (listeners[type].indexOf(listener) === -1) {

			listeners[type].push(listener);
		}

	};

	this.dispatchEvent = this.emit = function(event) {

		for ( var listener in listeners[event.type]) {

			listeners[event.type][listener](event);

		}

	};

	this.removeEventListener = this.off = function(type, listener) {

		var index = listeners[type].indexOf(listener);

		if (index !== -1) {

			listeners[type].splice(index, 1);

		}

	};

};
