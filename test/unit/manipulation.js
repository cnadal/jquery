module("manipulation", { teardown: moduleTeardown });

// Ensure that an extended Array prototype doesn't break jQuery
Array.prototype.arrayProtoFn = function(arg) { throw("arrayProtoFn should not be called"); };

var manipulationBareObj = function(value) { return value; };
var manipulationFunctionReturningObj = function(value) { return (function() { return value; }); };


/*
	======== local reference =======
	manipulationBareObj and manipulationFunctionReturningObj can be used to test passing functions to setters
	See testVal below for an example

	bareObj( value );
		This function returns whatever value is passed in

	functionReturningObj( value );
		Returns a function that returns the value
*/

test("text()", function() {
	expect(5);
	var expected = "This link has class=\"blog\": Simon Willison's Weblog";
	equal( jQuery("#sap").text(), expected, "Check for merged text of more then one element." );

	// Check serialization of text values
	equal( jQuery(document.createTextNode("foo")).text(), "foo", "Text node was retreived from .text()." );
	notEqual( jQuery(document).text(), "", "Retrieving text for the document retrieves all text (#10724).");

	// Retrieve from document fragments #10864
	var frag = document.createDocumentFragment();
		frag.appendChild( document.createTextNode("foo") );

	equal( jQuery( frag ).text(), "foo", "Document Fragment Text node was retreived from .text().");

	var $newLineTest = jQuery("<div>test<br/>testy</div>").appendTo("#moretests");
	$newLineTest.find("br").replaceWith("\n");
	equal( $newLineTest.text(), "test\ntesty", "text() does not remove new lines (#11153)" );

	$newLineTest.remove();
});

test("text(undefined)", function() {
	expect(1);
	equal( jQuery("#foo").text("<div").text(undefined)[0].innerHTML, "&lt;div", ".text(undefined) is chainable (#5571)" );
});

var testText = function(valueObj) {
	expect(4);
	var val = valueObj("<div><b>Hello</b> cruel world!</div>");
	equal( jQuery("#foo").text(val)[0].innerHTML.replace(/>/g, "&gt;"), "&lt;div&gt;&lt;b&gt;Hello&lt;/b&gt; cruel world!&lt;/div&gt;", "Check escaped text" );

	// using contents will get comments regular, text, and comment nodes
	var j = jQuery("#nonnodes").contents();
	j.text(valueObj("hi!"));
	equal( jQuery(j[0]).text(), "hi!", "Check node,textnode,comment with text()" );
	equal( j[1].nodeValue, " there ", "Check node,textnode,comment with text()" );

	// Blackberry 4.6 doesn't maintain comments in the DOM
	equal( jQuery("#nonnodes")[0].childNodes.length < 3 ? 8 : j[2].nodeType, 8, "Check node,textnode,comment with text()" );
};

test("text(String)", function() {
	testText(manipulationBareObj);
});

test("text(Function)", function() {
	testText(manipulationFunctionReturningObj);
});

test("text(Function) with incoming value", function() {
	expect(2);

	var old = "This link has class=\"blog\": Simon Willison's Weblog";

	jQuery("#sap").text(function(i, val) {
		equal( val, old, "Make sure the incoming value is correct." );
		return "foobar";
	});

	equal( jQuery("#sap").text(), "foobar", "Check for merged text of more then one element." );

	QUnit.reset();
});

var testWrap = function(val) {
	expect(19);
	var defaultText = "Try them out:";
	var result = jQuery("#first").wrap(val( "<div class='red'><span></span></div>" )).text();
	equal( defaultText, result, "Check for wrapping of on-the-fly html" );
	ok( jQuery("#first").parent().parent().is(".red"), "Check if wrapper has class 'red'" );

	QUnit.reset();
	result = jQuery("#first").wrap(val( document.getElementById("empty") )).parent();
	ok( result.is("ol"), "Check for element wrapping" );
	equal( result.text(), defaultText, "Check for element wrapping" );

	QUnit.reset();
	jQuery("#check1").click(function() {
		var checkbox = this;
		ok( checkbox.checked, "Checkbox's state is erased after wrap() action, see #769" );
		jQuery(checkbox).wrap(val( "<div id='c1' style='display:none;'></div>" ));
		ok( checkbox.checked, "Checkbox's state is erased after wrap() action, see #769" );
	}).click();

	// using contents will get comments regular, text, and comment nodes
	var j = jQuery("#nonnodes").contents();
	j.wrap(val( "<i></i>" ));

	// Blackberry 4.6 doesn't maintain comments in the DOM
	equal( jQuery("#nonnodes > i").length, jQuery("#nonnodes")[0].childNodes.length, "Check node,textnode,comment wraps ok" );
	equal( jQuery("#nonnodes > i").text(), j.text(), "Check node,textnode,comment wraps doesn't hurt text" );

	// Try wrapping a disconnected node
	var cacheLength = 0;
	for (var i in jQuery.cache) {
		cacheLength++;
	}

	j = jQuery("<label/>").wrap(val( "<li/>" ));
	equal( j[0].nodeName.toUpperCase(), "LABEL", "Element is a label" );
	equal( j[0].parentNode.nodeName.toUpperCase(), "LI", "Element has been wrapped" );

	for (i in jQuery.cache) {
		cacheLength--;
	}
	equal(cacheLength, 0, "No memory leak in jQuery.cache (bug #7165)");

	// Wrap an element containing a text node
	j = jQuery("<span/>").wrap("<div>test</div>");
	equal( j[0].previousSibling.nodeType, 3, "Make sure the previous node is a text element" );
	equal( j[0].parentNode.nodeName.toUpperCase(), "DIV", "And that we're in the div element." );

	// Try to wrap an element with multiple elements (should fail)
	j = jQuery("<div><span></span></div>").children().wrap("<p></p><div></div>");
	equal( j[0].parentNode.parentNode.childNodes.length, 1, "There should only be one element wrapping." );
	equal( j.length, 1, "There should only be one element (no cloning)." );
	equal( j[0].parentNode.nodeName.toUpperCase(), "P", "The span should be in the paragraph." );

	// Wrap an element with a jQuery set
	j = jQuery("<span/>").wrap(jQuery("<div></div>"));
	equal( j[0].parentNode.nodeName.toLowerCase(), "div", "Wrapping works." );

	// Wrap an element with a jQuery set and event
	result = jQuery("<div></div>").click(function(){
		ok(true, "Event triggered.");

		// Remove handlers on detached elements
		result.unbind();
		jQuery(this).unbind();
	});

	j = jQuery("<span/>").wrap(result);
	equal( j[0].parentNode.nodeName.toLowerCase(), "div", "Wrapping works." );

	j.parent().trigger("click");

	// clean up attached elements
	QUnit.reset();
};

test("wrap(String|Element)", function() {
	testWrap(manipulationBareObj);
});

test("wrap(Function)", function() {
	testWrap(manipulationFunctionReturningObj);
});

test("wrap(Function) with index (#10177)", function() {
	var expectedIndex = 0,
			targets = jQuery("#qunit-fixture p");

	expect(targets.length);
	targets.wrap(function(i) {
		equal( i, expectedIndex, "Check if the provided index (" + i + ") is as expected (" + expectedIndex + ")" );
		expectedIndex++;

		return "<div id='wrap_index_'" + i + "'></div>";
	});
});

test("wrap(String) consecutive elements (#10177)", function() {
	var targets = jQuery("#qunit-fixture p");

	expect(targets.length * 2);
	targets.wrap("<div class='wrapper'></div>");

	targets.each(function() {
		var $this = jQuery(this);

		ok( $this.parent().is('.wrapper'), "Check each elements parent is correct (.wrapper)" );
		equal( $this.siblings().length, 0, "Each element should be wrapped individually" );
	});
});

var testWrapAll = function(val) {
	expect(8);
	var prev = jQuery("#firstp")[0].previousSibling;
	var p = jQuery("#firstp,#first")[0].parentNode;

	var result = jQuery("#firstp,#first").wrapAll(val( "<div class='red'><div class='tmp'></div></div>" ));
	equal( result.parent().length, 1, "Check for wrapping of on-the-fly html" );
	ok( jQuery("#first").parent().parent().is(".red"), "Check if wrapper has class 'red'" );
	ok( jQuery("#firstp").parent().parent().is(".red"), "Check if wrapper has class 'red'" );
	equal( jQuery("#first").parent().parent()[0].previousSibling, prev, "Correct Previous Sibling" );
	equal( jQuery("#first").parent().parent()[0].parentNode, p, "Correct Parent" );

	QUnit.reset();
	prev = jQuery("#firstp")[0].previousSibling;
	p = jQuery("#first")[0].parentNode;
	result = jQuery("#firstp,#first").wrapAll(val( document.getElementById("empty") ));
	equal( jQuery("#first").parent()[0], jQuery("#firstp").parent()[0], "Same Parent" );
	equal( jQuery("#first").parent()[0].previousSibling, prev, "Correct Previous Sibling" );
	equal( jQuery("#first").parent()[0].parentNode, p, "Correct Parent" );
};

test("wrapAll(String|Element)", function() {
	testWrapAll(manipulationBareObj);
});

var testWrapInner = function(val) {
	expect(11);
	var num = jQuery("#first").children().length;
	var result = jQuery("#first").wrapInner(val("<div class='red'><div id='tmp'></div></div>"));
	equal( jQuery("#first").children().length, 1, "Only one child" );
	ok( jQuery("#first").children().is(".red"), "Verify Right Element" );
	equal( jQuery("#first").children().children().children().length, num, "Verify Elements Intact" );

	QUnit.reset();
	num = jQuery("#first").html("foo<div>test</div><div>test2</div>").children().length;
	result = jQuery("#first").wrapInner(val("<div class='red'><div id='tmp'></div></div>"));
	equal( jQuery("#first").children().length, 1, "Only one child" );
	ok( jQuery("#first").children().is(".red"), "Verify Right Element" );
	equal( jQuery("#first").children().children().children().length, num, "Verify Elements Intact" );

	QUnit.reset();
	num = jQuery("#first").children().length;
	result = jQuery("#first").wrapInner(val(document.getElementById("empty")));
	equal( jQuery("#first").children().length, 1, "Only one child" );
	ok( jQuery("#first").children().is("#empty"), "Verify Right Element" );
	equal( jQuery("#first").children().children().length, num, "Verify Elements Intact" );

	var div = jQuery("<div/>");
	div.wrapInner(val("<span></span>"));
	equal(div.children().length, 1, "The contents were wrapped.");
	equal(div.children()[0].nodeName.toLowerCase(), "span", "A span was inserted.");
};

