/*
 * ngTest.js 0.1.1 08-29-2013
 * copyright (c) 2013 Andrew Luetgers
 * you are free to distribute ngTest.js under the MIT license
 * https://github.com/andrewluetgers/ngTest
 */

var ngTest = (function(scope) {

	function ngTest(obj, depth, debug) {

		var code = "";
		debug = debug || depth === true;
		depth = _.isNumber(depth) ? ++depth : 0;

		// parse the describe/test blocks
		_.each(obj, function(spec, des) {
			var type = isDescribe(des) ? "describe" : "it",
				describeMode = type == "describe";

			code +=						type + "('"+des+"', ";

			if (_.isFunction(spec)) {
				// we have a traditional describe or it function
				code += 				spec + ");";

			} else if (describeMode && _.isArray(spec)) {
				code += 				"function() {";

				// we have an array of possible actions depending on type
				// so lets compile lists of each then code-gen
				var deps = [],
					mods = [],
					before = [],
					after = [],
					tests = [];

				// compile phase --------------
				_.each(spec, function(val) {
					if (_.isString(val)) {
						// string = a module to load or dependencies to inject
						// lets compile them into lists and in either case we need a before each function
						// supports modules that have the same name as a dependency
						// e.g. titleService, we demarcate modules with a ':' suffix
						// we can indicate the module and the dependency via the prefix "+" or ":+"
						var name = val.replace(/\+$/, "");
						name = name.replace(/:$/, "");
						if (isModuleAndDep(val)) {
							deps.push(name);
							mods.push(name);
						} else {
							isModule(val) ? mods.push(name) : deps.push(name);
						}

					} else if (_.isFunction(val)) {
						// function = beforeEach or afterEach
						if (isBefore(val) || (!before.length && !isAfter(val))) {
							before.push(val);
						} else if (isAfter(val) || (!after.length && !isBefore(val))) {
							after.push(val);
						}

					} else if (_.isPlainObject(val)) {
						// objects = recur with depth
						tests.push(ngTest(val, depth, debug));
					}
				});

				debug && console.log(mods, deps, before, after, tests);

				// code gen phase --------------

				// load modules
				// will generating for something like this
				//	beforeEach(function() {
				//		module('clario');
				//		module('filters');
				//	});
				var modCode = "";
				if (mods.length) {
					modCode = 			"beforeEach(function() {";
					_.each(mods, function(mod) {
						modCode += 		"module('"+mod+"');";
					});
					code += 			modCode + "});";
				}


				// inject deps via closure ref
				// will generate something like this
				// 		var momentAgoFilter;
				//		beforeEach(inject(function(_momentAgoFilter_) {
				//			momentAgoFilter = _momentAgoFilter_;
				//		}));

				var depCode = "";
				if (deps.length) {
					code += 			"var "+ deps +";";
					var injectArgs = _.map(deps, function(d) {
						var dAlt = 		"_"+d+"_";
						depCode += 		d + " = " + dAlt + ";";
						return dAlt;
					});

					code += 			"beforeEach(inject(function("+injectArgs+") {";
					code += 			depCode + "}));";  // end inject code
				}

				// add our befores and afters
				_.each(before, function(fn) {
					code += 			"beforeEach(" + fn + ");";
				});

				_.each(after, function(fn) {
					code += 			"afterEach(" + fn + ");";
				});

				// add all the tests and nested describes
				_.each(tests, function(testCode) {
					code += 			testCode;
				});

				// all done bitches
				code += 				"});"; // end describe fn

			} else {
				console.log("Bad spec!", spec);
				throw new TypeError("expected array or function but saw " + typeof spec);
			}

		});

		if (depth === 0) {
			debug && console.log("final code", code, depth);
			var fn = new Function(code);
			fn.call(scope);
		} else {
			debug && console.log("returning code", code, depth);
			return code;
		}
	}

	function isTest(str) {
		return stringStartsWith(str.toLowerCase(), "should");
	}

	function isDescribe(str) {
		return !isTest(str);
	}

	function isModule(str) {
		return stringEndsWith(str, ":");
	}

	function isModuleAndDep(str) {
		return stringEndsWith(str, "+");
	}

	function isBefore(fn) {
		return stringStartsWith(fn + "", "function before");
	}

	function isAfter(fn) {
		return stringStartsWith(fn + "", "function after");
	}

	function stringStartsWith(haystack, needle) {
		return haystack.substr(0, needle.length) == needle;
	}

	function stringEndsWith(haystack, needle) {
		return haystack.substr(-needle.length) == needle;
	}

	return ngTest;

}(this));