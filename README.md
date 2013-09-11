# ngTest


less boilerplatey more declarativy Karma + Jasmine tests for your angular.js code.

## Use It
just load ngTest.js in your karma tests and call the ngTest global function.

ngTest does code generation of Angular specific Jasmine tests per the following spec.

## Defining tests
ngTest(spec, debug) takes an object that defines a series of Jasmine tests, and an optional debug boolean.

To define the initial 'describe' function provide a string key for the description.
The value can be a traditional describe function.

```JavaScript
ngTest({
	"This is my describe block": function() {
		// just your standard describe function here
	}
});
```

The value can also be an array of the following values all of which
are optional and can be used multiple times:

### Strings
Strings define either angular modules to load or dependencies to inject.
The difference is determined by the convention of appending ":" to module names e.g. "myApp:"
Also remember to use the fully qualified angular name for dependencies
e.g. 'momentFormatFilter' instead of just 'momentFormat'


```JavaScript
ngTest({"Testing my Module": ["myModule:", "myDependency", {
	"should work": function() {
		// put expect code here
	}}]
});
```


Here's an example showing how modules that have the same name as a dependency can be handled with the '+' suffix.
In this case the 'titleService:+' will cause the titleService module to be loaded and will inject the titleService dependency.
When using the '+' suffix the ':' is optional but I find it more readable with both.

```JavaScript
ngTest({
	"titleService": ["titleService:+", "$document", {

		"should set a title without a suffix": function() {
			var title = "new title";
			titleService.setTitle(title);
			return expect(titleService.getTitle()).toEqual(title);
		},

		"should allow specification of a suffix": function() {
			var suffix = " :: new suffix";
			titleService.setSuffix(suffix);
			return expect(titleService.getSuffix()).toEqual(suffix);
		},

		"should set the title, including the suffix": function() {
			var title = "New Title",
				suffix = " :: new suffix";

			titleService.setSuffix(suffix);
			titleService.setTitle(title);

			return expect(titleService.getTitle()).toEqual(title + suffix);
		}
	}]
});
```

The generated Code looks like this

```JavaScript
describe('titleService', function () {

	beforeEach(function () {
		module('titleService');
	});

	var titleService, $document;
	beforeEach(inject(function (_titleService_, _$document_) {
		titleService = _titleService_;
		$document = _$document_;
	}));

	it('should set a title without a suffix', function () {
		var title = "new title";
		titleService.setTitle(title);
		return expect(titleService.getTitle()).toEqual(title);
	});

	it('should allow specification of a suffix', function () {
		var suffix = " :: new suffix";
		titleService.setSuffix(suffix);
		return expect(titleService.getSuffix()).toEqual(suffix);
	});

	it('should set the title, including the suffix', function () {
		var title = "New Title",
			suffix = " :: new suffix";

		titleService.setSuffix(suffix);
		titleService.setTitle(title);

		return expect(titleService.getTitle()).toEqual(title + suffix);
	});

});
```


### Anonymous Functions
The first will become a beforeEach,
the second will become an afterEach. If you need more than that or want something more self-documenting see Named Functions below.

```JavaScript
ngTest({"Testing my Module": ["myModule:", "myDependency",
	function() {
		// do before each
	},
	function() {
		// do after each
	}, {
		"should work": function() {
			// put expect code here
		}
	}]
});
```



### Named Functions
Use 'before' or 'after' as the prefix for the function name.
This allows for multiple and self documenting
beforeEach and afterEach functions if you want to have multiple.

```JavaScript
ngTest({"Testing my Module": ["myModule:", "myDependency",
	function before() {
		// do before each
	},
	function beforeTwo() {
		// do before each
	},
	function after() {
		// do after each
	}, {
		"should work": function() {
			// put expect code here
		}
	}]
});
```

Named functions that are not prefixed with 'before' or 'after' get in-lined into the describe block and will be ready for use in your tests.

```JavaScript
ngTest({"Testing my Module": ["myModule:", "myDependency",
	function times2(n) {
		return n*2;
	}, {
		"should work": function() {
			expect(times2(5)).toBe(10);
		}
	}]
});
```

### Objects
A nested 'describe' or 'it' function.
The difference is determined by the convention of 'it' function keys starting with 'should'
There are no changes to the 'it' function, provide your standard tests here.

```JavaScript
ngTest({"Filters: common filters": ["myApp:", "filters:", {

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
```

If you provide the debug boolean in the above example it will log the generated code which looks like this:

```JavaScript
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
```


### compileWithScope util
ngTest also provides a handy util for testing directives to help
reduce the boilerplate for compiling a directive with a new scope.

Simply call the compileWithScope(spec) function where spec is an object with an 'html' string property
and a 'scope' property that is a plain old js object containing the values you would like on your scope.
If no scope object is provided the html will be compiled with a new scope that is empty.

Usage looks like this
```JavaScript
ngTest({"SimplePicker - Element directive for a basic skinnable widget": [
	"simplePicker:",
	"templates-common:",
	"filters:",
	{
		"Should create a picker widget": function() {
			var directive = compileWithScope({
				html: '<simple-picker id="myPicker" items="clients" selected-id="selectedId"/>',
				scope: {
					clients: [
						{id: 0, name: "test"},
						{id: 1, name: "test1"},
						{id: 2, name: "test2"}
					],
					selectedId: 1
				}
			});

			// compileWithScope returns an object with the following members
			dump(directive.el, directive.scope, directive.compiled);

			expect($(directive.el).attr("id")).toBe("myPicker");
			expect($("a.pickerSelection", directive.el).text()).toBe("test1");
			expect($("ul li", directive.el).length).toBe(3);
		}
	}
]});
```

Which will output the following code.

```JavaScript
describe('SimplePicker - Element directive for a basic skinnable widget', function () {

	beforeEach(function () {
		module('simplePicker');
		module('templates-common');
		module('filters');
	});

	var $compile, $rootScope;
	beforeEach(inject(function (_$compile_, _$rootScope_) {
		$compile = _$compile_;
		$rootScope = _$rootScope_;
	}));

	function compileWithScope(spec) {

		var ret = {};

		// create a scope
		ret.scope = $rootScope.$new();

		// copy provided scope vals to our new scope
		if (spec.scope) {
			angular.extend(ret.scope, spec.scope);
		}

		// get the jqLite or jQuery element
		ret.el = angular.element(spec.html);

		// compile the element into a function to
		// process the view.
		ret.compiled = $compile(ret.el);

		// run the compiled view.
		ret.compiled(ret.scope);

		// call digest on the scope!
		ret.scope.$digest();

		return ret;
	}

	it('Should create a picker widget', function () {
		var directive = compileWithScope({
			html: '<simple-picker id="myPicker" items="clients" selected-id="selectedId"/>',
			scope: {
				clients: [
					{id: 0, name: "test"},
					{id: 1, name: "test1"},
					{id: 2, name: "test2"}
				],
				selectedId: 1
			}
		});

		// compileWithScope returns an object with the following members
		dump(directive.el, directive.scope, directive.compiled);

		expect($(directive.el).attr("id")).toBe("myPicker");
		expect($("a.pickerSelection", directive.el).text()).toBe("test1");
		expect($("ul li", directive.el).length).toBe(3);
	});
});
```