test("wrapInner(String|Element)", function() {
	testWrapInner(manipulationBareObj);
});

test("wrapInner(Function)", function() {
	testWrapInner(manipulationFunctionReturningObj);
});

test("unwrap()", function() {
	expect(9);

	jQuery("body").append("  <div id='unwrap' style='display: none;'> <div id='unwrap1'> <span class='unwrap'>a</span> <span class='unwrap'>b</span> </div> <div id='unwrap2'> <span class='unwrap'>c</span> <span class='unwrap'>d</span> </div> <div id='unwrap3'> <b><span class='unwrap unwrap3'>e</span></b> <b><span class='unwrap unwrap3'>f</span></b> </div> </div>");

	var abcd = jQuery("#unwrap1 > span, #unwrap2 > span").get(),
		abcdef = jQuery("#unwrap span").get();

	equal( jQuery("#unwrap1 span").add("#unwrap2 span:first").unwrap().length, 3, "make #unwrap1 and #unwrap2 go away" );
	deepEqual( jQuery("#unwrap > span").get(), abcd, "all four spans should still exist" );

	deepEqual( jQuery("#unwrap3 span").unwrap().get(), jQuery("#unwrap3 > span").get(), "make all b in #unwrap3 go away" );

	deepEqual( jQuery("#unwrap3 span").unwrap().get(), jQuery("#unwrap > span.unwrap3").get(), "make #unwrap3 go away" );

	deepEqual( jQuery("#unwrap").children().get(), abcdef, "#unwrap only contains 6 child spans" );

	deepEqual( jQuery("#unwrap > span").unwrap().get(), jQuery("body > span.unwrap").get(), "make the 6 spans become children of body" );

	deepEqual( jQuery("body > span.unwrap").unwrap().get(), jQuery("body > span.unwrap").get(), "can't unwrap children of body" );
	deepEqual( jQuery("body > span.unwrap").unwrap().get(), abcdef, "can't unwrap children of body" );

	deepEqual( jQuery("body > span.unwrap").get(), abcdef, "body contains 6 .unwrap child spans" );

	jQuery("body > span.unwrap").remove();
});

var getWrappedElement = function() {
	return jQuery("#sap");
};

var getWrappedDocumentFragment = function() {
	var f = document.createDocumentFragment();

	// copy contents of #sap into new fragment
	var clone = jQuery("#sap")[0].cloneNode(true);
	var childs = clone.childNodes;
	while (clone.childNodes.length) {
		f.appendChild(clone.childNodes[0]);
	}

	clone = null;
	return jQuery(f);
};

var testAppendForObject = function(valueObj, isFragment) {
	var expected = "This link has class=\"blog\": Simon Willison's WeblogTry them out:";
	var objType = " " + (isFragment ? "(DocumentFragment)" : "(Element)");
	var getObj = isFragment ? getWrappedDocumentFragment : getWrappedElement;

	var obj = getObj();
	obj.append(valueObj(document.getElementById("first")));
	equal( obj.text(), expected, "Check for appending of element" + objType);

	QUnit.reset();
	expected = "This link has class=\"blog\": Simon Willison's WeblogTry them out:Yahoo";
	obj = getObj();
	obj.append(valueObj([document.getElementById("first"), document.getElementById("yahoo")]));
	equal( obj.text(), expected, "Check for appending of array of elements" + objType );

	QUnit.reset();
	expected = "This link has class=\"blog\": Simon Willison's WeblogYahooTry them out:";
	obj = getObj();
	obj.append(valueObj(jQuery("#yahoo, #first")));
	equal( obj.text(), expected, "Check for appending of jQuery object" + objType );

	QUnit.reset();
	obj = getObj();
	obj.append(valueObj( 5 ));
	ok( obj.text().match( /5$/ ), "Check for appending a number" + objType );

	QUnit.reset();
	expected = "This link has class=\"blog\": Simon Willison's WeblogTry them out:GoogleYahoo";
	obj = getObj();
	obj.append( valueObj( [ jQuery("#first"), jQuery("#yahoo, #google") ] ) );
	equal( obj.text(), expected, "Check for appending of array of jQuery objects" );

	QUnit.reset();
	obj = getObj();
	obj.append(valueObj( " text with spaces " ));
	ok( obj.text().match(/ text with spaces $/), "Check for appending text with spaces" + objType );

	QUnit.reset();
	obj = getObj();
	ok( obj.append(valueObj( [] )), "Check for appending an empty array." + objType );
	ok( obj.append(valueObj( "" )), "Check for appending an empty string." + objType );
	ok( obj.append(valueObj( document.getElementsByTagName("foo") )), "Check for appending an empty nodelist." + objType );

	QUnit.reset();
	obj = getObj();
	obj.append(valueObj( document.getElementById("form") ));
	equal( obj.children("form").size(), 1, "Check for appending a form" + objType ); // Bug #910

	QUnit.reset();
	obj = getObj();

	var prev = obj.children().length;

	obj.append(
		"<span></span>",
		"<span></span>",
		"<span></span>"
	);

	equal( obj.children().length, prev + 3, "Make sure that multiple arguments works." + objType );
	QUnit.reset();
};

var testAppend = function(valueObj) {
	expect(58);
	testAppendForObject(valueObj, false);
	testAppendForObject(valueObj, true);

	var defaultText = "Try them out:";
	var result = jQuery("#first").append(valueObj("<b>buga</b>"));
	equal( result.text(), defaultText + "buga", "Check if text appending works" );
	equal( jQuery("#select3").append(valueObj("<option value='appendTest'>Append Test</option>")).find("option:last-child").attr("value"), "appendTest", "Appending html options to select element");

	QUnit.reset();
	jQuery("form").append(valueObj("<input name='radiotest' type='radio' checked='checked' />"));
	jQuery("form input[name=radiotest]").each(function(){
		ok( jQuery(this).is(":checked"), "Append checked radio");
	}).remove();

	QUnit.reset();
	jQuery("form").append(valueObj("<input name='radiotest' type='radio' checked    =   'checked' />"));
	jQuery("form input[name=radiotest]").each(function(){
		ok( jQuery(this).is(":checked"), "Append alternately formated checked radio");
	}).remove();

	QUnit.reset();
	jQuery("form").append(valueObj("<input name='radiotest' type='radio' checked />"));
	jQuery("form input[name=radiotest]").each(function(){
		ok( jQuery(this).is(":checked"), "Append HTML5-formated checked radio");
	}).remove();

	QUnit.reset();
	jQuery("form").append(valueObj("<input type='radio' checked='checked' name='radiotest' />"));
	jQuery("form input[name=radiotest]").each(function(){
		ok( jQuery(this).is(":checked"), "Append with name attribute after checked attribute");
	}).remove();

	QUnit.reset();
	var pass = true;
	try {
		var body = jQuery("#iframe")[0].contentWindow.document.body;

		pass = false;
		jQuery( body ).append(valueObj( "<div>test</div>" ));
		pass = true;
	} catch(e) {}

	ok( pass, "Test for appending a DOM node to the contents of an IFrame" );

	QUnit.reset();
	jQuery("<fieldset/>").appendTo("#form").append(valueObj( "<legend id='legend'>test</legend>" ));
	t( "Append legend", "#legend", ["legend"] );

	QUnit.reset();
	jQuery("#select1").append(valueObj( "<OPTION>Test</OPTION>" ));
	equal( jQuery("#select1 option:last").text(), "Test", "Appending &lt;OPTION&gt; (all caps)" );

	jQuery("#table").append(valueObj( "<colgroup></colgroup>" ));
	ok( jQuery("#table colgroup").length, "Append colgroup" );

	jQuery("#table colgroup").append(valueObj( "<col/>" ));
	ok( jQuery("#table colgroup col").length, "Append col" );

	QUnit.reset();
	jQuery("#table").append(valueObj( "<caption></caption>" ));
	ok( jQuery("#table caption").length, "Append caption" );

	QUnit.reset();
	jQuery("form:last")
		.append(valueObj( "<select id='appendSelect1'></select>" ))
		.append(valueObj( "<select id='appendSelect2'><option>Test</option></select>" ));

	t( "Append Select", "#appendSelect1, #appendSelect2", ["appendSelect1", "appendSelect2"] );

	equal( "Two nodes", jQuery("<div />").append("Two", " nodes").text(), "Appending two text nodes (#4011)" );

	// using contents will get comments regular, text, and comment nodes
	var j = jQuery("#nonnodes").contents();
	var d = jQuery("<div/>").appendTo("#nonnodes").append(j);
	equal( jQuery("#nonnodes").length, 1, "Check node,textnode,comment append moved leaving just the div" );
	ok( d.contents().length >= 2, "Check node,textnode,comment append works" );
	d.contents().appendTo("#nonnodes");
	d.remove();
	ok( jQuery("#nonnodes").contents().length >= 2, "Check node,textnode,comment append cleanup worked" );

	QUnit.reset();
	var $input = jQuery("<input />").attr({ "type": "checkbox", "checked": true }).appendTo('#testForm');
	equal( $input[0].checked, true, "A checked checkbox that is appended stays checked" );

	QUnit.reset();
	var $radios = jQuery("input:radio[name='R1']"),
		$radioNot = jQuery("<input type='radio' name='R1' checked='checked'/>").insertAfter( $radios ),
		$radio = $radios.eq(1).click();
	$radioNot[0].checked = false;
	$radios.parent().wrap("<div></div>");
	equal( $radio[0].checked, true, "Reappending radios uphold which radio is checked" );
	equal( $radioNot[0].checked, false, "Reappending radios uphold not being checked" );
	QUnit.reset();
};

