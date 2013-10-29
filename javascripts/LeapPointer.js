
var Helper = {

	calc_central_point : function(_x, _y, _w, _h) {
		return {
			x : (parseFloat(_x) + parseFloat(_w) / 2),
			y : (parseFloat(_y) + parseFloat(_h) / 2)
		}
	},

	calc_distance : function(p1, p2, bounds) {
		deltaX = Math.abs(p1.x - parseFloat(p2.x))
		deltaY = Math.abs(p1.y - parseFloat(p2.y))
		if (deltaX == 0 && deltaY == 0)
			return 0
		else if (deltaX == 0)
			return deltaY
		else if (deltaY == 0)
			return deltaX
		else
			return (deltaX) * (deltaY) / 2
	},

	normalize_screen_to_leap : function(p, bounds) {
		zeroX = parseFloat(p.x) - bounds.xMin
		zeroY = parseFloat(p.y) - bounds.yMin
		// screenW : leapXMax = resX : zeroX
		// screenH : leapYMax = resY : zeroY
		return {
			x : zeroX * parseFloat($(window).width()) / (bounds.xMax - bounds.xMin),
			y : parseFloat($(window).height()) - zeroY * parseFloat($(window).height()) / (bounds.yMax - bounds.yMin)
		}

	}

}

var LP = function() {

	EventTarget.call(this);

	var me = this;

	this.id = "LEAP_POINTER"

	this.controller = null

	this.leapBounds = {
		xMin : -150,
		xMax : 150,
		yMin : 50,
		yMax : 200,
		zMin : 100,
		zMax : -50
	}

	this.focusable = new Array()
	this.focusablePoints = new Array()

	this.lastSelectedIndex = -1

	this.realSelection = 0
	// testing, maybe we need different values
	this.realSelectionThreshold = 5;
	this.realDeselectionThreshold = 20;

	this.realClick = 0
	// testing, maybe we need different values
	this.realClickThreshold = 5

	this.lastZ = 0
	this.clickZDelta = 2

	// improve states here

	this.tipL = 0
	this.actualPoint = {
		x : 0,
		y : 0
	}
	this.target = -1 // focusable's index

	// this function is up to the user: it will be called with 'canvas' html
	// element as argument
	this.getStageFromCanvas;

}

