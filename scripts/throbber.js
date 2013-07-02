require(['$views/throbber#Throbber'], function(Throbber) {

	var throbber_remix = Throbber.forElement(document.getElementById('remixes_viz'));
	throbber_remix.setSize('small');
	throbber_remix.setPosition('center', "220px");
	// throbber_remix.hide();
	var throbber_samples = Throbber.forElement(document.getElementById('samples_viz'));
	throbber_samples.setSize('small');
	throbber_samples.setPosition('center', '220px');
	// throbber_samples.hide();
	var throbber_covers = Throbber.forElement(document.getElementById('covers_viz'));
	throbber_covers.setSize('small');
	throbber_covers.setPosition('center', '220px');
	// throbber_covers.hide();

	var showRemixThrobber = function() {
		throbber_remix.show();
	}

	var hideRemixThrobber = function() {
		throbber_remix.hide();
	}

	var showSamplesThrobber = function() {
		throbber_samples.show();
	}

	var hideSamplesThrobber = function() {
		throbber_samples.hide();
	}

	var showCoversThrobber = function() {
		throbber_covers.show();
	}

	var hideCoversThrobber = function() {
		throbber_covers.hide();

	}

	exports.showRemixThrobber = showRemixThrobber;
	exports.hideRemixThrobber = hideRemixThrobber;
	exports.showSamplesThrobber = showSamplesThrobber;
	exports.hideSamplesThrobber = hideSamplesThrobber;
	exports.showCoversThrobber = showCoversThrobber;
	exports.hideCoversThrobber = hideCoversThrobber;


});