test("append(String|Element|Array&lt;Element&gt;|jQuery)", function() {
	testAppend(manipulationBareObj);
});

test("append(Function)", function() {
	testAppend(manipulationFunctionReturningObj);
});

test("append(Function) with incoming value", function() {
	expect(12);

	var defaultText = "Try them out:", old = jQuery("#first").html();

	var result = jQuery("#first").append(function(i, val){
		equal( val, old, "Make sure the incoming value is correct." );
		return "<b>buga</b>";
	});
	equal( result.text(), defaultText + "buga", "Check if text appending works" );

	var select = jQuery("#select3");
	old = select.html();

	equal( select.append(function(i, val){
		equal( val, old, "Make sure the incoming value is correct." );
		return "<option value='appendTest'>Append Test</option>";
	}).find("option:last-child").attr("value"), "appendTest", "Appending html options to select element");

	QUnit.reset();
	var expected = "This link has class=\"blog\": Simon Willison's WeblogTry them out:";
	old = jQuery("#sap").html();

	jQuery("#sap").append(function(i, val){
		equal( val, old, "Make sure the incoming value is correct." );
		return document.getElementById("first");
	});
	equal( jQuery("#sap").text(), expected, "Check for appending of element" );

	QUnit.reset();
	expected = "This link has class=\"blog\": Simon Willison's WeblogTry them out:Yahoo";
	old = jQuery("#sap").html();

	jQuery("#sap").append(function(i, val){
		equal( val, old, "Make sure the incoming value is correct." );
		return [document.getElementById("first"), document.getElementById("yahoo")];
	});
	equal( jQuery("#sap").text(), expected, "Check for appending of array of elements" );

	QUnit.reset();
	expected = "This link has class=\"blog\": Simon Willison's WeblogYahooTry them out:";
	old = jQuery("#sap").html();

	jQuery("#sap").append(function(i, val){
		equal( val, old, "Make sure the incoming value is correct." );
		return jQuery("#yahoo, #first");
	});
	equal( jQuery("#sap").text(), expected, "Check for appending of jQuery object" );

	QUnit.reset();
	old = jQuery("#sap").html();

	jQuery("#sap").append(function(i, val){
		equal( val, old, "Make sure the incoming value is correct." );
		return 5;
	});
	ok( jQuery("#sap")[0].innerHTML.match( /5$/ ), "Check for appending a number" );

	QUnit.reset();
});

test("append the same fragment with events (Bug #6997, 5566)", function () {
	var doExtra = !jQuery.support.noCloneEvent && document["fireEvent"];
	expect(2 + (doExtra ? 1 : 0));
	stop();

	var element;

	// This patch modified the way that cloning occurs in IE; we need to make sure that
	// native event handlers on the original object don't get disturbed when they are
	// modified on the clone
	if ( doExtra ) {
		element = jQuery("div:first").click(function () {
			ok(true, "Event exists on original after being unbound on clone");
			jQuery(this).unbind("click");
		});
		var clone = element.clone(true).unbind("click");
		clone[0].fireEvent("onclick");
		element[0].fireEvent("onclick");

		// manually clean up detached elements
		clone.remove();
	}

	element = jQuery("<a class='test6997'></a>").click(function () {
		ok(true, "Append second element events work");
	});

	jQuery("#listWithTabIndex li").append(element)
		.find("a.test6997").eq(1).click();

	element = jQuery("<li class='test6997'></li>").click(function () {
		ok(true, "Before second element events work");
		start();
	});

	jQuery("#listWithTabIndex li").before(element);
	jQuery("#listWithTabIndex li.test6997").eq(1).click();
});

test("append HTML5 sectioning elements (Bug #6485)", function () {
	expect(2);

	jQuery("#qunit-fixture").append("<article style='font-size:10px'><section><aside>HTML5 elements</aside></section></article>");

	var article = jQuery("article"),
	aside = jQuery("aside");

	equal( article.get( 0 ).style.fontSize, "10px", "HTML5 elements are styleable");
	equal( aside.length, 1, "HTML5 elements do not collapse their children");
});

if ( jQuery.css ) {
	test("HTML5 Elements inherit styles from style rules (Bug #10501)", function () {
		expect(1);

		jQuery("#qunit-fixture").append("<article id='article'></article>");
		jQuery("#article").append("<section>This section should have a pink background.</section>");

		// In IE, the missing background color will claim its value is "transparent"
		notEqual( jQuery("section").css("background-color"), "transparent", "HTML5 elements inherit styles");
	});
}

test("html5 clone() cannot use the fragment cache in IE (#6485)", function () {
	expect(1);

	jQuery("<article><section><aside>HTML5 elements</aside></section></article>").appendTo("#qunit-fixture");

	var clone = jQuery("article").clone();

	jQuery("#qunit-fixture").append( clone );

	equal( jQuery("aside").length, 2, "clone()ing HTML5 elems does not collapse them" );
});

test("html(String) with HTML5 (Bug #6485)", function() {
	expect(2);

	jQuery("#qunit-fixture").html("<article><section><aside>HTML5 elements</aside></section></article>");
	equal( jQuery("#qunit-fixture").children().children().length, 1, "Make sure HTML5 article elements can hold children. innerHTML shortcut path" );
	equal( jQuery("#qunit-fixture").children().children().children().length, 1, "Make sure nested HTML5 elements can hold children." );
});



test("IE8 serialization bug", function () {
	expect(2);
	var wrapper = jQuery("<div></div>");

	wrapper.html("<div></div><article></article>");
	equal( wrapper.children("article").length, 1, "HTML5 elements are insertable with .html()");

	wrapper.html("<div></div><link></link>");
	equal( wrapper.children("link").length, 1, "Link elements are insertable with .html()");
});

test("html() object element #10324", function() {
	expect( 1 );

	var object = jQuery("<object id='object2'><param name='object2test' value='test'></param></object>?").appendTo("#qunit-fixture"),
			clone = object.clone();

	equal( clone.html(), object.html(), "html() returns correct innerhtml of cloned object elements" );
});

test("append(xml)", function() {
	expect( 1 );

	function createXMLDoc() {
		// Initialize DOM based upon latest installed MSXML or Netscape
		var elem,
			aActiveX =
				[ "MSXML6.DomDocument",
				"MSXML3.DomDocument",
				"MSXML2.DomDocument",
				"MSXML.DomDocument",
				"Microsoft.XmlDom" ];

		if ( document.implementation && "createDocument" in document.implementation ) {
			return document.implementation.createDocument( "", "", null );
		} else {
			// IE
			for ( var n = 0, len = aActiveX.length; n < len; n++ ) {
				try {
					elem = new ActiveXObject( aActiveX[ n ] );
					return elem;
				} catch(_){}
			}
		}
	}

	var xmlDoc = createXMLDoc(),
		xml1 = xmlDoc.createElement("head"),
		xml2 = xmlDoc.createElement("test");

	ok( jQuery( xml1 ).append( xml2 ), "Append an xml element to another without raising an exception." );

});

test("appendTo(String|Element|Array&lt;Element&gt;|jQuery)", function() {
	expect( 16 + ( jQuery.getScript ? 1 : 0 ) );

	var defaultText = "Try them out:";

	jQuery("<b>buga</b>").appendTo("#first");
	equal( jQuery("#first").text(), defaultText + "buga", "Check if text appending works" );
	equal( jQuery("<option value='appendTest'>Append Test</option>").appendTo("#select3").parent().find("option:last-child").attr("value"), "appendTest", "Appending html options to select element");

	QUnit.reset();
	var l = jQuery("#first").children().length + 2;
	jQuery("<strong>test</strong>");
	jQuery("<strong>test</strong>");
	jQuery([ jQuery("<strong>test</strong>")[0], jQuery("<strong>test</strong>")[0] ])
		.appendTo("#first");
	equal( jQuery("#first").children().length, l, "Make sure the elements were inserted." );
	equal( jQuery("#first").children().last()[0].nodeName.toLowerCase(), "strong", "Verify the last element." );

	QUnit.reset();
	var expected = "This link has class=\"blog\": Simon Willison's WeblogTry them out:";
	jQuery(document.getElementById("first")).appendTo("#sap");
	equal( jQuery("#sap").text(), expected, "Check for appending of element" );

	QUnit.reset();
	expected = "This link has class=\"blog\": Simon Willison's WeblogTry them out:Yahoo";
	jQuery([document.getElementById("first"), document.getElementById("yahoo")]).appendTo("#sap");
	equal( jQuery("#sap").text(), expected, "Check for appending of array of elements" );

	QUnit.reset();
	ok( jQuery(document.createElement("script")).appendTo("body").length, "Make sure a disconnected script can be appended." );

	QUnit.reset();
	expected = "This link has class=\"blog\": Simon Willison's WeblogYahooTry them out:";
	jQuery("#yahoo, #first").appendTo("#sap");
	equal( jQuery("#sap").text(), expected, "Check for appending of jQuery object" );

	QUnit.reset();
	jQuery("#select1").appendTo("#foo");
	t( "Append select", "#foo select", ["select1"] );

	QUnit.reset();
	var div = jQuery("<div/>").click(function(){
		ok(true, "Running a cloned click.");
	});
	div.appendTo("#qunit-fixture, #moretests");

	jQuery("#qunit-fixture div:last").click();
	jQuery("#moretests div:last").click();

	QUnit.reset();
	div = jQuery("<div/>").appendTo("#qunit-fixture, #moretests");

	equal( div.length, 2, "appendTo returns the inserted elements" );

	div.addClass("test");

	ok( jQuery("#qunit-fixture div:last").hasClass("test"), "appendTo element was modified after the insertion" );
	ok( jQuery("#moretests div:last").hasClass("test"), "appendTo element was modified after the insertion" );

	QUnit.reset();

	div = jQuery("<div/>");
	jQuery("<span>a</span><b>b</b>").filter("span").appendTo( div );

	equal( div.children().length, 1, "Make sure the right number of children were inserted." );

	div = jQuery("#moretests div");

	var num = jQuery("#qunit-fixture div").length;
	div.remove().appendTo("#qunit-fixture");

	equal( jQuery("#qunit-fixture div").length, num, "Make sure all the removed divs were inserted." );

	QUnit.reset();

	if ( jQuery.getScript ) {
		stop();
		jQuery.getScript('data/test.js', function() {
			jQuery('script[src*="data\\/test\\.js"]').remove();
			start();
		});
	}
});