LP.prototype = {

	init : function() {
		this.controller = new Leap.Controller({
			enableGestures : false
		})
	},

	start : function() {
		this.addAllFocusable()
		this.behave(this.checkPresence)
		// this.behave(this.standard)
	},

	addAllFocusable : function() {
		var me = this
		me.removeAllFocusable()
		$(".leap_focusable").each(function() {
			me.addFocusable(this, me)
		})
	},

	removeAllFocusable : function() {
		var me = this
		me.focusable = new Array()
		me.focusablePoints = new Array()
	},

	addFocusable : function(elem, me) {
		me = typeof me !== 'undefined' ? me : this
		var foundDuplicate = false
		for ( var i = 0; i < me.focusable.length; i++)
			if (elem.id == me.focusable[i].id) {
				foundDuplicate = true
				break
			}

		if (!foundDuplicate) {
			me.focusable.push(elem)
			$(elem).hover(function() {
				$(this).addClass("leap_hover");
			}, function() {
				$(this).removeClass("leap_hover");
			})
			me.addFocusablePoint(elem, me)
		}
	},

	removeFocusable : function(elem, me) {
		me = typeof me !== 'undefined' ? me : this
		var id = -1

		var foundDuplicate = false
		for ( var i = 0; i < me.focusable.length; i++)
			if (elem.id == me.focusable[i].id) {
				id = i
				break
			}

		if (id > 0) {
			me.focusable = me.focusable.slice(0, id).concat(me.focusable.slice(id, me.focusable.length - 1))
			me.removeFocusablePoint(id, me)
		}
	},

	addFocusablePoint : function(elem, me) {
		me = typeof me !== 'undefined' ? me : this

		me.focusablePoints.push(me.getFocusablePoint(elem))
	},

	removeFocusablePoint : function(id, me) {
		me = typeof me !== 'undefined' ? me : this

		me.focusablePoints = me.focusablePoints.slice(0, id).concat(me.focusablePoints.slice(id, me.focusablePoints.length - 1))
	},

	getFocusablePoint : function(elem) {
		return Helper.calc_central_point($(elem).offset().left, $(elem).offset().top, $(elem).width(), $(elem).height()
		// $(elem).css("width"),
		// $(elem).css("height")
		)
	},

	getDistancesFromFocusable : function(p, me) {
		me = typeof me !== 'undefined' ? me : this

		var temp = new Array()
		for ( var i = 0; i < me.focusablePoints.length; i++)
			temp.push(Helper.calc_distance(p, me.focusablePoints[i], me.leapBounds))

		return temp
	},

	behave : function(fn) {
		var me = this;
		this.actual_function = fn;
		this.controller.removeAllListeners()
		this.controller.loop(function(f) {
			me.actual_function(f, me)
		})
	},

	actual_function : function(frame, me) {
	},

	check_position : function(position, me) {
		me = typeof me !== 'undefined' ? me : this
		return (position[0] > me.leapBounds.xMin && position[0] < me.leapBounds.xMax && position[1] > me.leapBounds.yMin
				&& position[1] < me.leapBounds.yMax && position[2] < me.leapBounds.zMin && position[2] > me.leapBounds.zMax)
	},

	getCloserIndex : function(leap_point, me) {
		var pointTo = Helper.normalize_screen_to_leap(leap_point, me.leapBounds)

		var distances = me.getDistancesFromFocusable(pointTo, me)

		var lower = Number.MAX_VALUE
		var lowerIndex = 0
		for ( var i = 0; i < distances.length; i++)
			if (distances[i] < lower) {
				lower = distances[i]
				lowerIndex = i
			}

		return lowerIndex
	},

	deselect_last : function(me) {
		me = typeof me !== 'undefined' ? me : this
		if (me.focusable[me.lastSelectedIndex] != undefined) {
			// $(me.focusable[me.lastSelectedIndex]).trigger('mouseleave')
			// $(me.focusable[me.lastSelectedIndex]).trigger('mouseout')

			me.triggerEvent('mouseleave', me.actualPoint, me.lastSelectedIndex, me)
			me.triggerEvent('mouseout', me.actualPoint, me.lastSelectedIndex, me)
		}
		me.lastSelectedIndex = -1
		me.realSelection = 0
		me.realClick = 0
		me.lastZ = 0
	},

	getTipL : function(frame, me) {
		me = typeof me !== 'undefined' ? me : this
		if (frame.hands.length > 1)
			me.tipL = 0
		else
			me.tipL = frame.pointables.length
	},

	checkPresence : function(frame, me) {
		me.deselect_last(me)
		me.getTipL(frame, me)
		me.realSelection = 0
		me.realClick = 0
		if (me.tipL > 0 && me.tipL < me.clickZDelta)
			me.behave(me.checkPosition)
	},

	checkPosition : function(frame, me) {
		me.target = -1
		me.deselect_last(me)
		me.getTipL(frame, me)
		if (me.tipL > 0 && me.tipL < me.clickZDelta)
			for ( var k = 0; k < me.tipL; k++) {
				if (me.check_position(frame.pointables[k].tipPosition)) {

					me.actualPoint = {
						x : frame.pointables[k].tipPosition[0],
						y : frame.pointables[k].tipPosition[1]
					}

					me.target = me.getCloserIndex(me.actualPoint, me)
					break
				}
			}
		if (me.target != -1)
			me.behave(me.checkSelected)
		else
			me.behave(me.checkPresence)
	},

	checkSelected : function(frame, me) {
		me.getTipL(frame, me)
		var exists = false

		if (me.tipL > 0 && me.tipL < me.clickZDelta)
			for ( var k = 0; k < me.tipL; k++) {
				if (me.check_position(frame.pointables[k].tipPosition)) {

					me.actualPoint = {
						x : frame.pointables[k].tipPosition[0],
						y : frame.pointables[k].tipPosition[1]
					}

					if (me.target == me.getCloserIndex(me.actualPoint, me)) {
						exists = true
						me.realSelection++
						if (me.realSelection > me.realSelectionThreshold) {
							me.lastSelectedIndex = me.target

							me.triggerEvent('mouseover', me.actualPoint, me.target, me)
							me.triggerEvent('mouseenter', me.actualPoint, me.target, me)

							// $(me.focusable[me.target]).trigger('mouseover');
							// $(me.focusable[me.target]).trigger('mouseenter');
							me.realSelection = 0
							me.behave(me.checkClicked)
							break
						}
					}
				}
			}
		if (!exists)
			me.behave(me.checkPresence)
	},

	checkClicked : function(frame, me) {
		me.getTipL(frame, me)
		if (me.tipL <= 0)
			me.behave(me.checkPresence)
		else if (me.tipL > me.clickZDelta) {
			me.realClick++
			if (me.realClick > me.realClickThreshold) {

				// no longer required
				// me.triggerEvent('mouseup', pointTo, lowerIndex, me)
				me.triggerEvent('click', me.actualPoint, me.target, me)

				// $(me.focusable[me.target]).trigger('click')
				me.behave(me.checkPresence)
			}
		} else {
			// Check still selected
			var nomore = true
			for ( var k = 0; k < me.tipL; k++) {
				if (me.check_position(frame.pointables[k].tipPosition)) {
					/*
					 * me.actualPoint = { x :
					 * frame.pointables[k].tipPosition[0], y :
					 * frame.pointables[k].tipPosition[1] } if (me.target ==
					 * me.getCloserIndex(me.actualPoint,me)) { nomore = false; }
					 */
					temp_actualPoint = {
						x : frame.pointables[k].tipPosition[0],
						y : frame.pointables[k].tipPosition[1]
					}
					if (me.target == me.getCloserIndex(temp_actualPoint, me)) {
						nomore = false;
					}
				}
			}

			if (nomore) {
				// console.log("checkind deselected "+me.realSelection)
				me.realSelection++
				if (me.realSelection > me.realDeselectionThreshold) {
					me.behave(me.checkPresence)
				}
			}

		}
	},

	// this is the "Canvas Trick", just for PIXI
	triggerGraphicEvent : function(canvas, eventType, position) {

		if (typeof this.getStageFromCanvas === 'function') {

			var stage = this.getStageFromCanvas(canvas);

			if (stage !== undefined) {


				switch (eventType) {
					case 'click':
						stage.interactionManager.onMouseDown.bind(stage.interactionManager)
						stage.interactionManager.onMouseDown(position)
						stage.interactionManager.onMouseUp.bind(stage.interactionManager)
						stage.interactionManager.onMouseUp(position)
						break
					case 'mouseover':
						that.stage.interactionManager.onMouseMove.bind(stage.interactionManager)
						that.stage.interactionManager.onMouseMove(position)
						break
					case 'mousemove':
						that.stage.interactionManager.onMouseMove.bind(stage.interactionManager)
						that.stage.interactionManager.onMouseMove(position)
						break
					case 'mouseenter':
						that.stage.interactionManager.onMouseMove.bind(stage.interactionManager)
						that.stage.interactionManager.onMouseMove(position)
						break
					case 'mousedown':
						stage.interactionManager.onMouseDown.bind(stage.interactionManager)
						stage.interactionManager.onMouseDown(position)
						break
					case 'mouseup':
						stage.interactionManager.onMouseUp.bind(stage.interactionManager)
						stage.interactionManager.onMouseUp(position)
						break
					case 'mouseout':
						stage.interactionManager.onMouseOut.bind(stage.interactionManager)
						stage.interactionManager.onMouseOut(position)
						break
				}
			} else {
				console.error("LeapPointer: stage is undefined");
			}
		} else {
			console.error("LeapPointer: you need to define a this.getStageFromCanvas function in order to retrieve a valid PIXI.Stage object");
		}
	},

	triggerEvent : function(eventType, pointTo, fIndex, me) {
		me = typeof me !== 'undefined' ? me : this

		if (me.focusable[fIndex].tagName == 'CANVAS') {

			this.triggerGraphicEvent(me.focusable[fIndex], eventType, {
				clientX : pointTo.x,
				clientY : pointTo.y
			})
			$(me.focusable[fIndex]).trigger(eventType);

		} else {

			$(me.focusable[fIndex]).trigger(eventType);

		}
	}

}

var LeapPointer = LP;
