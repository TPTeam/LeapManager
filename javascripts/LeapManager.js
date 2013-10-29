var LeapManager = (function() {
	var Leap;
	var lp;

	return {

		create : function() {
			console.log("Manager must create");
			lp = new LeapPointer();
			lp.init();

			return lp;
		},

		get : function() {
			return lp;
		}

	}

})()