var testPrepend = function(val) {
	expect(6);
	var defaultText = "Try them out:",
			result = jQuery("#first").prepend(val( "<b>buga</b>" ));

	equal( result.text(), "buga" + defaultText, "Check if text prepending works" );
	equal( jQuery("#select3").prepend(val( "<option value='prependTest'>Prepend Test</option>" )).find("option:first-child").attr("value"), "prependTest", "Prepending html options to select element");

	QUnit.reset();
	var expected = "Try them out:This link has class=\"blog\": Simon Willison's Weblog";
	jQuery("#sap").prepend(val( document.getElementById("first") ));
	equal( jQuery("#sap").text(), expected, "Check for prepending of element" );

	QUnit.reset();
	expected = "Try them out:YahooThis link has class=\"blog\": Simon Willison's Weblog";
	jQuery("#sap").prepend(val( [document.getElementById("first"), document.getElementById("yahoo")] ));
	equal( jQuery("#sap").text(), expected, "Check for prepending of array of elements" );

	QUnit.reset();
	expected = "YahooTry them out:This link has class=\"blog\": Simon Willison's Weblog";
	jQuery("#sap").prepend(val( jQuery("#yahoo, #first") ));
	equal( jQuery("#sap").text(), expected, "Check for prepending of jQuery object" );

	QUnit.reset();
	expected = "Try them out:GoogleYahooThis link has class=\"blog\": Simon Willison's Weblog";
	jQuery("#sap").prepend( val( [ jQuery("#first"), jQuery("#yahoo, #google") ] ) );
	equal( jQuery("#sap").text(), expected, "Check for prepending of array of jQuery objects" );
};

test("prepend(String|Element|Array&lt;Element&gt;|jQuery)", function() {
	testPrepend(manipulationBareObj);
});

test("prepend(Function)", function() {
	testPrepend(manipulationFunctionReturningObj);
});

test("prepend(Function) with incoming value", function() {
	expect(10);

	var defaultText = "Try them out:", old = jQuery("#first").html();
	var result = jQuery("#first").prepend(function(i, val) {
		equal( val, old, "Make sure the incoming value is correct." );
		return "<b>buga</b>";
	});
	equal( result.text(), "buga" + defaultText, "Check if text prepending works" );

	old = jQuery("#select3").html();

	equal( jQuery("#select3").prepend(function(i, val) {
		equal( val, old, "Make sure the incoming value is correct." );
		return "<option value='prependTest'>Prepend Test</option>";
	}).find("option:first-child").attr("value"), "prependTest", "Prepending html options to select element");

	QUnit.reset();
	var expected = "Try them out:This link has class=\"blog\": Simon Willison's Weblog";
	old = jQuery("#sap").html();

	jQuery("#sap").prepend(function(i, val) {
		equal( val, old, "Make sure the incoming value is correct." );
		return document.getElementById("first");
	});

	equal( jQuery("#sap").text(), expected, "Check for prepending of element" );

	QUnit.reset();
	expected = "Try them out:YahooThis link has class=\"blog\": Simon Willison's Weblog";
	old = jQuery("#sap").html();

	jQuery("#sap").prepend(function(i, val) {
		equal( val, old, "Make sure the incoming value is correct." );
		return [document.getElementById("first"), document.getElementById("yahoo")];
	});

	equal( jQuery("#sap").text(), expected, "Check for prepending of array of elements" );

	QUnit.reset();
	expected = "YahooTry them out:This link has class=\"blog\": Simon Willison's Weblog";
	old = jQuery("#sap").html();

	jQuery("#sap").prepend(function(i, val) {
		equal( val, old, "Make sure the incoming value is correct." );
		return jQuery("#yahoo, #first");
	});

	equal( jQuery("#sap").text(), expected, "Check for prepending of jQuery object" );
});

test("prependTo(String|Element|Array&lt;Element&gt;|jQuery)", function() {
	expect(6);
	var defaultText = "Try them out:";
	jQuery("<b>buga</b>").prependTo("#first");
	equal( jQuery("#first").text(), "buga" + defaultText, "Check if text prepending works" );
	equal( jQuery("<option value='prependTest'>Prepend Test</option>").prependTo("#select3").parent().find("option:first-child").attr("value"), "prependTest", "Prepending html options to select element");

	QUnit.reset();
	var expected = "Try them out:This link has class=\"blog\": Simon Willison's Weblog";
	jQuery(document.getElementById("first")).prependTo("#sap");
	equal( jQuery("#sap").text(), expected, "Check for prepending of element" );

	QUnit.reset();
	expected = "Try them out:YahooThis link has class=\"blog\": Simon Willison's Weblog";
	jQuery([document.getElementById("first"), document.getElementById("yahoo")]).prependTo("#sap");
	equal( jQuery("#sap").text(), expected, "Check for prepending of array of elements" );

	QUnit.reset();
	expected = "YahooTry them out:This link has class=\"blog\": Simon Willison's Weblog";
	jQuery("#yahoo, #first").prependTo("#sap");
	equal( jQuery("#sap").text(), expected, "Check for prepending of jQuery object" );

	QUnit.reset();
	jQuery("<select id='prependSelect1'></select>").prependTo("form:last");
	jQuery("<select id='prependSelect2'><option>Test</option></select>").prependTo("form:last");

	t( "Prepend Select", "#prependSelect2, #prependSelect1", ["prependSelect2", "prependSelect1"] );
});

var testBefore = function(val) {
	expect(7);
	var expected = "This is a normal link: bugaYahoo";
	jQuery("#yahoo").before(val( "<b>buga</b>" ));
	equal( jQuery("#en").text(), expected, "Insert String before" );

	QUnit.reset();
	expected = "This is a normal link: Try them out:Yahoo";
	jQuery("#yahoo").before(val( document.getElementById("first") ));
	equal( jQuery("#en").text(), expected, "Insert element before" );

	QUnit.reset();
	expected = "This is a normal link: Try them out:diveintomarkYahoo";
	jQuery("#yahoo").before(val( [document.getElementById("first"), document.getElementById("mark")] ));
	equal( jQuery("#en").text(), expected, "Insert array of elements before" );

	QUnit.reset();
	expected = "This is a normal link: diveintomarkTry them out:Yahoo";
	jQuery("#yahoo").before(val( jQuery("#mark, #first") ));
	equal( jQuery("#en").text(), expected, "Insert jQuery before" );

	QUnit.reset();
	expected = "This is a normal link: Try them out:GooglediveintomarkYahoo";
	jQuery("#yahoo").before( val( [ jQuery("#first"), jQuery("#mark, #google") ] ) );
	equal( jQuery("#en").text(), expected, "Insert array of jQuery objects before" );

	var set = jQuery("<div/>").before("<span>test</span>");
	equal( set[0].nodeName.toLowerCase(), "span", "Insert the element before the disconnected node." );
	equal( set.length, 2, "Insert the element before the disconnected node." );
};

test("before(String|Element|Array&lt;Element&gt;|jQuery)", function() {
	testBefore(manipulationBareObj);
});

test("before(Function)", function() {
	testBefore(manipulationFunctionReturningObj);
});

test("before and after w/ empty object (#10812)", function() {
	expect(2);

	var res = jQuery( "#notInTheDocument" ).before( "(" ).after( ")" );
	equal( res.length, 2, "didn't choke on empty object" );
	equal( res.wrapAll("<div/>").parent().text(), "()", "correctly appended text" );
});

test("before and after on disconnected node (#10517)", function() {
	expect(2);
	
	equal( jQuery("<input type='checkbox'/>").before("<div/>").length, 2, "before() returned all elements" );
	equal( jQuery("<input type='checkbox'/>").after("<div/>").length, 2, "after() returned all elements" );
});

test("insertBefore(String|Element|Array&lt;Element&gt;|jQuery)", function() {
	expect(4);
	var expected = "This is a normal link: bugaYahoo";
	jQuery("<b>buga</b>").insertBefore("#yahoo");
	equal( jQuery("#en").text(), expected, "Insert String before" );

	QUnit.reset();
	expected = "This is a normal link: Try them out:Yahoo";
	jQuery(document.getElementById("first")).insertBefore("#yahoo");
	equal( jQuery("#en").text(), expected, "Insert element before" );

	QUnit.reset();
	expected = "This is a normal link: Try them out:diveintomarkYahoo";
	jQuery([document.getElementById("first"), document.getElementById("mark")]).insertBefore("#yahoo");
	equal( jQuery("#en").text(), expected, "Insert array of elements before" );

	QUnit.reset();
	expected = "This is a normal link: diveintomarkTry them out:Yahoo";
	jQuery("#mark, #first").insertBefore("#yahoo");
	equal( jQuery("#en").text(), expected, "Insert jQuery before" );
});

