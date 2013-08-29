# ngTest


less boilerplatey more declarativy Karma + Jasmine tests for your angular.js code.

ngTest does code generation of Angular specific Jasmine tests per the following spec.

## Defining tests
ngTest(spec, debug) takes an object that defines a series of Jasmine tests, and an optional debug boolean.

To define the initial 'describe' function provide a string key for the description
the value can be a traditional describe function.

	ngTest({
		"This is my describe block": function() {
			// just your standard describe function here
		}
	})

The value can also be an array of the following values all of which
all optional and can be used multiple times:

### Strings
Strings define either angular modules to load or dependencies to inject.
The difference is determined by the convention of dependencies having the fully qualified angular name with suffix.
e.g. 'momentFormatFilter' instead of just 'momentFormat'

### Anonymous Functions
The first will become a beforeEach,
the second will become an afterEach. If you need more than that or want something more self-documenting see Named Functions below.

### Named Functions
Use 'before' or 'after' as the prefix for the function name.
This allows for multiple and self documenting
beforeEach and afterEach functions if you want to have multiple.

### Object:
A nested 'describe' or 'it' function.
The difference is determined by the convention of 'it' function keys starting with 'should'
There are no changes to the 'it' function, provide your standard tests here.

## Example
	ngTest({"Filters: common filters": ["myApp", "filters", {

		"Filter: momentFormat": ["momentFormatFilter",{
			"should convert a date string to a formatted date string": function() {
				expect(momentFormatFilter("Tue Aug 27 2013 14:04:12 GMT-0500 (CDT)", "MM/DD/YY")).toBe("08/27/13");
			}
		}],

		"Filter: momentAgo": ["momentAgoFilter", {
			"should convert a date string to an ago string": function() {
				expect(momentAgoFilter("Tue Aug 27 2013 14:04:12 GMT-0500 (CDT)", "MM/DD/YY")).toEndWith(" ago");
			}
		}]

	}]});

If you provide the debug boolean in the above example it will log the generated code which looks like this:

	describe("Filters: common filters", function() {

		beforeEach(function() {
			module('myApp');
			module('filters');
		});

		describe("Filter: momentFormat", function() {

			var momentFormatFilter;
			beforeEach(inject(function(_momentFormatFilter_) {
				momentFormatFilter = _momentFormatFilter_;
			}));

			it("should convert a date string to a formatted date string", function() {
				expect(momentFormatFilter("Tue Aug 27 2013 14:04:12 GMT-0500 (CDT)", "MM/DD/YY")).toBe("08/27/13");
			});

		});

		describe("Filter: momentAgo", function() {

			var momentAgoFilter;
			beforeEach(inject(function(_momentAgoFilter_) {
				momentAgoFilter = _momentAgoFilter_;
			}));

			it("should convert a date string to an ago string", function() {
				expect(momentAgoFilter("Tue Aug 27 2013 14:04:12 GMT-0500 (CDT)", "MM/DD/YY")).toEndWith(" ago");
			});

		});

	});
