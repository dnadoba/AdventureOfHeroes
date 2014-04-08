test("precondition exists", 4, function() {
	ok(its !== void 0);
	ok(its.defined !== void 0);
	ok(its.range !== void 0);
	ok(its.type !== void 0);
});

test("is", 7, function() {
	var testMessage = "Test Message";
	var testTemplate = "Test %s, %s.";
	var testTemplateArg1 = "one";
	var testTemplateArg2 = "two";
	var testTemplateRendered = "Test one, two.";

	ok(its(1 === 1) === true);

	try{
		its(1 !== 1);
	} catch(e){
		ok(e instanceof Error, "Error is not an instance of Error");
	}

	try{
		its(1 !== 1, TypeError);
	} catch(e){
		ok(e instanceof TypeError, "Error is not an instance of custom error type");
	}

	try{
		its(1 !== 1, TypeError, testMessage);
	} catch(e){
		ok(e instanceof TypeError, "Error is not an instance of custom error type");
		ok(e.message === testMessage, "Message is incorrect");
	}

	try{
		its(1 !== 1, TypeError, testTemplate, testTemplateArg1, testTemplateArg2);
	} catch(e){
		ok(e instanceof TypeError, "Error is not an instance of custom error type");
		ok(e.message === testTemplateRendered, "Templated message is incorrect");
	}
});

test("its.defined", 6, function() {
	var testMessage = "Test Message";
	var testTemplate = "Test %s, %s.";
	var testTemplateArg1 = "one";
	var testTemplateArg2 = "two";
	var testTemplateRendered = "Test one, two.";

	ok(its.defined(false) === false);

	try{
		its.defined(void 0);
	} catch(e){
		ok(e instanceof ReferenceError, "Error is not an instance of ReferenceError");
	}

	try{
		its.defined(void 0, testMessage);
	} catch(e){
		ok(e instanceof ReferenceError, "Error is not an instance of ReferenceError");
		ok(e.message === testMessage, "Message is incorrect");
	}

	try{
		its.defined(void 0, testTemplate, testTemplateArg1, testTemplateArg2);
	} catch(e){
		ok(e instanceof ReferenceError, "Error is not an instance of ReferenceError");
		ok(e.message === testTemplateRendered, "Templated message is incorrect");
	}
});

test("its.type", function() {
	var testMessage = "Test Message";
	var testTemplate = "Test %s, %s.";
	var testTemplateArg1 = "one";
	var testTemplateArg2 = "two";
	var testTemplateRendered = "Test one, two.";

	ok(its.type(typeof "something" === "string") === true, "Manual type test - positive");

	try{ its.type(typeof "something" === "number");}
	catch(e) {ok(e instanceof TypeError, "Manual type test - negative");}

	try{
		its.type(typeof "something" === "number", testMessage);
	} catch(e){
		ok(e instanceof TypeError, "Error is not an instance of TypeError");
		ok(e.message === testMessage, "Message is incorrect");
	}

	try{
		its.type(typeof "something" === "number", testTemplate, testTemplateArg1, testTemplateArg2);
	} catch(e){
		ok(e instanceof TypeError, "Error is not an instance of TypeError");
		ok(e.message === testTemplateRendered, "Templated message is incorrect");
	}

	// HELPERS

	// its.undefined
	try{ its.undefined(null);}
	catch(e){ ok(e instanceof TypeError, "Error is not an instance of TypeError");}
	
	its.undefined(void 0);

	// its.null
	try{ its.null(void 0);}
	catch(e){ ok(e instanceof TypeError, "Error is not an instance of TypeError");}

	its.null(null);

	// its.boolean
	try{ its.boolean(0);}
	catch(e){ ok(e instanceof TypeError, "Error is not an instance of TypeError");}

	its.boolean(true);
	its.boolean(false);
	its.boolean(new Boolean());

	// its.array
	try{ its.array({});}
	catch(e){ ok(e instanceof TypeError, "Error is not an instance of TypeError");}

	try{ (function(){its.array(arguments);}(1,2,3))}
	catch(e){ ok(e instanceof TypeError, "Error is not an instance of TypeError");}
	
	its.array([]);

	// its.object
	try{	its.object(1);}
	catch(e){ ok(e instanceof TypeError, "Error is not an instance of TypeError");}

	try{its.object();}
	catch(e){ ok(e instanceof TypeError, "Error is not an instance of TypeError");}

	its.object({});
	its.object([]);
	its.object(new Date);
	its.object(function(){});

	// its.args
	try{ its.args({});}
	catch(e){ ok(e instanceof TypeError, "Error is not an instance of TypeError");}

	its.args((function(){return arguments}()));

	// its.function
	try{ its.func({});}
	catch(e){ ok(e instanceof TypeError, "Error is not an instance of TypeError");}

	its.func(function(){});

	// its.string
	try{ its.string(1);}
	catch(e){ ok(e instanceof TypeError, "Error is not an instance of TypeError");}

	its.string("");

	// its.number
	try{ its.number("1");}
	catch(e){ ok(e instanceof TypeError, "Error is not an instance of TypeError");}

	its.number(1);
	its.number(Infinity);
	its.number(NaN);

	// its.date
	try{ its.date(1);}
	catch(e){ ok(e instanceof TypeError, "Error is not an instance of TypeError");}

	its.date(new Date);

	// its.regexp
	try{ its.regexp("");}
	catch(e){ ok(e instanceof TypeError, "Error is not an instance of TypeError");}

	its.regexp(/./);
	its.regexp(new RegExp("."));
});


test("its.range", 6, function() {
	var testMessage = "Test Message";
	var testTemplate = "Test %s, %s.";
	var testTemplateArg1 = "one";
	var testTemplateArg2 = "two";
	var testTemplateRendered = "Test one, two.";

	ok(its.range(1 > 0) === true);

	try{
		its.range(1 < 0);
	} catch(e){
		ok(e instanceof RangeError, "Error is not an instance of RangeError");
	}

	try{
		its.range(1 < 0, testMessage);
	} catch(e){
		ok(e instanceof RangeError, "Error is not an instance of RangeError");
		ok(e.message === testMessage, "Message is incorrect");
	}

	try{
		its.range(1 < 0, testTemplate, testTemplateArg1, testTemplateArg2);
	} catch(e){
		ok(e instanceof RangeError, "Error is not an instance of RangeError");
		ok(e.message === testTemplateRendered, "Templated message is incorrect");
	}
});