var testAfter = function(val) {
	expect(7);
	var expected = "This is a normal link: Yahoobuga";
	jQuery("#yahoo").after(val( "<b>buga</b>" ));
	equal( jQuery("#en").text(), expected, "Insert String after" );

	QUnit.reset();
	expected = "This is a normal link: YahooTry them out:";
	jQuery("#yahoo").after(val( document.getElementById("first") ));
	equal( jQuery("#en").text(), expected, "Insert element after" );

	QUnit.reset();
	expected = "This is a normal link: YahooTry them out:diveintomark";
	jQuery("#yahoo").after(val( [document.getElementById("first"), document.getElementById("mark")] ));
	equal( jQuery("#en").text(), expected, "Insert array of elements after" );

	QUnit.reset();
	expected = "This is a normal link: YahoodiveintomarkTry them out:";
	jQuery("#yahoo").after(val( jQuery("#mark, #first") ));
	equal( jQuery("#en").text(), expected, "Insert jQuery after" );

	QUnit.reset();
	expected = "This is a normal link: YahooTry them out:Googlediveintomark";
	jQuery("#yahoo").after( val( [ jQuery("#first"), jQuery("#mark, #google") ] ) );
	equal( jQuery("#en").text(), expected, "Insert array of jQuery objects after" );

	var set = jQuery("<div/>").after("<span>test</span>");
	equal( set[1].nodeName.toLowerCase(), "span", "Insert the element after the disconnected node." );
	equal( set.length, 2, "Insert the element after the disconnected node." );
};

test("after(String|Element|Array&lt;Element&gt;|jQuery)", function() {
	testAfter(manipulationBareObj);
});

test("after(Function)", function() {
	testAfter(manipulationFunctionReturningObj);
});

test("insertAfter(String|Element|Array&lt;Element&gt;|jQuery)", function() {
	expect(4);
	var expected = "This is a normal link: Yahoobuga";
	jQuery("<b>buga</b>").insertAfter("#yahoo");
	equal( jQuery("#en").text(), expected, "Insert String after" );

	QUnit.reset();
	expected = "This is a normal link: YahooTry them out:";
	jQuery(document.getElementById("first")).insertAfter("#yahoo");
	equal( jQuery("#en").text(), expected, "Insert element after" );

	QUnit.reset();
	expected = "This is a normal link: YahooTry them out:diveintomark";
	jQuery([document.getElementById("first"), document.getElementById("mark")]).insertAfter("#yahoo");
	equal( jQuery("#en").text(), expected, "Insert array of elements after" );

	QUnit.reset();
	expected = "This is a normal link: YahoodiveintomarkTry them out:";
	jQuery("#mark, #first").insertAfter("#yahoo");
	equal( jQuery("#en").text(), expected, "Insert jQuery after" );
});

var testReplaceWith = function(val) {
	expect(22);
	jQuery("#yahoo").replaceWith(val( "<b id='replace'>buga</b>" ));
	ok( jQuery("#replace")[0], "Replace element with string" );
	ok( !jQuery("#yahoo")[0], "Verify that original element is gone, after string" );

	QUnit.reset();
	jQuery("#yahoo").replaceWith(val( document.getElementById("first") ));
	ok( jQuery("#first")[0], "Replace element with element" );
	ok( !jQuery("#yahoo")[0], "Verify that original element is gone, after element" );

	QUnit.reset();
	jQuery("#qunit-fixture").append("<div id='bar'><div id='baz'</div></div>");
	jQuery("#baz").replaceWith("Baz");
	equal( jQuery("#bar").text(),"Baz", "Replace element with text" );
	ok( !jQuery("#baz")[0], "Verify that original element is gone, after element" );

	QUnit.reset();
	jQuery("#yahoo").replaceWith(val( [document.getElementById("first"), document.getElementById("mark")] ));
	ok( jQuery("#first")[0], "Replace element with array of elements" );
	ok( jQuery("#mark")[0], "Replace element with array of elements" );
	ok( !jQuery("#yahoo")[0], "Verify that original element is gone, after array of elements" );

	QUnit.reset();
	jQuery("#yahoo").replaceWith(val( jQuery("#mark, #first") ));
	ok( jQuery("#first")[0], "Replace element with set of elements" );
	ok( jQuery("#mark")[0], "Replace element with set of elements" );
	ok( !jQuery("#yahoo")[0], "Verify that original element is gone, after set of elements" );

	QUnit.reset();
	var tmp = jQuery("<div/>").appendTo("body").click(function(){ ok(true, "Newly bound click run." ); });
	var y = jQuery("<div/>").appendTo("body").click(function(){ ok(true, "Previously bound click run." ); });
	var child = y.append("<b>test</b>").find("b").click(function(){ ok(true, "Child bound click run." ); return false; });

	y.replaceWith( tmp );

	tmp.click();
	y.click(); // Shouldn't be run
	child.click(); // Shouldn't be run

	tmp.remove();
	y.remove();
	child.remove();

	QUnit.reset();

	y = jQuery("<div/>").appendTo("body").click(function(){ ok(true, "Previously bound click run." ); });
	var child2 = y.append("<u>test</u>").find("u").click(function(){ ok(true, "Child 2 bound click run." ); return false; });

	y.replaceWith( child2 );

	child2.click();

	y.remove();
	child2.remove();

	QUnit.reset();

	var set = jQuery("<div/>").replaceWith(val("<span>test</span>"));
	equal( set[0].nodeName.toLowerCase(), "span", "Replace the disconnected node." );
	equal( set.length, 1, "Replace the disconnected node." );

	// #11338
	ok( jQuery("<div>1</div>").replaceWith( val("<span/>") ).is("span"), "#11338, Make sure disconnected node with content is replaced");

	var non_existant = jQuery("#does-not-exist").replaceWith( val("<b>should not throw an error</b>") );
	equal( non_existant.length, 0, "Length of non existant element." );

	var $div = jQuery("<div class='replacewith'></div>").appendTo("body");
	// TODO: Work on jQuery(...) inline script execution
	//$div.replaceWith("<div class='replacewith'></div><script>" +
		//"equal(jQuery('.replacewith').length, 1, 'Check number of elements in page.');" +
		//"</script>");
	equal(jQuery(".replacewith").length, 1, "Check number of elements in page.");
	jQuery(".replacewith").remove();

	QUnit.reset();

	jQuery("#qunit-fixture").append("<div id='replaceWith'></div>");
	equal( jQuery("#qunit-fixture").find("div[id=replaceWith]").length, 1, "Make sure only one div exists." );

	jQuery("#replaceWith").replaceWith( val("<div id='replaceWith'></div>") );
	equal( jQuery("#qunit-fixture").find("div[id=replaceWith]").length, 1, "Make sure only one div exists." );

	jQuery("#replaceWith").replaceWith( val("<div id='replaceWith'></div>") );
	equal( jQuery("#qunit-fixture").find("div[id=replaceWith]").length, 1, "Make sure only one div exists." );
};

test("replaceWith(String|Element|Array&lt;Element&gt;|jQuery)", function() {
	testReplaceWith(manipulationBareObj);
});

test("replaceWith(Function)", function() {
	testReplaceWith(manipulationFunctionReturningObj);

	expect(23);

	var y = jQuery("#yahoo")[0];

	jQuery(y).replaceWith(function(){
		equal( this, y, "Make sure the context is coming in correctly." );
	});

	QUnit.reset();
});

test("replaceWith(string) for more than one element", function(){
	expect(3);

	equal(jQuery("#foo p").length, 3, "ensuring that test data has not changed");

	jQuery("#foo p").replaceWith("<span>bar</span>");
	equal(jQuery("#foo span").length, 3, "verify that all the three original element have been replaced");
	equal(jQuery("#foo p").length, 0, "verify that all the three original element have been replaced");
});

test("replaceAll(String|Element|Array&lt;Element&gt;|jQuery)", function() {
	expect(10);
	jQuery("<b id='replace'>buga</b>").replaceAll("#yahoo");
	ok( jQuery("#replace")[0], "Replace element with string" );
	ok( !jQuery("#yahoo")[0], "Verify that original element is gone, after string" );

	QUnit.reset();
	jQuery(document.getElementById("first")).replaceAll("#yahoo");
	ok( jQuery("#first")[0], "Replace element with element" );
	ok( !jQuery("#yahoo")[0], "Verify that original element is gone, after element" );

	QUnit.reset();
	jQuery([document.getElementById("first"), document.getElementById("mark")]).replaceAll("#yahoo");
	ok( jQuery("#first")[0], "Replace element with array of elements" );
	ok( jQuery("#mark")[0], "Replace element with array of elements" );
	ok( !jQuery("#yahoo")[0], "Verify that original element is gone, after array of elements" );

	QUnit.reset();
	jQuery("#mark, #first").replaceAll("#yahoo");
	ok( jQuery("#first")[0], "Replace element with set of elements" );
	ok( jQuery("#mark")[0], "Replace element with set of elements" );
	ok( !jQuery("#yahoo")[0], "Verify that original element is gone, after set of elements" );
});

test("jQuery.clone() (#8017)", function() {

	expect(2);

	ok( jQuery.clone && jQuery.isFunction( jQuery.clone ) , "jQuery.clone() utility exists and is a function.");

	var main = jQuery("#qunit-fixture")[0],
			clone = jQuery.clone( main );

	equal( main.childNodes.length, clone.childNodes.length, "Simple child length to ensure a large dom tree copies correctly" );
});

test("clone() (#8070)", function () {
	expect(2);

	jQuery("<select class='test8070'></select><select class='test8070'></select>").appendTo("#qunit-fixture");
	var selects = jQuery(".test8070");
	selects.append("<OPTION>1</OPTION><OPTION>2</OPTION>");

	equal( selects[0].childNodes.length, 2, "First select got two nodes" );
	equal( selects[1].childNodes.length, 2, "Second select got two nodes" );

	selects.remove();
});

test("clone()", function() {
	expect( 44 );

	equal( "This is a normal link: Yahoo", jQuery("#en").text(), "Assert text for #en" );
	var clone = jQuery("#yahoo").clone();
	equal( "Try them out:Yahoo", jQuery("#first").append(clone).text(), "Check for clone" );
	equal( "This is a normal link: Yahoo", jQuery("#en").text(), "Reassert text for #en" );

	var cloneTags = [
		"<table/>", "<tr/>", "<td/>", "<div/>",
		"<button/>", "<ul/>", "<ol/>", "<li/>",
		"<input type='checkbox' />", "<select/>", "<option/>", "<textarea/>",
		"<tbody/>", "<thead/>", "<tfoot/>", "<iframe/>"
	];
	for (var i = 0; i < cloneTags.length; i++) {
		var j = jQuery(cloneTags[i]);
		equal( j[0].tagName, j.clone()[0].tagName, "Clone a " + cloneTags[i]);
	}

	// using contents will get comments regular, text, and comment nodes
	var cl = jQuery("#nonnodes").contents().clone();
	ok( cl.length >= 2, "Check node,textnode,comment clone works (some browsers delete comments on clone)" );

	var div = jQuery("<div><ul><li>test</li></ul></div>").click(function(){
		ok( true, "Bound event still exists." );
	});

	clone = div.clone(true);

	// manually clean up detached elements
	div.remove();

	div = clone.clone(true);

	// manually clean up detached elements
	clone.remove();

	equal( div.length, 1, "One element cloned" );
	equal( div[0].nodeName.toUpperCase(), "DIV", "DIV element cloned" );
	div.trigger("click");

	// manually clean up detached elements
	div.remove();

	div = jQuery("<div/>").append([ document.createElement("table"), document.createElement("table") ]);
	div.find("table").click(function(){
		ok( true, "Bound event still exists." );
	});

	clone = div.clone(true);
	equal( clone.length, 1, "One element cloned" );
	equal( clone[0].nodeName.toUpperCase(), "DIV", "DIV element cloned" );
	clone.find("table:last").trigger("click");

	// manually clean up detached elements
	div.remove();
	clone.remove();

	var divEvt = jQuery("<div><ul><li>test</li></ul></div>").click(function(){
		ok( false, "Bound event still exists after .clone()." );
	}),
		cloneEvt = divEvt.clone();

	// Make sure that doing .clone() doesn't clone events
	cloneEvt.trigger("click");

	cloneEvt.remove();
	divEvt.remove();

	// Test both html() and clone() for <embed and <object types
	div = jQuery("<div/>").html('<embed height="355" width="425" src="http://www.youtube.com/v/3KANI2dpXLw&amp;hl=en"></embed>');

	clone = div.clone(true);
	equal( clone.length, 1, "One element cloned" );
	equal( clone.html(), div.html(), "Element contents cloned" );
	equal( clone[0].nodeName.toUpperCase(), "DIV", "DIV element cloned" );

	// this is technically an invalid object, but because of the special
	// classid instantiation it is the only kind that IE has trouble with,
	// so let's test with it too.
	div = jQuery("<div/>").html("<object height='355' width='425' classid='clsid:D27CDB6E-AE6D-11cf-96B8-444553540000'>  <param name='movie' value='http://www.youtube.com/v/3KANI2dpXLw&amp;hl=en'>  <param name='wmode' value='transparent'> </object>");

	clone = div.clone(true);
	equal( clone.length, 1, "One element cloned" );
	(function checkForAttributes( $ ) {
		// IE6/7 adds some extra parameters so just test for existance of a defined set
		var parameters = ["height", "width", "classid"],
			$divObject = div.find("object"),
			$cloneObject = clone.find("object");

		$.each( parameters, function(index, parameter)  {
			equal( $cloneObject.attr(parameter), $divObject.attr(parameter), "Element attributes cloned: " + parameter );
		});
	})( jQuery );
	(function checkForParams() {
		// IE6/7/8 adds a bunch of extram param elements so just test for those that are trying to clone
		var params = {};

		clone.find("param").each(function(index, param) {
			params[param.attributes.name.nodeValue.toLowerCase()] =
				param.attributes.value.nodeValue.toLowerCase();
		});

		div.find("param").each(function(index, param) {
			var actualValue = params[param.attributes.name.nodeValue.toLowerCase()],
				expectedValue = param.attributes.value.nodeValue.toLowerCase();

			equal( actualValue, expectedValue, "Param cloned: " + param.attributes.name.nodeValue );
		});
	})();
	equal( clone[0].nodeName.toUpperCase(), "DIV", "DIV element cloned" );

	// and here's a valid one.
	div = jQuery("<div/>").html("<object height='355' width='425' type='application/x-shockwave-flash' data='http://www.youtube.com/v/3KANI2dpXLw&amp;hl=en'>  <param name='movie' value='http://www.youtube.com/v/3KANI2dpXLw&amp;hl=en'>  <param name='wmode' value='transparent'> </object>");

	clone = div.clone(true);
	equal( clone.length, 1, "One element cloned" );
	equal( clone.html(), div.html(), "Element contents cloned" );
	equal( clone[0].nodeName.toUpperCase(), "DIV", "DIV element cloned" );

	div = jQuery("<div/>").data({ "a": true });
	clone = div.clone(true);
	equal( clone.data("a"), true, "Data cloned." );
	clone.data("a", false);
	equal( clone.data("a"), false, "Ensure cloned element data object was correctly modified" );
	equal( div.data("a"), true, "Ensure cloned element data object is copied, not referenced" );

	// manually clean up detached elements
	div.remove();
	clone.remove();

	var form = document.createElement("form");
	form.action = "/test/";

	div = document.createElement("div");
	div.appendChild( document.createTextNode("test") );
	form.appendChild( div );

	equal( jQuery(form).clone().children().length, 1, "Make sure we just get the form back." );

	equal( jQuery("body").clone().children()[0].id, "qunit-header", "Make sure cloning body works" );
});

test("clone(script type=non-javascript) (#11359)", function() {
	expect(3);
	var src = jQuery("<script type='text/filler'>Lorem ipsum dolor sit amet</script><q><script type='text/filler'>consectetur adipiscing elit</script></q>");
	var dest = src.clone();
	equal( dest[0].text, "Lorem ipsum dolor sit amet", "Cloning preserves script text" );
	equal( dest.last().html(), src.last().html(), "Cloning preserves nested script text" );
	ok( /^\s*<scr.pt\s+type=['"]?text\/filler['"]?\s*>consectetur adipiscing elit<\/scr.pt>\s*$/i.test( dest.last().html() ), "Cloning preserves nested script text" );
});

test("clone(form element) (Bug #3879, #6655)", function() {
	expect(5);
	var clone,
			element = jQuery("<select><option>Foo</option><option selected>Bar</option></select>");

	equal( element.clone().find("option:selected").val(), element.find("option:selected").val(), "Selected option cloned correctly" );

	element = jQuery("<input type='checkbox' value='foo'>").attr("checked", "checked");
	clone = element.clone();

	equal( clone.is(":checked"), element.is(":checked"), "Checked input cloned correctly" );
	equal( clone[0].defaultValue, "foo", "Checked input defaultValue cloned correctly" );

	// defaultChecked also gets set now due to setAttribute in attr, is this check still valid?
	// equal( clone[0].defaultChecked, !jQuery.support.noCloneChecked, "Checked input defaultChecked cloned correctly" );

	element = jQuery("<input type='text' value='foo'>");
	clone = element.clone();
	equal( clone[0].defaultValue, "foo", "Text input defaultValue cloned correctly" );

	element = jQuery("<textarea>foo</textarea>");
	clone = element.clone();
	equal( clone[0].defaultValue, "foo", "Textarea defaultValue cloned correctly" );
});

test("clone(multiple selected options) (Bug #8129)", function() {
	expect(1);
	var element = jQuery("<select><option>Foo</option><option selected>Bar</option><option selected>Baz</option></select>");

	equal( element.clone().find("option:selected").length, element.find("option:selected").length, "Multiple selected options cloned correctly" );

});

test("clone() on XML nodes", function() {
	expect(2);
	var xml = createDashboardXML();
	var root = jQuery(xml.documentElement).clone();
	var origTab = jQuery("tab", xml).eq(0);
	var cloneTab = jQuery("tab", root).eq(0);
	origTab.text("origval");
	cloneTab.text("cloneval");
	equal(origTab.text(), "origval", "Check original XML node was correctly set");
	equal(cloneTab.text(), "cloneval", "Check cloned XML node was correctly set");
});

test("clone() on local XML nodes with html5 nodename", function() {
	expect(2);

	var $xmlDoc = jQuery( jQuery.parseXML( "<root><meter /></root>" ) ),
		$meter = $xmlDoc.find( "meter" ).clone();

	equal( $meter[0].nodeName, "meter", "Check if nodeName was not changed due to cloning" );
	equal( $meter[0].nodeType, 1, "Check if nodeType is not changed due to cloning" );
});

test("html(undefined)", function() {
	expect(1);
	equal( jQuery("#foo").html("<i>test</i>").html(undefined).html().toLowerCase(), "<i>test</i>", ".html(undefined) is chainable (#5571)" );
});

test("html() on empty set", function() {
	expect(1);
	strictEqual( jQuery().html(), undefined, ".html() returns undefined for empty sets (#11962)" );
});

var testHtml = function(valueObj) {
	expect(35);

	jQuery["scriptorder"] = 0;

	var div = jQuery("#qunit-fixture > div");
	div.html(valueObj("<b>test</b>"));
	var pass = true;
	for ( var i = 0; i < div.size(); i++ ) {
		if ( div.get(i).childNodes.length != 1 ) {
			pass = false;
		}
	}
	ok( pass, "Set HTML" );

	div = jQuery("<div/>").html( valueObj("<div id='parent_1'><div id='child_1'/></div><div id='parent_2'/>") );

	equal( div.children().length, 2, "Make sure two child nodes exist." );
	equal( div.children().children().length, 1, "Make sure that a grandchild exists." );

	var space = jQuery("<div/>").html(valueObj("&#160;"))[0].innerHTML;
	ok( /^\xA0$|^&nbsp;$/.test( space ), "Make sure entities are passed through correctly." );
	equal( jQuery("<div/>").html(valueObj("&amp;"))[0].innerHTML, "&amp;", "Make sure entities are passed through correctly." );

	jQuery("#qunit-fixture").html(valueObj("<style>.foobar{color:green;}</style>"));

	equal( jQuery("#qunit-fixture").children().length, 1, "Make sure there is a child element." );
	equal( jQuery("#qunit-fixture").children()[0].nodeName.toUpperCase(), "STYLE", "And that a style element was inserted." );

	QUnit.reset();
	// using contents will get comments regular, text, and comment nodes
	var j = jQuery("#nonnodes").contents();
	j.html(valueObj("<b>bold</b>"));

	// this is needed, or the expando added by jQuery unique will yield a different html
	j.find("b").removeData();
	equal( j.html().replace(/ xmlns="[^"]+"/g, "").toLowerCase(), "<b>bold</b>", "Check node,textnode,comment with html()" );

	jQuery("#qunit-fixture").html(valueObj("<select/>"));
	jQuery("#qunit-fixture select").html(valueObj("<option>O1</option><option selected='selected'>O2</option><option>O3</option>"));
	equal( jQuery("#qunit-fixture select").val(), "O2", "Selected option correct" );

	var $div = jQuery("<div />");
	equal( $div.html(valueObj( 5 )).html(), "5", "Setting a number as html" );
	equal( $div.html(valueObj( 0 )).html(), "0", "Setting a zero as html" );

	var $div2 = jQuery("<div/>"), insert = "&lt;div&gt;hello1&lt;/div&gt;";
	equal( $div2.html(insert).html().replace(/>/g, "&gt;"), insert, "Verify escaped insertion." );
	equal( $div2.html("x" + insert).html().replace(/>/g, "&gt;"), "x" + insert, "Verify escaped insertion." );
	equal( $div2.html(" " + insert).html().replace(/>/g, "&gt;"), " " + insert, "Verify escaped insertion." );

	var map = jQuery("<map/>").html(valueObj("<area id='map01' shape='rect' coords='50,50,150,150' href='http://www.jquery.com/' alt='jQuery'>"));

	equal( map[0].childNodes.length, 1, "The area was inserted." );
	equal( map[0].firstChild.nodeName.toLowerCase(), "area", "The area was inserted." );

	QUnit.reset();

	jQuery("#qunit-fixture").html(valueObj("<script type='something/else'>ok( false, 'Non-script evaluated.' );</script><script type='text/javascript'>ok( true, 'text/javascript is evaluated.' );</script><script>ok( true, 'No type is evaluated.' );</script><div><script type='text/javascript'>ok( true, 'Inner text/javascript is evaluated.' );</script><script>ok( true, 'Inner No type is evaluated.' );</script><script type='something/else'>ok( false, 'Non-script evaluated.' );</script><script type='type/ecmascript'>ok( true, 'type/ecmascript evaluated.' );</script></div>"));

	var child = jQuery("#qunit-fixture").find("script");

	equal( child.length, 2, "Make sure that two non-JavaScript script tags are left." );
	equal( child[0].type, "something/else", "Verify type of script tag." );
	equal( child[1].type, "something/else", "Verify type of script tag." );

	jQuery("#qunit-fixture").html(valueObj("<script>ok( true, 'Test repeated injection of script.' );</script>"));
	jQuery("#qunit-fixture").html(valueObj("<script>ok( true, 'Test repeated injection of script.' );</script>"));
	jQuery("#qunit-fixture").html(valueObj("<script>ok( true, 'Test repeated injection of script.' );</script>"));

	jQuery("#qunit-fixture").html(valueObj("<script type='text/javascript'>ok( true, 'jQuery().html().evalScripts() Evals Scripts Twice in Firefox, see #975 (1)' );</script>"));

	jQuery("#qunit-fixture").html(valueObj("foo <form><script type='text/javascript'>ok( true, 'jQuery().html().evalScripts() Evals Scripts Twice in Firefox, see #975 (2)' );</script></form>"));

	jQuery("#qunit-fixture").html(valueObj("<script>equal(jQuery.scriptorder++, 0, 'Script is executed in order');equal(jQuery('#scriptorder').length, 1,'Execute after html (even though appears before)')<\/script><span id='scriptorder'><script>equal(jQuery.scriptorder++, 1, 'Script (nested) is executed in order');equal(jQuery('#scriptorder').length, 1,'Execute after html')<\/script></span><script>equal(jQuery.scriptorder++, 2, 'Script (unnested) is executed in order');equal(jQuery('#scriptorder').length, 1,'Execute after html')<\/script>"));
};

test("html(String)", function() {
	testHtml(manipulationBareObj);
});

test("html(Function)", function() {
	testHtml(manipulationFunctionReturningObj);

	expect(37);

	QUnit.reset();

	jQuery("#qunit-fixture").html(function(){
		return jQuery(this).text();
	});

	ok( !/</.test( jQuery("#qunit-fixture").html() ), "Replace html with text." );
	ok( jQuery("#qunit-fixture").html().length > 0, "Make sure text exists." );
});

test("html(Function) with incoming value", function() {
	expect(20);

	var div = jQuery("#qunit-fixture > div"), old = div.map(function(){ return jQuery(this).html(); });

	div.html(function(i, val) {
		equal( val, old[i], "Make sure the incoming value is correct." );
		return "<b>test</b>";
	});

	var pass = true;
	div.each(function(){
		if ( this.childNodes.length !== 1 ) {
			pass = false;
		}
	});
	ok( pass, "Set HTML" );

	QUnit.reset();
	// using contents will get comments regular, text, and comment nodes
	var j = jQuery("#nonnodes").contents();
	old = j.map(function(){ return jQuery(this).html(); });

	j.html(function(i, val) {
		equal( val, old[i], "Make sure the incoming value is correct." );
		return "<b>bold</b>";
	});

	// Handle the case where no comment is in the document
	if ( j.length === 2 ) {
		equal( null, null, "Make sure the incoming value is correct." );
	}

	j.find("b").removeData();
	equal( j.html().replace(/ xmlns="[^"]+"/g, "").toLowerCase(), "<b>bold</b>", "Check node,textnode,comment with html()" );

	var $div = jQuery("<div />");

	equal( $div.html(function(i, val) {
		equal( val, "", "Make sure the incoming value is correct." );
		return 5;
	}).html(), "5", "Setting a number as html" );

	equal( $div.html(function(i, val) {
		equal( val, "5", "Make sure the incoming value is correct." );
		return 0;
	}).html(), "0", "Setting a zero as html" );

	var $div2 = jQuery("<div/>"), insert = "&lt;div&gt;hello1&lt;/div&gt;";
	equal( $div2.html(function(i, val) {
		equal( val, "", "Make sure the incoming value is correct." );
		return insert;
	}).html().replace(/>/g, "&gt;"), insert, "Verify escaped insertion." );

	equal( $div2.html(function(i, val) {
		equal( val.replace(/>/g, "&gt;"), insert, "Make sure the incoming value is correct." );
		return "x" + insert;
	}).html().replace(/>/g, "&gt;"), "x" + insert, "Verify escaped insertion." );

	equal( $div2.html(function(i, val) {
		equal( val.replace(/>/g, "&gt;"), "x" + insert, "Make sure the incoming value is correct." );
		return " " + insert;
	}).html().replace(/>/g, "&gt;"), " " + insert, "Verify escaped insertion." );
});

var testRemove = function(method) {
	expect(9);

	var cleanUp, count,
			first = jQuery("#ap").children(":first");

	first.data("foo", "bar");

	jQuery("#ap").children()[method]();
	ok( jQuery("#ap").text().length > 10, "Check text is not removed" );
	equal( jQuery("#ap").children().length, 0, "Check remove" );

	equal( first.data("foo"), method == "remove" ? null : "bar" );

	QUnit.reset();
	jQuery("#ap").children()[method]("a");
	ok( jQuery("#ap").text().length > 10, "Check text is not removed" );
	equal( jQuery("#ap").children().length, 1, "Check filtered remove" );

	jQuery("#ap").children()[method]("a, code");
	equal( jQuery("#ap").children().length, 0, "Check multi-filtered remove" );

	// using contents will get comments regular, text, and comment nodes
	// Handle the case where no comment is in the document
	ok( jQuery("#nonnodes").contents().length >= 2, "Check node,textnode,comment remove works" );
	jQuery("#nonnodes").contents()[method]();
	equal( jQuery("#nonnodes").contents().length, 0, "Check node,textnode,comment remove works" );

	// manually clean up detached elements
	if (method === "detach") {
		first.remove();
	}

	QUnit.reset();

	count = 0;

	first = jQuery("#ap").children(":first");

	cleanUp = first.click(function() { count++; })[method]().appendTo("#qunit-fixture").click();

	equal( method == "remove" ? 0 : 1, count );

	// manually clean up detached elements
	cleanUp.remove();
};

test("remove()", function() {
	testRemove("remove");
});

test("detach()", function() {
	testRemove("detach");
});

test("empty()", function() {
	expect(3);
	equal( jQuery("#ap").children().empty().text().length, 0, "Check text is removed" );
	equal( jQuery("#ap").children().length, 4, "Check elements are not removed" );

	// using contents will get comments regular, text, and comment nodes
	var j = jQuery("#nonnodes").contents();
	j.empty();
	equal( j.html(), "", "Check node,textnode,comment empty works" );
});

test("jQuery.cleanData", function() {
	expect(14);

	var type, pos, div, child;

	type = "remove";

	// Should trigger 4 remove event
	div = getDiv().remove();

	// Should both do nothing
	pos = "Outer";
	div.trigger("click");

	pos = "Inner";
	div.children().trigger("click");

	type = "empty";
	div = getDiv();
	child = div.children();

	// Should trigger 2 remove event
	div.empty();

	// Should trigger 1
	pos = "Outer";
	div.trigger("click");

	// Should do nothing
	pos = "Inner";
	child.trigger("click");

	// Should trigger 2
	div.remove();

	type = "html";

	div = getDiv();
	child = div.children();

	// Should trigger 2 remove event
	div.html("<div></div>");

	// Should trigger 1
	pos = "Outer";
	div.trigger("click");

	// Should do nothing
	pos = "Inner";
	child.trigger("click");

	// Should trigger 2
	div.remove();

	function getDiv() {
		var div = jQuery("<div class='outer'><div class='inner'></div></div>").click(function(){
			ok( true, type + " " + pos + " Click event fired." );
		}).focus(function(){
			ok( true, type + " " + pos + " Focus event fired." );
		}).find("div").click(function(){
			ok( false, type + " " + pos + " Click event fired." );
		}).focus(function(){
			ok( false, type + " " + pos + " Focus event fired." );
		}).end().appendTo("body");

		div[0].detachEvent = div[0].removeEventListener = function(t){
			ok( true, type + " Outer " + t + " event unbound" );
		};

		div[0].firstChild.detachEvent = div[0].firstChild.removeEventListener = function(t){
			ok( true, type + " Inner " + t + " event unbound" );
		};

		return div;
	}
});

test("jQuery.buildFragment - no plain-text caching (Bug #6779)", function() {
	expect(1);

	// DOM manipulation fails if added text matches an Object method
	var $f = jQuery( "<div />" ).appendTo( "#qunit-fixture" ),
		bad = [ "start-", "toString", "hasOwnProperty", "append", "here&there!", "-end" ];

	for ( var i=0; i < bad.length; i++ ) {
		try {
			$f.append( bad[i] );
		}
		catch(e) {}
	}
	equal($f.text(), bad.join(""), "Cached strings that match Object properties");
	$f.remove();
});

test( "jQuery.html - execute scripts escaped with html comment or CDATA (#9221)", function() {
	expect( 3 );
	jQuery( [
					 '<script type="text/javascript">',
					 '<!--',
					 'ok( true, "<!-- handled" );',
					 '//-->',
					 '</script>'
			 ].join ( "\n" ) ).appendTo( "#qunit-fixture" );
	jQuery( [
					 '<script type="text/javascript">',
					 '<![CDATA[',
					 'ok( true, "<![CDATA[ handled" );',
					 '//]]>',
					 '</script>'
			 ].join ( "\n" ) ).appendTo( "#qunit-fixture" );
	jQuery( [
					 '<script type="text/javascript">',
					 '<!--//--><![CDATA[//><!--',
					 'ok( true, "<!--//--><![CDATA[//><!-- (Drupal case) handled" );',
					 '//--><!]]>',
					 '</script>'
			 ].join ( "\n" ) ).appendTo( "#qunit-fixture" );
});

test("jQuery.buildFragment - plain objects are not a document #8950", function() {
	expect(1);

	try {
		jQuery('<input type="hidden">', {});
		ok( true, "Does not allow attribute object to be treated like a doc object");
	} catch (e) {}

});

test("jQuery.clone - no exceptions for object elements #9587", function() {
	expect(1);

	try {
		jQuery("#no-clone-exception").clone();
		ok( true, "cloned with no exceptions" );
	} catch( e ) {
		ok( false, e.message );
	}
});

test("jQuery(<tag>) & wrap[Inner/All]() handle unknown elems (#10667)", function() {
	expect(2);

	var $wraptarget = jQuery( "<div id='wrap-target'>Target</div>" ).appendTo( "#qunit-fixture" ),
			$section = jQuery( "<section>" ).appendTo( "#qunit-fixture" );

	$wraptarget.wrapAll("<aside style='background-color:green'></aside>");

	notEqual( $wraptarget.parent("aside").get( 0 ).style.backgroundColor, "transparent", "HTML5 elements created with wrapAll inherit styles" );
	notEqual( $section.get( 0 ).style.backgroundColor, "transparent", "HTML5 elements create with jQuery( string ) inherit styles" );
});

test("Cloned, detached HTML5 elems (#10667,10670)", function() {
	expect(7);

	var $section = jQuery( "<section>" ).appendTo( "#qunit-fixture" ),
			$clone;

	// First clone
	$clone = $section.clone();

	// Infer that the test is being run in IE<=8
	if ( $clone[0].outerHTML && !jQuery.support.opacity ) {
		// This branch tests cloning nodes by reading the outerHTML, used only in IE<=8
		equal( $clone[0].outerHTML, "<section></section>", "detached clone outerHTML matches '<section></section>'" );
	} else {
		// This branch tests a known behaviour in modern browsers that should never fail.
		// Included for expected test count symmetry (expecting 1)
		equal( $clone[0].nodeName, "SECTION", "detached clone nodeName matches 'SECTION' in modern browsers" );
	}

	// Bind an event
	$section.bind( "click", function( event ) {
		ok( true, "clone fired event" );
	});

	// Second clone (will have an event bound)
	$clone = $section.clone( true );

	// Trigger an event from the first clone
	$clone.trigger( "click" );
	$clone.unbind( "click" );

	// Add a child node with text to the original
	$section.append( "<p>Hello</p>" );

	// Third clone (will have child node and text)
	$clone = $section.clone( true );

	equal( $clone.find("p").text(), "Hello", "Assert text in child of clone" );

	// Trigger an event from the third clone
	$clone.trigger( "click" );
	$clone.unbind( "click" );

	// Add attributes to copy
	$section.attr({
		"class": "foo bar baz",
		"title": "This is a title"
	});

	// Fourth clone (will have newly added attributes)
	$clone = $section.clone( true );

	equal( $clone.attr("class"), $section.attr("class"), "clone and element have same class attribute" );
	equal( $clone.attr("title"), $section.attr("title"), "clone and element have same title attribute" );

	// Remove the original
	$section.remove();

	// Clone the clone
	$section = $clone.clone( true );

	// Remove the clone
	$clone.remove();

	// Trigger an event from the clone of the clone
	$section.trigger( "click" );

	// Unbind any remaining events
	$section.unbind( "click" );
	$clone.unbind( "click" );
});

test("jQuery.fragments cache expectations", function() {

	expect( 10 );

	jQuery.fragments = {};

	function fragmentCacheSize() {
		var n = 0, c;

		for ( c in jQuery.fragments ) {
			n++;
		}
		return n;
	}

	jQuery("<li></li>");
	jQuery("<li>?</li>");
	jQuery("<li>whip</li>");
	jQuery("<li>it</li>");
	jQuery("<li>good</li>");
	jQuery("<div></div>");
	jQuery("<div><div><span></span></div></div>");
	jQuery("<tr><td></td></tr>");
	jQuery("<tr><td></tr>");
	jQuery("<li>aaa</li>");
	jQuery("<ul><li>?</li></ul>");
	jQuery("<div><p>arf</p>nnn</div>");
	jQuery("<div><p>dog</p>?</div>");
	jQuery("<span><span>");

	equal( fragmentCacheSize(), 12, "12 entries exist in jQuery.fragments, 1" );

	jQuery.each( [
		"<tr><td></td></tr>",
		"<ul><li>?</li></ul>",
		"<div><p>dog</p>?</div>",
		"<span><span>"
	], function( i, frag ) {

		jQuery( frag );

		equal( jQuery.fragments[ frag ].nodeType, 11, "Second call with " + frag + " creates a cached DocumentFragment, has nodeType 11" );
		ok( jQuery.fragments[ frag ].childNodes.length, "Second call with " + frag + " creates a cached DocumentFragment, has childNodes with length" );
	});

	equal( fragmentCacheSize(), 12, "12 entries exist in jQuery.fragments, 2" );
});

test("Guard against exceptions when clearing safeChildNodes", function() {
	expect( 1 );

	var div;

	try {
		div = jQuery("<div/><hr/><code/><b/>");
	} catch(e) {}

	ok( div && div.jquery, "Created nodes safely, guarded against exceptions on safeChildNodes[ -1 ]" );
});

test("Ensure oldIE creates a new set on appendTo (#8894)", function() {
	strictEqual( jQuery("<div/>").clone().addClass("test").appendTo("<div/>").end().hasClass("test"), false, "Check jQuery.fn.appendTo after jQuery.clone" );
	strictEqual( jQuery("<div/>").find("p").end().addClass("test").appendTo("<div/>").end().hasClass("test"), false, "Check jQuery.fn.appendTo after jQuery.fn.find" );
	strictEqual( jQuery("<div/>").text("test").addClass("test").appendTo("<div/>").end().hasClass("test"), false, "Check jQuery.fn.appendTo after jQuery.fn.text" );
	strictEqual( jQuery("<bdi/>").clone().addClass("test").appendTo("<div/>").end().hasClass("test"), false, "Check jQuery.fn.appendTo after clone html5 element" );
	strictEqual( jQuery("<p/>").appendTo("<div/>").end().length, jQuery("<p>test</p>").appendTo("<div/>").end().length, "Elements created with createElement and with createDocumentFragment should be treated alike" );
});

test("html() - script exceptions bubble (#11743)", function() {
	expect(2);

	raises(function() {
		jQuery("#qunit-fixture").html("<script>undefined(); ok( false, 'error not thrown' );</script>");
		ok( false, "error ignored" );
	}, "exception bubbled from inline script" );

	raises(function() {
		jQuery("#qunit-fixture").html("<script src='data/badcall.js'></script>");
		ok( false, "error ignored" );
	}, "exception bubbled from remote script" );
});

test("checked state is cloned with clone()", function(){
	expect(2);

	var elem = jQuery.parseHTML("<input type='checkbox' checked='checked'/>")[0];
	elem.checked = false;
	equal( jQuery(elem).clone().attr("id","clone")[0].checked, false, "Checked false state correctly cloned" );
	
	elem = jQuery.parseHTML("<input type='checkbox'/>")[0];
	elem.checked = true;
	equal( jQuery(elem).clone().attr("id","clone")[0].checked, true, "Checked true state correctly cloned" );
});
