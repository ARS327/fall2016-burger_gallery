/**
 * jQuery Universe plugin. Created for <http://www.viennapaint.com>
 *
 * Copyright (c) 2010 Peter Knobloch <http://absus.com>
 *
 *
 *	<div id="universe-viewport">  <-- #universe-viewport ... the element used as 'keyhole'
 *
 *		<div id="universe" class="image-data hidden">  <-- #universe ... the element containing initially all image information as text version of an array of JSON objects 
 *			[
 *				{
 *					"id":"399",
 *					"original":"0104baumax garten rgb.tif",
 *					"basepath":"uploads/",
 *					"filename":"0104baumax-garten-rgb",
 *					"extension":"tif",
 *					"width":8673,
 *					"height":4096,
 *					"backgroundColor":"B8C5A4",
 *					"video":"PTn8g0WyyDA",
 *					"info": {
 *						"artdirection":"",
 *						"photography":"",
 *						"3D":"",
 *						"agency":"",
 *						"client":"",
 *						"tagNames":""
 *				},
 *				{
 *					...
 *				}
 *			]
 *     </div>
 *
 * </div> *
 *
 * 
 *
 *	<div id="universe-viewport">
 *
 *		<div id="universe">
 *
 *			<div id="universe-images">
 *				<div id="universe-images-backgounds">
 *					<img class="universe-image-background" id="image-0" />
 *					<img class="universe-image-background" id="image-1" />
 *				</div>
 *
 *				<div id="universe-images-tiles">
 *					<img class="universe-image-tile image-0" />
 *					<img class="universe-image-tile image-0" />
 *					...
 *					<img class="universe-image-tile image-1" />
 *					...
 *				</div>
 *				...
 *			</div>
 *
 *			<div id="universe-widgets">
 *				<a class="showVideo" id="showVideo-0">...</a>
 *				...
 *			</div>
 *
 *			<div id="universe-info">
 *				...
 *			</div>
 *
 *			<div id="dimmer">
 *				...
 *			</div>
 *
 *			<div id="videoplayer">
 *				...
 *			</div>
 *
 *     </div>
 *
 * </div>
 */


(function ($, window, document) { // Create closure
	
	
	// Default settings
	var settings = {
			'imagesDataId': 'universe',  // The element initially containing the image data as JSON string
			
			'maxRowHeight': 4096,  // 4096 = 32 * 128
			'tileSize': 256,
			
			'minZoomLevel': 10,
			'maxZoomLevel': 0,
			'zoomLevelDelta': 0.5,  // Used with zoom level buttons
			
			'layout': 'circle',
			'serpentine': true,
			'gapSize': 512,  /// maxRowHeight / 8
			'showVideoButtonSize': 128,

			'redrawTimeout': 500,  // Milliseconds. After that duration the redraw method get's called if there are any skipped (not loaded) items
			'maxDoubleTapInterval': 500,
			
			// Controls
			'zoomLevelSliderId': 'zoomlevel-slider',
			'zoomlevelButtonDecreaseId': 'zoomlevel-button-decrease',
			'zoomlevelButtonIncreaseId': 'zoomlevel-button-increase'
			
			// 'maxRowWidth': 1024 * 64,
			// 'minRowHeight': 128,
			// 'initialZoomValue': 1/16,
			// 'wrapWideImages': true,
			// 'wideImageThreshold': 4 * 4096,
			// 'maxRagginess': 2 * 4096,
			// 'jagThreshold': 2 * 4096,
			// 'panSpeedThreshold': 50, // Pixels per second, above this speed the high resolution tiles are excluded from the redraw
			// 'centerOffsetY': 35,  // The height of the menubar
		};
	
	
	// PERFORMANCE OPTIMIZATIONS:
	// Precached Math object's methods to speed up access.
	// Multiplications are about 25% faster than divisions
	var abs = Math.abs,
		asin = Math.asin,
		ceil = Math.ceil,
		cos = Math.cos,
		floor = Math.floor,
		log = Math.log,
		max = Math.max,
		min = Math.min,
		pow = Math.pow,
		random = Math.random,
		round = Math.round,
		sqrt = Math.sqrt,
		LN2 = Math.LN2,
		LN2Inv = 1 / LN2,
		PI = Math.PI,
		SQRT2 = Math.SQRT2;
	
	
	// From Robert Penner's easing library <http://robertpenner.com/easing/>
	easeOutQuad = function (t, b, c, d) {  // t: current time, b: beginning value, c: change in value, d: duration
		return -c * (t /= d) * (t - 2) + b;  // @(t /= d): Inline optimizations evaluates to the result of the assignment
	}
	
	
	// Key codes
	var keyCode = {
		SPACE: 32,
		LEFT: 37,
		UP: 38,
		RIGHT: 39,
		DOWN: 40
	};
	
	
	
	/* DEBUG */
	// SEE: <http://www.openjs.com/scripts/others/dump_function_php_print_r.php>
	function dump(object, indentationLevel) {
		
		if (!indentationLevel) indentationLevel = 0;
		
		var text = '',
			indentation = '',
			i = indentationLevel;
			
		while (i--) indentation += '    ';

		if (typeof(object) == 'object') { // True for array, hash, or object 
			
			for(var key in object) {
				
				var value = object[key];

				if(typeof(value) == 'object') { // Nested
			
					text += indentation + '\'' + key + '\':\n';
					text += dump(value, ++indentationLevel);
				} else {
					text += indentation + '\'' + key + '\': \'' + value + '\',\n';
				}
			}
		} else { //Stings/Chars/Numbers etc.
			text = "===>"+object+"<===("+typeof(arr)+")";
		}
		return text;
	}
	function countProperties(object) {
	    var count = 0;
		for(var property in object) {
	        if(object.hasOwnProperty(property)) count++;  // @hasOwnProperty: Determine whether an object has the specified property as a direct property of that object
	    }
	    return count;
	}
	/* DEBUG */
	
	// var foo = { a: {b: {c: 1, d: 2}, e: 3}};
	// // SEE: <http://stackoverflow.com/questions/122102/what-is-the-most-efficient-way-to-clone-a-javascript-object>
	// function clone(object) {  // SEE: <http://jsperf.com/cloning-an-object>
	// 	
	// 	if (Object.create) {
	// 		var clonedObject = Object.create(object)
	// 	} else {
	// 		var clonedObject = {};
	// 		for (var key in object) {
	// 			if (typeof(object) == 'object') {
	// 				clonedObject[key] = clone(object[key]);
	// 			} else {
	// 				clonedObject[key] = object[key] + '*';
	// 				jQuery.log(key)
	// 			}
	// 		}
	// 	}
	// 	
	//    		return clonedObject;
	//   	}
	// foo.f = clone(foo.a);
	// console.log(dump(foo));
	// foo.a.b.c = 55;
	// console.log(dump(foo));
	
	
	
	// Detect supported features
	// Get name of CSS transform property for current browser
	// http://www.w3.org/TR/css3-2d-transforms/#transform-property
	var transformProperties = [
			'OTransform',  // Presto (Opera)
			'WebkitTransform',  // WebKit (Chrome, Safari, Mobile Safari)
			'MozTransform',  // Gecko (FireFox)
			'msTransform',  // Trident (Internet Explorer ≥9)
			'transform'  // CSS3 2D Transforms
		],
		transformProperty = false,
		index = transformProperties.length,
		divStyle = document.createElement('div').style;
	while(index--) {
		if (typeof divStyle[transformProperties[index]] != 'undefined') {
			transformProperty = transformProperties[index];  // Browser dependent string for CSS transformations
			break;
		}
	}
	
	var support = {
			'touch': 'ontouchend' in document,
			'transform': transformProperty,
			'transform3D': ('WebKitCSSMatrix' in window && 'm11' in new WebKitCSSMatrix())  // See http://cubiq.org/dropbox/accordion/
		}
	
	transformProperties = transformProperty = index = divStyle = undefined;  // Variables not longer required
	
	
	// The element containing all currently displayed images
	var	universe = {  // The unscaled values
			'images': undefined,  // All image data found in the orginal html as an array containing JSON objects
			'widgets': [],  // All widget (= play buttons for videos) data as an array containing JSON objects
			
			'width': undefined,  // Combined width of all unscaled images including gaps
			'height': undefined,  // Combined height of all unscaled images including gaps
			'widthPadding': undefined,  // Left & right padding
			'heightPadding': undefined  // Top & bottom padding
		}
	
	// The element used to clip the universe...
	var	viewport = {  // The unscaled values
			'width': undefined,
			'height': undefined,
			'left': undefined,
			'top': undefined,
			'right': undefined,
			'bottom': undefined,
			
			'zoom': {
				'factor': undefined,  // factor = 1 / factorInv = 1 / 2 ^ level = the plain multiplier
				'factorInv': undefined,  // factorInv = 1 / factor = 2 ^ level = the reciprocal value of the plain multiplier
				'level': undefined,  // level = -log(2, factor) = log(2, factorInv) = the reciprocal value on a logarithmic scale (e.g. level:factor => 0->1, 1->0.5, 2->0.25, ...)
				'factorStep': undefined,
				'factorStepInv': undefined,
				'levelStep': undefined
			},
			'last': {  // Used by setViewport & redraw
				'time': undefined,
				'left': undefined,
				'top': undefined,
				'width': undefined,
				'height': undefined
			}
		}
	
	var loadedTiles = {};  // All images that have already been requested
	var insertedTiles = {};
	var redrawTimeout;  // Contains the timer for redrawing skipped elements
	
	var doubleClickZoom = {
			'direction': +1,  // +1: forward, -1: backwards
			'lastImageId': undefined
		}
		
	
	var namedZoomLevels = {
		'farAway': function() {  // Zoom out as far as possible
			return settings.minZoomLevel
		},
		'fitAll': function() {  // Fit all images on screen
			var zoomFactor = min((viewportElement.offsetWidth - 2 * this.padding) / universe.width, (viewportElement.offsetHeight - 2 * this.padding) / universe.height);
			return -log(zoomFactor) * LN2Inv;
		},
		'fitSome': function() {  // Fit 3 rows of images on screen
			var zoomFactor = (viewportElement.offsetHeight - 2 * this.padding) / settings.maxRowHeight / 3
			return -log(zoomFactor) * LN2Inv;
		},
		'fitSingle': function(image) {  // Fit a single image on screen
			var zoomFactor = (image) ?
				  min((viewportElement.offsetWidth - 2 * this.padding) / image.width, (viewportElement.offsetHeight - 2 * this.padding) / settings.maxRowHeight)
				: (viewportElement.offsetHeight - 2 * this.padding) / settings.maxRowHeight;
			return -log(zoomFactor) * LN2Inv;
		},
		'halfSize': function() {  // View at 50%
			var zoomFactor = 0.5;
			return -log(zoomFactor) * LN2Inv;
		},
		'fullSize': function() {  // View at 100%
			var zoomFactor = 1;
			return -log(zoomFactor) * LN2Inv;
		},	
		'padding': 40,
		'sequence': ['farAway', 'fitAll', 'fitSome', 'fitSingle', 'halfSize', 'fullSize']
	}
	
	
	// Access to DOM elements
	var viewportElement,
		universeElement,
		imagesElement,
		backgroundsElement,
		tilesElement,
		infoElement,
		dimmerElement,
		videosElement,
		zoomLevelSliderElement;
		
		
	// Track time, position & zoom of last redraw
	var prevViewport = {
			time: undefined,
			top: undefined,
			left: undefined,
			zoomFactor: undefined
		}; 
	
	// Debugging
	var monitor = {};  // Used to track the values of the monitor method
	
	var frameRate = {  // Used for calculating the frame rate
			'samples': [],  // Array containing the redraw durations
			'sampleSize': 20,  // The numer of samples
			'lastRedrawTime': undefined
		}
	
	var status = {
			'gestureStart': {
				'distance' : undefined,  // Multitouch distance
				'zoomLevel': undefined,
				'viewportLeft': undefined,
				'viewportTop': undefined,
				'viewportX': undefined,
				'viewportY': undefined
			},
			'doubleTap': {
				'begin': 0,
				'secondTap': false
			},
			'slider': {
				'pageX': undefined,
				'pageY': undefined
			},
			'showVideo': {
				'panned': false
			}
		};

	
	
	// iPhone: 320 x 480 (Original, 3G, 3GS), 640 × 960 (4)
	// iPad: 1024 x 768 (Original, 2)
	// var isSmartphone = support.touch && Math.min(screen.width, screen.height) < 768;  // NOTE: screen.width, screen.height returns 320 x 480 on iPhone 4


	// Global jQuery object extension
	$.universe = {
		'version': '1.0.0'
	};



	// Global jQuery class extension
	$.fn.universe = function(method) {  
		
		if (methods[method]) {  // Pass method call as string
			return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
	    } else if (typeof method === 'object' || !method) {  // Call init method passed method argument is an object or empty
			return methods.initialize.apply(this, arguments);
	    } else {  // The requested method does not exist
			$.error('Method "' +  method + '" does not exist on jQuery.universe');
	    }
	}



	//  Method definition
	var methods = {
		
		initialize: function (options) {
			
			jQuery.log('universe.initialize');
			jQuery.log('support.transform = ' + support.transform);
			methods.monitor({'initialized': 'yes'})
			
			// The DOM hierarchy has been fully constructed until now but not all assets (images, stylesheets, etc.) might have been completely loaded.
			// Called in setup.js on jQuery(document).ready() <http://api.jquery.com/ready/>
			
			return this.each(function (index, element) {
				
				// methods.monitor({
				// 	'support': (
				// 		  (support.touch ? 'touch' : 'mouse')
				// 		+ (support.transform ? ', transform' : '')
				// 		+ (support.transform3D ? ', 3D' : ''))// ,
				// 		// 					'last method': 'initialize'
				// });
				
				
				// Merge default settings with custom options
				if (options) { 
					$.extend(settings, options);
				}				
				
				
				// Get the viewport (= the element clipping the universe)
				viewportElement = this;
				
				
				// Get the element containing the image data (script-tag containin a javascript variable)
				var imagesDataElement = document.getElementById(settings.imagesDataId);
				
				
				// Convert the string to an array containtaining JSON objects
				try {
					universe.images = imagesData; //eval('(' + imagesDataElement.innerHTML + ')');
				} catch (err) {
					jQuery.log(err);
				}

				// DISABLED // Add info string (e.g. for tooltips) to each image
				// var propertyFriendlyNames = {
				// 	'3D': '3D',
				// 	'agency': 'Agency',
				// 	'artdirection': 'Art Direction',
				// 	'client': 'Client',
				// 	'photography': 'Photography',
				// 	'tagNames': 'Tags'
				// }
				// var index = images.length;
				// while (index--) {
				// 	var image = images[index];
				// 	var infoString = '',
				// 		description = '';
				// 	for(var property in image.info) {
				// 		description = image.info[property];
				// 		if (description) {
				// 			infoString += ((infoString.length) ? '\n' : '') + propertyFriendlyNames[property] + ': ' + description;
				// 		}
				// 	}
				// 	image['infoString'] = infoString;
				// }
				

				// Create new universe as a document fragment. Elements for backgrounds & tiles (children of imagesElement) will be added in methods.redraw(event)
				var universeDocumentFragment = document.createDocumentFragment();  
				
				universeElement = document.createElement('div');
				universeElement.id = 'universe';
				universeDocumentFragment.appendChild(universeElement);
				
				imagesElement = document.createElement('div');
				imagesElement.id = 'universe-images';
				if (support.transform) imagesElement.style[support.transform + 'Origin'] = '0 0';
				universeElement.appendChild(imagesElement);

				backgroundsElement = document.createElement('div');
				backgroundsElement.id = 'universe-images-backgrounds';
				imagesElement.appendChild(backgroundsElement);
											
				tilesElement = document.createElement('div');
				tilesElement.id = 'universe-images-tiles';
				imagesElement.appendChild(tilesElement);

				widgetsElement = document.createElement('div');
				widgetsElement.id = 'universe-widgets';
				universeElement.appendChild(widgetsElement);

				infoElement = document.createElement('div');
				infoElement.id = 'universe-info';
				infoElement.appendChild(document.createTextNode('i'));
				universeElement.appendChild(infoElement);
				
				// videoElement = document.createElement('div');
				// videoElement.id = 'universe-videos';
				// var dimmerElement =  = document.createElement('div');
				// dimmerElement.id = 'universe-videos-dimmer';
				// universeElement.appendChild(videoElement);
				
				// Replace the image data element with the universe fragment
				viewportElement.replaceChild(universeDocumentFragment, imagesDataElement); //document.getElementById(settings.imagesDataId));
				
				
				// Update references
				universeElement = document.getElementById('universe');
				imagesElement = document.getElementById('universe-images');
				backgroundsElement = document.getElementById('universe-images-backgrounds');
				tilesElement = document.getElementById('universe-images-tiles');
				widgetsElement = document.getElementById('universe-widgets');
				infoElement = document.getElementById('universe-info');
				
				zoomLevelSliderElement = document.getElementById(settings.zoomLevelSliderId);
				
				dimmerElement = document.getElementById('dimmer');
				videosElement = document.getElementById('videos');
				
				// Bind event handlers

				
				// Zooming with the mousewheel
				if (window.addEventListener) {
					window.addEventListener('DOMMouseScroll', methods.mouseWheel, false);  // CHECK: FireFox
					window.addEventListener('mousewheel', methods.mouseWheel, false);  // CHECK: Safari, Chrome, Internet Explorer 9
				} else {
					document.onmousewheel = methods.mouseWheel;  // CHECK: Internet Explorer 8
				}
				
				// Zooming with the decrease/increase buttons
				document.getElementById(settings.zoomlevelButtonDecreaseId).onclick = methods.click
				document.getElementById(settings.zoomlevelButtonIncreaseId).onclick = methods.click
				
				// Zooming with the keyboard
				window.onkeydown = methods.keyDown;
				
				if (support.touch) {  // Use touch events
					methods.monitor({'event type': 'touch'});		
					// Panning & zooming with one or two fingers
					viewportElement.ontouchstart = methods.gestureStart;  // See http://www.quirksmode.org/js/events_tradmod.html
					viewportElement.ontouchmove = methods.gestureChange;
					viewportElement.ontouchend = methods.gestureEnd;
					
					// Zooming by double clicking has to be handled in methods.gestureStart & methods.gestureEnd since Safari Mobile does not support ondblclick
					// SEE: <http://developer.apple.com/library/IOs/documentation/AppleApplications/Reference/SafariWebContent/HandlingEvents/HandlingEvents.html#//apple_ref/doc/uid/TP40006511-SW5>

					// Zooming using the slider
					zoomLevelSliderElement.ontouchstart = methods.sliderMouseDown;
					
					videosElement.ontouchend = methods.hideVideo;
					
				} else {  // Use mouse events
					methods.monitor({'event type': 'mouse'});
					// Panning with the mouse, touchpad, etc.
					viewportElement.onmousedown = methods.gestureStart;  // gestureChange & gestureEnd will be bound & unbound dynamically
					
					// Zooming by double clicking
					viewportElement.ondblclick = methods.doubleClick;
					
					// Zooming using the slider
					zoomLevelSliderElement.onmousedown = methods.sliderMouseDown;
					
					videosElement.onclick = methods.hideVideo;
					
				}

				// 
				// if (support.touch) {
				// 	
				// 
				// } else {
				// 
				// 	videosElement.onclick = methods.hideVideo;
				// }
				
				// universeElement.onmouseover = function (event) {
				// 	if (event.target.id == 'universe-image-backgrounds') {
				// 		methods.hideInfo(event, event.target);
				// 	} else {
				// 		methods.showInfo(event, event.target);
				// 	}
				// }
				// universeElement.onclick = function (event) { jQuery.log(e)}
				
				
				
				/*** DEVELOPMENT ONLY ***/
				// // Select random layout
				// var layouts = ['square', 'triangle', 'circle', 'ellipse'];
				// settings.layout = layouts[floor(layouts.length * random())]
				/*** DEVELOPMENT ONLY ***/
				
				
				

				
				// Set initial zoom level and redraw the universe (onscreen)
				// if (isSmartphone) {
				// 	methods.zoomTo({type: 'initialize'}, 'fitAll');  //settings.initialZoomlevel
				// } else {
				// 	methods.zoomTo({type: 'initialize'}, 'farAway');  //settings.initialZoomlevel
				// }
				
				// Arrange images in universe (offscreen)
				methods.arrangeImages();
				
				// Display images
				methods.setViewport({
					'caller': 'initialize',
					'type': 'zoom',
					'zoomName' : 'fitAll'
				});
				
				
				// // Hide address bar
				// window.top.scrollTo(0, 1);
				// 
				// methods.monitor({'initialize': 'finished'})
			});
		},
		
		
		
		//
		// Event handlers
		//
		gestureStart: function (event) {  // SEE: <http://backtothecode.blogspot.com/2009/10/javascript-touch-and-gesture-events.html>
			methods.monitor({'event type': 'gestureStart'});
			
			// Fix event for Internet Explorer
			if (!event) event = window.event;  // W3C/Netscape: the event is passed as function argument, Internet Explorer: uses window.event
			
			if (support.touch) {  // Touch
				
				var x0 = event.touches[0].pageX,
					y0 = event.touches[0].pageY;
					
				if (event.touches.length == 1) {  // One finger: pan or double tap
					
					var now = new Date().getTime();
					
					// Capture double taps for Safari Mobile
					if (now - status.doubleTap.begin > settings.maxDoubleTapInterval) {  // Begin new double tap
						status.doubleTap.begin = now;
						status.doubleTap.secondTap = false;
					}
					
					// Calculate mouse position to normalized (= upscaled) universe coordinates
					status.gestureStart.viewportLeft = viewport.left;
					status.gestureStart.viewportTop = viewport.top;
					status.gestureStart.viewportX = x0 * viewport.zoom.factorInv;
					status.gestureStart.viewportY = y0 * viewport.zoom.factorInv;
					
					
				} else {  // Two fingers: pan & zoom
					
					var x1 = event.touches[1].pageX,
						y1 = event.touches[1].pageY;
						
					// Calculate mouse position to normalized (= upscaled) universe coordinates
					status.gestureStart.zoomFactor = viewport.zoom.factor;
					status.gestureStart.distance = sqrt((x0 - x1) * (x0 - x1) + (y0 - y1) * (y0 - y1));
					
					status.gestureStart.viewportLeft = viewport.left;
					status.gestureStart.viewportTop = viewport.top;
					status.gestureStart.viewportX = (x0 + x1) * 0.5 * viewport.zoom.factorInv;
					status.gestureStart.viewportY = (y0 + y1) * 0.5 * viewport.zoom.factorInv;
										
				}
				
			} else {  // Mouse: pan only
				
				// Show grabbing hand cursor during mousedown
				var className = viewportElement.className;
				viewportElement.className += className ? ' grabbing': 'grabbing';  // Add class 'grabbing' to viewport
				
				// Calculate mouse position to normalized (= upscaled) universe coordinates
				status.gestureStart.viewportLeft = viewport.left;
				status.gestureStart.viewportTop = viewport.top;
				// status.gestureStart.viewportX = event.pageX * viewport.zoom.factorInv;
				// status.gestureStart.viewportY = event.pageY * viewport.zoom.factorInv;
				status.gestureStart.viewportX = event.clientX * viewport.zoom.factorInv;
				status.gestureStart.viewportY = event.clientY * viewport.zoom.factorInv;
				
				
				// Add mouse event listeners
				viewportElement.onmousemove = methods.gestureChange;
				viewportElement.onmouseup = methods.gestureEnd;
				
			}
			
			if (event.preventDefault) event.preventDefault();  // Internet Explorer does not support 'event.preventDefault();'...
			return false;  // ...but 'return false;'
			
		},


		gestureChange: function (event) {
			methods.monitor({'event type': 'gestureChange'});
			// Fix event for Internet Explorer
			if (!event) event = window.event;  // W3C/Netscape: the event is passed as function argument, Internet Explorer: uses window.event
			
			if (support.touch) {  // Touch
				
				var x0 = event.touches[0].pageX,
					y0 = event.touches[0].pageY;
				
				if (event.touches.length == 1) {  // One finger: pan only
					
					methods.setViewport({
						'caller': 'touchmove',
						'type': 'pan',
						'pageX': x0,  // @pageX/Y: http://www.quirksmode.org/dom/w3c_cssom.html#mousepos (pageX/Y = scrollLeft/Top + clientX/Y)
						'pageY': y0
					});
					
				} else {  // Two fingers: pan & zoom
					
					var x1 = event.touches[1].pageX,
						y1 = event.touches[1].pageY;
						
					var scale = sqrt((x0 - x1) * (x0 - x1) + (y0 - y1) * (y0 - y1)) / status.gestureStart.distance;
					// methods.monitor({ 'pageX/Y': (x0 + x1) * 0.5 + ' / ' + (y0 + y1) * 0.5 })
					methods.setViewport({
						'caller': 'touchmove',
						'type': 'panandzoom',
						'zoomFactor': scale * status.gestureStart.zoomFactor,
						'pageX': (x0 + x1) * 0.5,  // @pageX/Y: http://www.quirksmode.org/dom/w3c_cssom.html#mousepos (pageX/Y = scrollLeft/Top + clientX/Y)
						'pageY': (y0 + y1) * 0.5
						// }
					});
				}
				
			} else {  // Mouse: pan only
				
				methods.setViewport({
					'caller': 'mousemove',
					'type': 'pan',
					// 'pageX': event.pageX,  // @pageX/Y: http://www.quirksmode.org/dom/w3c_cssom.html#mousepos (pageX/Y = scrollLeft/Top + clientX/Y)
					// 'pageY': event.pageY
					'pageX': event.clientX,  // @pageX/Y: http://www.quirksmode.org/dom/w3c_cssom.html#mousepos (pageX/Y = scrollLeft/Top + clientX/Y)
					'pageY': event.clientY
				});

			}
			
			if (event.preventDefault) event.preventDefault();  // Internet Explorer does not support 'event.preventDefault();'...
			return false;  // ...but 'return false;'
			
		},


		gestureEnd: function (event) {
			methods.monitor({'event type': 'gestureEnd'});
			// Fix event for Internet Explorer
			if (!event) event = window.event;  // W3C/Netscape: the event is passed as function argument, Internet Explorer: uses window.event
			
			if (support.touch) {  // Touch
				
				if (event.touches.length == 0) {  // No fingers touch

					var now = new Date().getTime();
					
					// Capture double taps for Safari Mobile
					if (now - status.doubleTap.begin <= settings.maxDoubleTapInterval) {  // Duration since first touchstart short enough...
						if (status.doubleTap.secondTap) {  // ...and second touchend: Double tap complete
							methods.doubleClick(event);
						} else {
							status.doubleTap.secondTap = true;
						}
					}
					
				} else if (event.touches.length == 1) {  // Update after offset when second finger is lifted
					
					status.gestureStart.viewportLeft = viewport.left;
					status.gestureStart.viewportTop = viewport.top;
					status.gestureStart.viewportX = event.touches[0].pageX * viewport.zoom.factorInv;
					status.gestureStart.viewportY = event.touches[0].pageY * viewport.zoom.factorInv;
				}
				
			} else {  // Mouse
				
				// Show grabbing hand cursor during mousedown
				viewportElement.className = '';  // Simpler version than the one below (can be used as long as no additional class names are involved)
				
				// var className = viewportElement.className;
				// viewportElement.className = className.replace( /(?:^|\s)grabbing(?!\S)/ , '' );  // Remove class 'grabbing' from viewport
				// See http://stackoverflow.com/questions/195951/change-an-elements-css-class-with-javascript
				// Read as: match 'grabbing' at starting position or preceeded by a single whitespace character followed by a single non-whitespace character
				// () ... grouping
				// ?: ... non-capturing backreference
				// ^  ... starting position within the string
				// |  ... alternative
				// \s ... whitspace character (space, tab or line break)
				// ?! ... negative lookahead
				// \S ... non-whitespace character
				
				// Remove mouse event listeners
				viewportElement.onmousemove = null;
				viewportElement.onmouseup = null;
				
			}
			
			if (event.preventDefault) event.preventDefault();  // Internet Explorer does not support 'event.preventDefault();'...
			return false;  // ...but 'return false;'
			
		},


		keyDown: function (event) {  // TADA!
			methods.monitor({'event type': 'keyDown'});
			// Fix event for Internet Explorer
			if (!event) event = window.event;  // W3C/Netscape: the event is passed as function argument, Internet Explorer: uses window.event
			
			// methods.monitor({'last method': 'keyUp'});

			var key = event.charCode ? event.charCode : event.keyCode ? event.keyCode : 0;
			
			switch(key) {
				case keyCode.SPACE:
					methods.setViewport({
						'caller': 'initialize',
						'type': 'zoom',
						'zoomName' : 'fitAll'
					});
					
					if (event.preventDefault) event.preventDefault();  // Internet Explorer does not support 'event.preventDefault();'...
					return false;  // ...but 'return false;'
					
					break;
					
				case keyCode.LEFT_ARROW:
				case keyCode.DOWN_ARROW:
					methods.setViewport({
						'caller': 'key',
						'type': 'zoom',
						'zoomLevelDelta' : +settings.zoomLevelDelta  // Zoom in
					});
					
					if (event.preventDefault) event.preventDefault();  // Internet Explorer does not support 'event.preventDefault();'...
					return false;  // ...but 'return false;'
					
					break;
					
				case keyCode.UP_ARROW:
				case keyCode.RIGHT_ARROW:
					methods.setViewport({
						'caller': 'key',
						'type': 'zoom',
						'zoomLevelDelta' : -settings.zoomLevelDelta  // Zoom out
					});
					
					if (event.preventDefault) event.preventDefault();  // Internet Explorer does not support 'event.preventDefault();'...
					return false;  // ...but 'return false;'
					
					break;
			}
		},


		click: function (event) {  // TADA!
			methods.monitor({'last event': 'click'});
			// Fix event for Internet Explorer
			if (!event) event = window.event;  // W3C/Netscape: the event is passed as function argument, Internet Explorer: uses window.event
			var target = event.target || event.srcElement;  // The element the event took place on (W3C/Netscape: target, Microsoft: srcElement)
			
			// methods.monitor({'last event': event.type});
			
			var delta = settings.zoomLevelDelta * (target.id == settings.zoomlevelButtonIncreaseId ? -1 : +1) // Zoom in/out
			
			// Change direction of double click zoom to direction of zoom
			doubleClickZoom.direction = (delta > 0) ? -1: +1;  // TODO: Not working
			
			methods.setViewport({
				'caller': 'button',
				'type': 'zoom',
				'zoomLevelDelta' : delta
			});
			
			if (event.preventDefault) event.preventDefault();  // Internet Explorer does not support 'event.preventDefault();'...
			return false;  // ...but 'return false;'
			
		},


		mouseWheel: function (event) {  // TADA!
			methods.monitor({'last event': 'mouseWheel'});
			// SEE: <http://www.javascriptkit.com/javatutors/onmousewheel.shtml>, <http://www.adomas.org/javascript-mouse-wheel/>
			
			// Fix event for Internet Explorer
			if (!event) event = window.event;  // W3C/Netscape: the event is passed as function argument, Internet Explorer: uses window.event
			
			// var delta = deltaX = deltaY = 0;
			// 
			// // Old school scrollwheel delta
			// 		    if (event.wheelDelta) delta = event.wheelDelta / 120;
			// 		    if (event.detail) delta = -event.detail / 3;
			// 
		    // // New school multidimensional scroll (touchpads) deltas
		    // deltaY = delta;
		    // 
		    // // Gecko
		    // if ( event.axis !== undefined && event.axis === event.HORIZONTAL_AXIS ) {
		    //     deltaY = 0;
		    //     deltaX = -1 * delta;
		    // }
		    // 
		    // // Webkit
		    // if (event.wheelDeltaY !== undefined) deltaY = event.wheelDeltaY / 120;
		    // if (event.wheelDeltaX !== undefined) deltaX = -1*event.wheelDeltaX / 120;
		
			// Old school scrollwheel delta
			var delta = (event.detail ? event.detail / 3 : -event.wheelDelta / 120);
			
			// Change direction of double click zoom to direction of zoom
			doubleClickZoom.direction = (delta > 0) ? -1: +1;
			
			methods.setViewport({
				'caller': 'mousewheel',
				'type': 'zoom',
				'zoomLevelDelta' : delta / 20,
				'pageX': event.pageX,
				'pageY': event.pageY
			});

			if (event.preventDefault) event.preventDefault();  // Internet Explorer does not support 'event.preventDefault();'...
			return false;  // ...but 'return false;'
		},


		doubleClick: function (event) {  // (ALMOST) TADA!
			methods.monitor({'last event': 'doubleClick'});
			// Fix event for Internet Explorer
			if (!event) event = window.event;  // W3C/Netscape: the event is passed as function argument, Internet Explorer: uses window.event
			var target = event.target || event.srcElement;  // The element the event took place on (W3C/Netscape: target, Microsoft: srcElement)
						
			var namedZoomLevelsSequenceLength = namedZoomLevels.sequence.length
			
			if (doubleClickZoom.direction > 0) {  // Forward: zoom in
				var index = 0;
				while (index++ < namedZoomLevelsSequenceLength) {
					var zoomLevel = namedZoomLevels[namedZoomLevels.sequence[index]]();
					if (zoomLevel < viewport.zoom.level) break; 
				}
				if (index == namedZoomLevelsSequenceLength - 1) doubleClickZoom.direction = -1;
				
			} else {  // Backwards: zoom out
				var index = namedZoomLevelsSequenceLength;
				while (index--) {
					var zoomLevel = namedZoomLevels[namedZoomLevels.sequence[index]]();
					if (zoomLevel > viewport.zoom.level) break; 
				}
				if (index == 0) doubleClickZoom.direction = +1;
			}

			methods.setViewport({
				'caller': 'doubleClick',
				'type': 'zoom',
				'zoomLevel' : zoomLevel,
				'target': target,
				'pageX': (event.changedTouches) ? event.changedTouches[0].pageX : event.pageX,
				'pageY': (event.changedTouches) ? event.changedTouches[0].pageY : event.pageY
			});
		},



		//
		// Zoom level slider
		//
		setSlider: function (zoomLevel) {  // TADA!
			methods.monitor({'last type': 'setSlider (zoomLevel = ' + zoomLevel + ')'});
			// Normalize value
			var range = settings.minZoomLevel - settings.maxZoomLevel,
				left = 1 - zoomLevel / range;  // @1 - zoomLevel: Swap left & right (minimum has higher value than maximum)
			zoomLevelSliderElement.firstChild.style.left = 100 * left + '%';
		},
		
		sliderMouseDown: function (event) {
			methods.monitor({'last event': 'sliderMouseDown'});
			
			// Fix event for Internet Explorer
			if (!event) event = window.event;  // W3C/Netscape: the event is passed as function argument, Internet Explorer: uses window.event
			methods.monitor({'event.pageX': event.clientX});
						
			if (support.touch) {
				window.ontouchmove = methods.sliderMouseMove;
				window.ontouchend = methods.sliderMouseUp;
				// status.slider.pageX = event.touches[0].pageX;
				// status.slider.pageY = event.touches[0].pageY;
				status.slider.pageX = event.touches[0].clientX;
				// status.slider.pageY = event.touches[0].clientY;
			} else {
				methods.monitor({'huh': '?'})
				document.onmousemove = methods.sliderMouseMove;
				document.onmouseup = methods.sliderMouseUp;
				// status.slider.pageX = event.pageX;
				// status.slider.pageY = event.pageY;
				status.slider.pageX = event.clientX;
				// status.slider.pageY = event.clientY;
			}
			
			status.slider.width = zoomLevelSliderElement.offsetWidth;
			status.slider.left = parseFloat(zoomLevelSliderElement.firstChild.style.left, 10); // Percent

			if (event.preventDefault) event.preventDefault();  // Internet Explorer does not support 'event.preventDefault();'...
			return false;  // ...but 'return false;'
		},

		sliderMouseMove: function (event) {
			methods.monitor({'last event': 'sliderMouseMove'});
			// Fix event for Internet Explorer
			if (!event) event = window.event;  // W3C/Netscape: the event is passed as function argument, Internet Explorer: uses window.event
			methods.monitor({'event.pageX': event.clientX});
			var range = settings.minZoomLevel - settings.maxZoomLevel,
				// left = min(1, max(0, (0.01 * status.slider.left + (((support.touch) ? event.touches[0].pageX : event.pageX) - status.slider.pageX) / status.slider.width))),
				left = min(1, max(0, (0.01 * status.slider.left + (((support.touch) ? event.touches[0].pageX : event.clientX) - status.slider.pageX) / status.slider.width))),
				zoomLevel = (1 - left) * range;
			methods.monitor({'status.slider.pageX': status.slider.pageX})
			methods.setSlider(zoomLevel);
			methods.setViewport({
				'caller': 'slider',
				'type': 'zoom',
				'zoomLevel': zoomLevel
			});
			
			if (event.preventDefault) event.preventDefault();  // Internet Explorer does not support 'event.preventDefault();'...
			return false;  // ...but 'return false;'
		},

		sliderMouseUp: function (event) {
			methods.monitor({'last event': 'sliderMouseUp'});
			// Fix event for Internet Explorer
			if (!event) event = window.event;  // W3C/Netscape: the event is passed as function argument, Internet Explorer: uses window.event
			
			if (support.touch) {
				window.ontouchmove = null;
				window.ontouchend = null;
			} else {
				document.onmousemove = null;
				document.onmouseup = null;
			}
			
			if (event.preventDefault) event.preventDefault();  // Internet Explorer does not support 'event.preventDefault();'...
			return false;  // ...but 'return false;'
		},
		
		
		
		//
		// Calculate normalized (=upscaled) image positions (offscreen)
		//
		arrangeImages: function () {  // TADA!
			
			// Calculate overall area of all images combined together (without padding)
			var overallWidth = 0,
				maxImageWidth = 0;
			var index = imagesLength = universe.images.length;
			while (index--) {
				overallWidth += universe.images[index].width;
				maxImageWidth = max(maxImageWidth, universe.images[index].width);
			}
			var overallArea = overallWidth * settings.maxRowHeight;
			
			var targetRowsLength,
				targetUniverseHeight,
				targetWidth;
				
			// Calculate required number of rows
			switch (settings.layout) {
				case 'square':
					targetRowsLength = floor(sqrt(overallArea) / settings.maxRowHeight);
					targetUniverseHeight = targetRowsLength * settings.maxRowHeight;
					break;
				case 'triangle':
					targetRowsLength = floor(sqrt(overallArea * sqrt(3)) / settings.maxRowHeight);
					targetUniverseHeight = targetRowsLength * settings.maxRowHeight;
					break;
				case 'circle':
					var radius = sqrt(overallArea / PI);
					targetRowsLength = floor(2 * radius / settings.maxRowHeight);
					targetUniverseHeight = targetRowsLength * settings.maxRowHeight;
					break;
				case 'ellipse':
					var aspectRatio = 4/3;
						radius = sqrt(overallArea / PI / aspectRatio);
					targetRowsLength = floor(2 * radius / aspectRatio / settings.maxRowHeight);
					targetUniverseHeight = aspectRatio * targetRowsLength * settings.maxRowHeight;
					break;
			}
			
			var targetRowWidth = 0,
				widthExtension = 0;
			
			var iterations = 0;
			
			while (true) {
			
				iterations++;
				
				var widthExtensionIncrement = 0,
					maxRowWidth = 0;
					
				// Array containing row objects
				var rows = [];
				
				// Loop over all images
				index = imagesLength;
				while (index--) {
					
					var imageIndex = imagesLength - 1 - index,
						imageWidth = universe.images[imageIndex].width;
						
					if ((!imageIndex)  // First image
							|| (row.width + imageWidth) > targetRowWidth + widthExtension  // or row too wide
							&& rows.length <= targetRowsLength) {  // and not too many rows					
							
						if (imageIndex) {  // Not first image
							// Append current row
							rows.push(row);
							maxRowWidth = max(maxRowWidth, row.width);
							widthExtensionIncrement = (widthExtensionIncrement)
								? min(widthExtensionIncrement, row.width + universe.images[imageIndex].width - targetRowWidth - widthExtension)
								: row.width + universe.images[imageIndex].width - targetRowWidth - widthExtension;
						}
						
						// Calculate row width for current row
						if (rows.length == targetRowsLength) {
							// targetRowWidth = -1;  // Too many rows -> ignore row width  // CLEANUP: BREAK LOOP?
							widthExtension += widthExtensionIncrement;
						} else {
							switch (settings.layout) {
								case 'square':
									targetRowWidth = targetUniverseHeight;
									break;
								
								case 'triangle':
									targetRowWidth = rows.length / targetRowsLength * targetUniverseHeight * 2 / sqrt(3)
									break;
								
								case 'circle':
									// var angle = asin(2 * (rows.length - 0.5 * (targetRowsLength - 1)) / targetRowsLength);
									// targetRowWidth = targetUniverseHeight * cos(angle);
									
									// PERFORMANCE OPTIMIZATION: Exponential version below faster than trigonometric version above
									// x^2 / r^2 + y^2 / r^2 = 1
									// r = h / 2
									// y = r * 2 * (rowIndex - (rowCount - 1) / 2) / rowCount
									// x = sqrt(r^2 - y^2)
									// w = 2 * x
									var y = targetUniverseHeight * (rows.length - 0.5 * (targetRowsLength - 1)) / targetRowsLength;  
									targetRowWidth = 2 * sqrt(targetUniverseHeight * targetUniverseHeight / 4 - y * y);
									break;
									
								case 'ellipse':
									// PERFORMANCE OPTIMIZATION: as for 'circle' above
									// x^2 / a^2 + y^2 / b^2 = 1
									var y = targetUniverseHeight * (rows.length - 0.5 * (targetRowsLength - 1)) / targetRowsLength;
									targetRowWidth = 2 * aspectRatio * aspectRatio * sqrt(targetUniverseHeight * targetUniverseHeight / 4 - y * y);
									break;
							}							
						}
					
						// Begin new row
						var row = {
							width: 0,
							imageOrder: []
						}					
					}
					// Append image to row
					row.width += imageWidth;
					row.imageOrder.push(imagesLength - 1 - index);				
				}
				
				rows.push(row);
				maxRowWidth = max(maxRowWidth, row.width);
				
				if (rows.length <= targetRowsLength || iterations > 999) break;
			}
			
			// Position images
			universe.width = 0;
			universe.height = 0;
			
			var image,
				rowIndex = rows.length
			
			while (rowIndex--) {
				
				var row = rows[rowIndex],
					left = round((maxRowWidth - row.width) / 2),
					imageIndex = rowImageOrderLength = row.imageOrder.length;
					
				while (imageIndex--) {
					
					if (!settings.serpentine || rowIndex % 2 == 0) {  // Even row
						image = universe.images[row.imageOrder[rowImageOrderLength - imageIndex - 1]];
					} else {  // Odd row
						image = universe.images[row.imageOrder[imageIndex]];
					}
					
					image.left = left;
					image.top = rowIndex * settings.maxRowHeight;
					
					// Add gap
					image.left += (imageIndex < rowImageOrderLength - 1) ? settings.gapSize : 0;
					image.top += settings.gapSize * rowIndex;
					
					image.right = image.left + image.width;
					image.bottom = image.top + image.height;
					
					universe.width = max(universe.width, image.right);
					universe.height = max(universe.height, image.bottom);
					
					left = image.right;
				}
			}
		},



		//
		//	Digest various pan & zoom flavours and calculate viewport position & size
		//
		setViewport: function(mode) {
			// Structure of mode argument:
			//
			// mode =  <object> {
			//     caller: <string> [ doubleclick | initialize | slider | mousewheel | button | key | mousemove | inertiamove | touchmove ],
			//     type: <string> [ pan | zoom | smartzoom | panandzoom ],
			//     zoomFactor: <number>, 
			//     zoomLevel: <number>,
			//     zoomLevelDelta: <number>,
			//     zoomName: <string>,
			//     target: <object>,
			//     pageX: <number>,
			//     pageY: <number>
			// }
			//
			// Expected caller->type combinations (11x):
			//              |    zoom    |    pan     | panandzoom |
			// doubleclick  |     *      |            |            | 
			// initialize   |     *      |            |            | universe centered to viewport
			// slider       |     *      |            |            | zoom by level
			// mousewheel   |     *      |            |            | zoom by levelDelta
			// button       |     *      |            |            | zoom by levelDelta = settings.zoomLevelDelta
			// key          |     *      |            |            | zoom by levelDelta = settings.zoomLevelDelta
			// mousemove    |            |     *      |            |
			// inertiamove  |            |     o      |            |
			// touchmove    |            |     *      |     o      |
			
			
			// Remember the last viewport position & size
			viewport.last.left = viewport.left;
			viewport.last.top = viewport.top;
			viewport.last.width = viewport.width;
			viewport.last.height = viewport.height;
			
			
			if (mode.type != 'pan') {  // zoom || panandzoom
			
				// Get new zoom level from mode argument
				if (mode.zoomFactor) {  // Absolute zoom factor
					viewport.zoom.level = -log(mode.zoomFactor) * LN2Inv;
				} else if (mode.zoomLevel != undefined) {  // Absolute zoom level (has to be tested against undefined because mode.zoom.level can be 0)
					viewport.zoom.level = mode.zoomLevel;
				} else if (mode.zoomLevelDelta) {  // Relative zoom level
					viewport.zoom.level += mode.zoomLevelDelta;
				} else if (mode.zoomName) {  // Named zoom level
					viewport.zoom.level = namedZoomLevels[(mode.zoomName)]();
				}
				
				
				// Validate zoom level
				viewport.zoom.level = min(settings.minZoomLevel, max(viewport.zoom.level, settings.maxZoomLevel));
				
				
				// Calculate all variations of the zoom value
				viewport.zoom.factorInv = pow(2, viewport.zoom.level);  // The reciprocal value of the plain multiplier
				viewport.zoom.factor = 1 / viewport.zoom.factorInv;  // The plain multiplier
				viewport.zoom.levelStep = floor(viewport.zoom.level);  // The integer part of the reciprocal value of the plain multiplier on a logarithmic scale
				viewport.zoom.factorStepInv = pow(2, viewport.zoom.levelStep);  // The reciprocal value of the tile multiplier 
				viewport.zoom.factorStep = 1 / viewport.zoom.factorStepInv;  // The tile multiplier
				
				
				// Get normalized (= upscaled) viewport dimensions
				viewport.width = viewportElement.offsetWidth * viewport.zoom.factorInv;  // @offsetWidth: http://www.csscripting.com/css-multi-column/dom-width-height.php
				viewport.height = viewportElement.offsetHeight * viewport.zoom.factorInv;
				
				// Normalize center of viewport
				var centerX = ((mode.pageX) ? mode.pageX / viewportElement.offsetWidth : 0.5),// @0.5:  Default center of zoom to center of viewport
					centerY = ((mode.pageY) ? mode.pageY / viewportElement.offsetHeight : 0.5);
					
				// Move slider
				if (mode.caller != 'slider') methods.setSlider(viewport.zoom.level);    // Method was not called from slider
			
			}
			
			switch (mode.type) {
				
				case 'pan':
					// mouse gestures
					// one-finger touch gestures
					// inertia
					viewport.left = status.gestureStart.viewportX + status.gestureStart.viewportLeft - mode.pageX * viewport.zoom.factorInv;
					viewport.top = status.gestureStart.viewportY + status.gestureStart.viewportTop - mode.pageY * viewport.zoom.factorInv;

					break;
				
				case 'zoom':
					if (mode.zoomName == 'fitAll') { // mode.caller = initialize || key	|| doubleclick
					
						// Calculate normalized (= upscaled) viewport position (centered on screen)
						viewport.left = (universe.width - viewport.width) * 0.5;  // (Unscaled, aggregated rect of all images - upscaled viewport rect) / 2
						viewport.top = (universe.height - viewport.height) * 0.5;
					
					} else { // mousewheel | slider | buttons
					
						// Calculate normalized (= upscaled) viewport position (centered around zoom center)
						// Step 1: universeZoomCenterX = viewport.left + viewport.last.width * mode.zoom.centerX;  // Normalize zoom center to universe
						// Step 2: viewport.left = universeZoomCenterX - viewport.width * mode.zoom.centerX // Calculate new viewport position
						// Step 3: viewport.left = viewport.left + viewport.last.width * mode.zoom.centerX - viewport.width * mode.zoom.centerX  // Subsitute universeZoomCenterX
						viewport.left += (viewport.last.width - viewport.width) * centerX;  // Step 4: Rearrange expression
						viewport.top += (viewport.last.height - viewport.height) * centerY;
					
					}
					
					break;
				
				case 'panandzoom':  // two-finger touch gestures.
				
					viewport.left += (viewport.last.width - viewport.width) * centerX;
					viewport.top += (viewport.last.height - viewport.height) * centerY;
					
					break;
				
				
			}

			viewport.right = viewport.left + viewport.width;
			viewport.bottom = viewport.top + viewport.height;
			
			methods.redraw(mode);
			
		},



		//
		// Modify DOM elements
		//
		redraw: function (mode) {
			
			// Get current time to calculate panning & zooming speed
			var now = new Date().getTime();
			
			
			// Clear possibly pending timeout
			if (redrawTimeout) {
				clearTimeout(redrawTimeout);
				redrawTimeout = undefined;
			}
			
			
			/*** DEVELOPMENT ONLY ***/
			// // Display frame rate
			// if (event && event.type == 'timeout') {
			// 	frameRate.lastRedrawTime = undefined;
			// }
			// if (frameRate.lastRedrawTime) {
			// 	if (frameRate.samples.length >= frameRate.sampleSize) frameRate.samples.shift();
			// 	frameRate.samples.push(1000 / (now - frameRate.lastRedrawTime));
			// 	
			// 	var sample,
			// 		sampleSize = frameRate.samples.length,
			// 		sum = 0,
			// 		frameRateMax,
			// 		frameRateAvg,
			// 		frameRateMin;
			// 		
			// 	var index = sampleSize;
			// 	while (index--) {  // PERFORMANCE OPTIMIZATION
			// 		sample = frameRate.samples[index]
			// 		if (!frameRateMax || sample > frameRateMax) frameRateMax = sample;
			// 		if (!frameRateMin || sample < frameRateMin) frameRateMin = sample;
			// 		sum += sample;
			// 	}				
			// 	frameRateAvg = sum / sampleSize;
			// 
			// 	methods.monitor({'frameRate min / avg / max // last': 
			// 		(round(frameRateMin * 10) / 10) + ' / ' + 
			// 		(round(frameRateAvg * 10) / 10) + ' / ' + 
			// 		(round(frameRateMax * 10) / 10) + ' // ' + 
			// 		(round(sample * 10) / 10)});
			// }
			// frameRate.lastRedrawTime = now;
			/*** DEVELOPMENT ***/
			
			var viewportPanned = viewport.last.left != viewport.left || viewport.last.top != viewport.top,
				viewportZoomed = viewport.last.width != viewport.width || viewport.last.height != viewport.height;
			
			var appendBackgrounds = !backgroundsElement.childNodes.length || (!support.transform && viewportZoomed),  // No images have been inserted until now
				appendTiles = viewport.zoom.levelStep <= 4 && (mode.type == 'timeout' || settings.redrawTimeout == 0);
			
			if (support.transform) {
				
				if (appendBackgrounds || appendTiles) {
					
					if (appendBackgrounds) {
						var backgroundsDocumentFragment = document.createDocumentFragment();
						var widgetsDocumentFragment = document.createDocumentFragment();
					}
					if (appendTiles) {
						var tilesDocumentFragment = document.createDocumentFragment();
					}
					
					// Calculate tile scaling factor based on tile level
					var levelFactorInv = viewport.zoom.factorStepInv * viewport.zoom.factor;
				
				
					// Loop over all images add elements to document fragments 
					var index = imagesLength = universe.images.length;
				
					while (index--) {
					
						var imageIndex = imagesLength - 1 - index,
							image = universe.images[imageIndex];
					
						if (appendBackgrounds) {  // Append normalized (= upscaled) backgrounds
						
							var positionAndSize = 'left:' + image.left
								+ 'px;top:' + image.top
								+ 'px;width:' + image.width
								+ 'px;height:' + image.height + 'px;';
						
							var img = document.createElement('img');
							img.className = 'universe-image-background';  // IE-FIX REQUIRED?: is img.setAttribute('class', 'universe-image-background') not working in IE <= 7 ??
							img.id = 'image-' + (imageIndex);
							img.src = WP_INSTALL_URL + 'wp-content/uploads/universe/' + image.filename + '/x64.jpeg';
							img.style.cssText = positionAndSize + 'background-color:#' + image.backgroundColor;
							img.alt = '';
							backgroundsDocumentFragment.appendChild(img);
							
							if (image.video) {  // Append widget
								
								var widget = {
									'imageId':  image.id,
								 	'imageIndex': imageIndex
								}
								
								var a = document.createElement('a');	
								a.className = 'showVideo';
								a.id = 'showVideo-' + image.video;
								a.href = '#showVideo2';
								
								if (support.touch) {
									a.ontouchstart = function () { status.showVideo.panned = false};
									a.ontouchmove = function () { status.showVideo.panned = true};
									a.ontouchend = methods.showVideo;
								} else {
									a.onmousedown = function () { status.showVideo.panned = false};
									a.onmousemove = function () { status.showVideo.panned = true};
									a.onmouseup = methods.showVideo;
									
								}
								a.onclick = methods.preventDefault;
								
								var img = document.createElement('img');
								img.src = WP_TEMPLATE_URL_PATH + 'styles/play-button_2x.png';
								img.alt = '';
								a.appendChild(img);
								
								universe.widgets[universe.widgets.length] = widget;
								
								widgetsDocumentFragment.appendChild(a);
							}
						}
						
						if (appendTiles && methods.isOnscreen(image)) {  // Append normalized (= upscaled) tiles
							
							var colCount = ceil(round(image.width * viewport.zoom.factorStep) / settings.tileSize),
								rowCount = ceil(round(image.height * viewport.zoom.factorStep) / settings.tileSize),
								lastColTileSize = image.width - (colCount - 1) * settings.tileSize * viewport.zoom.factorStepInv,
								lastRowTileSize = image.height - (rowCount - 1) * settings.tileSize * viewport.zoom.factorStepInv;

							var tileIndex = colCount * rowCount;
							while (tileIndex--) {
								
								var colIndex = tileIndex % colCount,
									rowIndex = floor(tileIndex / colCount);

								// Calculate normalized (= upscaled) tile dimensions
								var tileLeft = colIndex * settings.tileSize * viewport.zoom.factorStepInv,
									tileTop = rowIndex * settings.tileSize * viewport.zoom.factorStepInv,
									tileWidth = (colIndex + 1 < colCount) ?  settings.tileSize * viewport.zoom.factorStepInv : lastColTileSize,  // Far right or bottom tiles might not be full size
									tileHeight = (rowIndex + 1 < rowCount) ? settings.tileSize * viewport.zoom.factorStepInv : lastRowTileSize;

								var tile = {'left': image.left + tileLeft,
									'top': image.top + tileTop,
									'right': image.left + (tileLeft + tileWidth),
									'bottom': image.top + (tileTop + tileHeight)};

								if (methods.isOnscreen(tile) ) {  // Tile is at least partially inside the viewport
									
									var tileSignature = image.id + '-' + viewport.zoom.levelStep + '-' + tileIndex,
										isTileLoaded = loadedTiles[tileSignature],  // Contains signatures of all zoom levels
										isTileInserted = insertedTiles[tileSignature];  // Contains only signatures of the current zoom level 
										
									if (!isTileInserted) {
										var img = document.createElement('img');
										img.className = 'universe-image-tile image-' + (imagesLength - 1 - index);
										img.src = WP_INSTALL_URL + 'wp-content/uploads/universe/' + image.filename + '/' + viewport.zoom.levelStep + '/'+ ('0000' + tileIndex).substr(tileIndex.toString().length, 4) + '.jpeg';
										img.style.cssText =
											  'left:' + (image.left + tileLeft)
											+ 'px;top:' + (image.top + tileTop)
											+ 'px;width:' + tileWidth
											+ 'px;height:' + tileHeight + 'px;';
											
										tilesDocumentFragment.appendChild(img);
										if (!isTileLoaded) { loadedTiles[tileSignature] = true; }
										insertedTiles[tileSignature] = true
									}
								}							
							}
						}  // END: appendTiles && methods.isOnscreen(image)
						
					}
					
					if (appendBackgrounds) {  // Initial redraw
						backgroundsElement.appendChild(backgroundsDocumentFragment);
						widgetsElement.appendChild(widgetsDocumentFragment)
					}
					if (appendTiles) {  // Initial & consecutive redraws
						tilesElement.appendChild(tilesDocumentFragment);
					}
									
				}
				
				if (viewportZoomed) {  // Scale widgets (video button)
					
					var index = universe.widgets.length;
					
					while (viewportZoomed && index--) {  // Widgets are not transformed to avoid any scaling due to rounding errors (and preserve image quality)
					
						var widget = universe.widgets[index],
							image = universe.images[widget.imageIndex];
					
						if (appendBackgrounds) widget.element = document.getElementById('showVideo-' + image.video);  // Initial redraw
					
						if (viewport.zoom.level < 7) {
							// Calculate actual (scaled) image position
							var imageLeft = round(image.left * viewport.zoom.factor),
								imageTop = round(image.top * viewport.zoom.factor),
								imageWidth = round(image.width * viewport.zoom.factor),
								imageHeight = round(image.height * viewport.zoom.factor);
						
							// var scaledShowVideoButtonSize = (viewport.zoom.level < 4) ? settings.showVideoButtonSize : settings.showVideoButtonSize * viewport.zoom.factor * 16;  // @16: pow(2, 4)
							var scaledShowVideoButtonSize = settings.showVideoButtonSize * min(1, viewport.zoom.factor * 10);
							
							// a element
							widget.element.style.cssText = 'display: block; left:' + (imageLeft + round(0.5 * (imageWidth - scaledShowVideoButtonSize)))
								+ 'px;top:' + (imageTop + round(0.5 * (imageHeight - scaledShowVideoButtonSize))) + 'px;';
							// img element
							widget.element.firstChild.style.cssText = 'width:' + scaledShowVideoButtonSize
								+ 'px;height:' + scaledShowVideoButtonSize + 'px;';
						} else {
							widget.element.style.cssText = 'display: none;';
						}
					}
				}
				
				if (viewportPanned) universeElement.style[support.transform] = 'translate(' + (-viewport.left * viewport.zoom.factor) + 'px,' + (-viewport.top * viewport.zoom.factor) + 'px)';
				if (viewportZoomed) imagesElement.style[support.transform] = 'scale(' + viewport.zoom.factor + ')';

			} else {  // END: if (support.transform)
				
				if (appendBackgrounds || appendTiles) {  // Initial display or after zoom
				
					if (appendBackgrounds || viewportZoomed) {
						var backgroundsDocumentFragment = document.createDocumentFragment();
						var widgetsDocumentFragment = document.createDocumentFragment();
						insertedTiles = [];
					}
					if (appendTiles) {
						var tilesDocumentFragment = document.createDocumentFragment();
					}
					
					// Calculate tile scaling factor based on tile level
					var levelFactorInv = viewport.zoom.factorStepInv * viewport.zoom.factor;
					var videoCount = 0;/*!!!*/
					
					// Loop over all images add elements to document fragments 
					var index = imagesLength = universe.images.length;
					while (index--) {
						
						var imageIndex = imagesLength - 1 - index,
							image = universe.images[imageIndex];
						
						// Calculate actual (scaled) image position
						var imageLeft = round(image.left * viewport.zoom.factor), //+ universe.actualWidthPadding);
							imageTop = round(image.top * viewport.zoom.factor), // + universe.actualHeightPadding);
							imageWidth = round(image.width * viewport.zoom.factor),
							imageHeight = round(image.height * viewport.zoom.factor);
						
						if (appendBackgrounds) {  // Append scaled backgrounds
							
							var	positionAndSize = 'left:' + imageLeft
								+ 'px;top:' + imageTop
								+ 'px;width:' + imageWidth
								+ 'px;height:' + imageHeight + 'px;';
								
							var img = document.createElement('img');
							img.className = 'universe-image-background';  // IE-FIX REQUIRED?: is img.setAttribute('class', 'universe-image-background') not working in IE <= 7 ??
							img.id = 'image-' + (imageIndex);
							img.src = WP_INSTALL_URL + 'wp-content/uploads/universe/' + image.filename + '/x64.jpeg';
							img.style.cssText = positionAndSize + 'background-color:#' + image.backgroundColor;
							img.alt = '' + viewport.zoom.factor;
							backgroundsDocumentFragment.appendChild(img);
							
							if (image.video) {  // Append widget
								videoCount++
								var widget = {
									'imageId':  image.id,
								 	'imageIndex': imageIndex
								}
								
								var a = document.createElement('a');	
								a.className = 'showVideo';
								a.id = 'showVideo-' + image.video;
								a.href = '#showVideo2';
								
								if (support.touch) {
									a.ontouchstart = function () { status.showVideo.panned = false};
									a.ontouchmove = function () { status.showVideo.panned = true};
									a.ontouchend = methods.showVideo;
								} else {
									a.onmousedown = function () { status.showVideo.panned = false};
									a.onmousemove = function () { status.showVideo.panned = true};
									a.onmouseup = methods.showVideo;
									
								}
								a.onclick = methods.preventDefault;
								
								var img = document.createElement('img');
								img.src = WP_TEMPLATE_URL_PATH + 'styles/play-button_2x.png';
								img.alt = '';
								a.appendChild(img);
								
								universe.widgets[universe.widgets.length] = widget;
								
								widgetsDocumentFragment.appendChild(a);
							}
							methods.monitor({'videoCount': videoCount});
							jQuery.log('Foooo')
						}
						
						if (appendTiles && methods.isOnscreen(image)) {  // Append normalized (= upscaled) tiles
							
							var colCount = ceil(round(image.width * viewport.zoom.factorStep) / settings.tileSize),
								rowCount = ceil(round(image.height * viewport.zoom.factorStep) / settings.tileSize),
								lastColTileSize = image.width - (colCount - 1) * settings.tileSize * viewport.zoom.factorStepInv,
								lastRowTileSize = image.height - (rowCount - 1) * settings.tileSize * viewport.zoom.factorStepInv;
							
							var tileIndex = colCount * rowCount;
							while (tileIndex--) {
								
								var colIndex = tileIndex % colCount,
									rowIndex = floor(tileIndex / colCount);

								// Calculate normalized (= upscaled) tile dimensions
								var tileLeft = colIndex * settings.tileSize * viewport.zoom.factorStepInv,
									tileTop = rowIndex * settings.tileSize * viewport.zoom.factorStepInv,
									tileWidth = (colIndex + 1 < colCount) ?  settings.tileSize * viewport.zoom.factorStepInv : lastColTileSize,  // Far right or bottom tiles might not be full size
									tileHeight = (rowIndex + 1 < rowCount) ? settings.tileSize * viewport.zoom.factorStepInv : lastRowTileSize;

								var tile = {'left': image.left + tileLeft,
									'top': image.top + tileTop,
									'right': image.left + (tileLeft + tileWidth),
									'bottom': image.top + (tileTop + tileHeight)};
									
								if (methods.isOnscreen(tile) ) {  // Tile is at least partially inside the viewport
									
									var tileSignature = image.id + '-' + viewport.zoom.levelStep + '-' + tileIndex,
										isTileLoaded = loadedTiles[tileSignature],  // Contains signatures of all zoom levels
										isTileInserted = insertedTiles[tileSignature];  // Contains only signatures of the current zoom level 
										
									if (!isTileInserted) {
										var foo = levelFactorInv * viewport.zoom.factorStep;
										var img = document.createElement('img');
										img.className = 'universe-image-tile image-' + imageIndex;
										img.src = WP_INSTALL_URL + 'wp-content/uploads/universe/' + image.filename + '/' + viewport.zoom.levelStep + '/'+ ('0000' + tileIndex).substr(tileIndex.toString().length, 4) + '.jpeg';
										img.style.cssText =
											//   'left:' + (image.left + tileLeft)
											// + 'px;top:' + (image.top + tileTop)
											// + 'px;width:' + tileWidth
											// + 'px;height:' + tileHeight + 'px;';
											  'left:' + (round(imageLeft) + round(foo * tileLeft))
											+ 'px;top:' + (round(imageTop) + round(foo * tileTop))
											+ 'px;width:' + round(foo * tileWidth + foo * tileLeft - round(foo * tileLeft))  // Add rounding difference to avoid gaps.
											+ 'px;height:' + round(foo * tileHeight + foo * tileTop - round(foo * tileTop)) + 'px;';
											
										tilesDocumentFragment.appendChild(img);
										if (!isTileLoaded) { loadedTiles[tileSignature] = true; }
										insertedTiles[tileSignature] = true
									}
								}							
							}
						}  // END: appendTiles && methods.isOnscreen(image)
					}
					if (viewportZoomed) {
						backgroundsElement.innerHTML = '';
						tilesElement.innerHTML = '';
						widgetsElement.innerHTML = '';
					}
					if (appendBackgrounds) {  // Initial redraw
						backgroundsElement.appendChild(backgroundsDocumentFragment);
						widgetsElement.appendChild(widgetsDocumentFragment)
					}
					if (appendTiles) {  // Initial & consecutive redraws
						tilesElement.appendChild(tilesDocumentFragment);
					}
				}
				
				if (viewportZoomed) {  // Scale widgets (video button)
					
					var index = universe.widgets.length;
					
					while (viewportZoomed && index--) {  // Widgets are not transformed to avoid any scaling due to rounding errors (and preserve image quality)
					
						var widget = universe.widgets[index],
							image = universe.images[widget.imageIndex];
					
						if (appendBackgrounds) widget.element = document.getElementById('showVideo-' + image.video);  // Initial redraw
					
						if (viewport.zoom.level < 7) {
							// Calculate actual (scaled) image position
							var imageLeft = round(image.left * viewport.zoom.factor),
								imageTop = round(image.top * viewport.zoom.factor),
								imageWidth = round(image.width * viewport.zoom.factor),
								imageHeight = round(image.height * viewport.zoom.factor);
						
							// var scaledShowVideoButtonSize = (viewport.zoom.level < 4) ? settings.showVideoButtonSize : settings.showVideoButtonSize * viewport.zoom.factor * 16;  // @16: pow(2, 4)
							var scaledShowVideoButtonSize = settings.showVideoButtonSize * min(1, viewport.zoom.factor * 10);
							
							// a element
							widget.element.style.cssText = 'display: block; left:' + (imageLeft + round(0.5 * (imageWidth - scaledShowVideoButtonSize)))
								+ 'px;top:' + (imageTop + round(0.5 * (imageHeight - scaledShowVideoButtonSize))) + 'px;';
							// img element
							widget.element.firstChild.style.cssText = 'width:' + scaledShowVideoButtonSize
								+ 'px;height:' + scaledShowVideoButtonSize + 'px;';
						} else {
							widget.element.style.cssText = 'display: none;';
						}
					}
				}
				
				
				// if (viewportPanned) universeElement.style[support.transform] = 'translate(' + (-viewport.left * viewport.zoom.factor) + 'px,' + (-viewport.top * viewport.zoom.factor) + 'px)';
				if (viewportPanned) {
					// universeElement.style['left'] = (-viewport.left * viewport.zoom.factor) + 'px';
					// universeElement.style['top'] = (-viewport.top * viewport.zoom.factor) + 'px';
					// alert(viewport);
					universeElement.style.left = (-viewport.left * viewport.zoom.factor) + 'px';
					universeElement.style.top = (-viewport.top * viewport.zoom.factor) + 'px';
				}
				
				// 	
				// 	while (index--) {
				// 					
				// 		var imageIndex = imagesLength - 1 - index,
				// 			image = universe.images[imageIndex];
				// 							
				// 		// Calculate actual (scaled) image position
				// 		imageLeft = round(image.left * viewport.zoom.factor + universe.actualWidthPadding);
				// 		imageTop = round(image.top * viewport.zoom.factor + universe.actualHeightPadding);
				// 					
				// 		if (appendBackgrounds) {  // Append scaled backgrounds
				// 		
				// 			var imageWidth = round(image.width * viewport.zoom.factor),
				// 				imageHeight = round(image.height * viewport.zoom.factor),
				// 				positionAndSize = 'left:' + imageLeft
				// 					+ 'px;top:' + imageTop
				// 					+ 'px;width:' + imageWidth
				// 					+ 'px;height:' + imageHeight + 'px;';
				// 					
				// 			var img = document.createElement('img');
				// 			img.className = 'universe-image-background';  // IE-FIX REQUIRED?: is img.setAttribute('class', 'universe-image-background') not working in IE <= 7 ??
				// 			img.id = 'image-' + (imagesLength - 1 - index);
				// 			img.src = 'images/' + image.basepath + image.filename + '/x64.jpeg';
				// 			img.style.cssText = positionAndSize + 'background-color:#' + image.backgroundColor;
				// 			img.alt = '';
				// 			backgroundsElement.appendChild(img);
				// 			
				// 			
				// 		}  // END: if (replaceBackgrounds)
				// 		
				// 	}  // END while(index--)
				// 	
				// 	if (appendBackgrounds) {
				// 		imagesElement.style.width = universe.width + 'px';
				// 		imagesElement.style.height = universe.height + 'px';
				// 		imagesElement.appendChild(imagesDocumentFragment);
				// 	}
				// }
			}
			
			// Call this method again later: tiles 
			if (mode.type != 'timeout' && settings.redrawTimeout != 0) {
				// redrawTimeout = setTimeout(methods.redraw, settings.redrawTimeout, { type: 'timeout' });  // Redraw after timeout.
				redrawTimeout = setTimeout(   // Redraw after timeout.
					function() {
						methods.redraw({ type: 'timeout' })
					},
					settings.redrawTimeout
				);
			}
			// NOTE: Internet Explorer does note allow passing parameters to a function called with setTimeout
			// setTimeout(func, delay, [param1, param2, ...]);
			// setTimeout(function(){ func(param1, param2, ...) }, delay);  // Internet Explorer
			
			
			if (WP_DEBUG) {
				
				methods.monitor({
					'appendBackgrounds': appendBackgrounds,
					'appendTiles': appendTiles,
					'loadedTiles.length': countProperties(loadedTiles),
					'viewportZoomed': viewportZoomed,
					'viewport.zoom.level': viewport.zoom.level,
					'viewport.zoom.factor': viewport.zoom.factor
				});
			}
		},



		isOnscreen: function (image) {
			
			return viewport.top < image.bottom
					&& viewport.bottom > image.top
					&& viewport.left < image.right
					&& viewport.right > image.left
		},



		showVideo: function (event) {
			
			if (!event) var event = window.event;

			if (!status.showVideo.panned) {
			
			
				var target = event.target || event.srcElement,  // The element the event took place on (W3C/Netscape: target, Microsoft: srcElement)
					parentNode = target.parentNode || target.parentElement  // The parent node (W3C/Netscape: parentNode, Microsoft: parentElement)
			
				var videoId = parentNode.getAttribute('id').substr(10);
			
				// Calculate size
				var aspectRatio = 640 / 390,
					windowWidth = viewportElement.offsetWidth,
					windowHeight = viewportElement.offsetHeight;
				
				if (windowWidth < 640) {
					var windowAspectRatio = windowWidth / windowHeight;
					var padding = 100;
					var videoWidth,
						videoHeight;
					if (aspectRatio > windowAspectRatio) { // video wider: use windowWidth
						videoWidth = windowWidth - padding;
						videoHeight = round((windowWidth - padding) / aspectRatio);
					} else { // video taller: use windowHeight
						videoWidth = round((windowHeight - padding) * aspectRatio);
						videoHeight = windowHeight - padding;
					}
				} else {
					var videoWidth = 640,
						videoHeight = 390;
				}
				
				// Create inline frame
				var iframe = document.createElement('iframe');
				iframe.src = 'http://www.youtube.com/embed/' + videoId + '?modestbranding=1&autoplay=1&fs=1&rel=0';  // TODO @autoplay=1: Autoplay does not work on Safari Mobile
				//&html5=0&modestbranding=1
				//&enablejsapi=1&origin=http://www.viennapaint.com
				
				iframe.width = videoWidth;
				iframe.height = videoHeight;
				iframe.className = 'video';
				iframe.setAttribute('allowfullscreen', 'true');
				iframe.style.marginLeft = -Math.round(videoWidth / 2) + 'px';
				iframe.style.marginTop = -Math.round(videoHeight / 2) + 'px';
				videosElement.appendChild(iframe);
			
				// Create close button
				// <a href="#close" class="close" onclick="s_objectID=&quot;http://www.apple.com/retail/grandcentral/#close_2&quot;;return this.s_oc?this.s_oc(e):true">Close</a>
				var a = document.createElement('a');
				a.href='#close';
				a.className = 'close replace-image';
				a.style.marginLeft = Math.round(videoWidth / 2) - 15 + 'px';
				a.style.marginTop = -Math.round(videoHeight / 2) - 15 + 'px';
				a.appendChild(document.createTextNode('Close'));
				a.onclick = methods.hideVideo;
				videosElement.appendChild(a);
				
				// Show video
				dimmerElement.className = '';
				videosElement.className = '';
			}
			
			if (event.preventDefault) event.preventDefault();
			return false;
		},



		hideVideo: function(event) {
			
			if (!event) var event = window.event;
			
			var video = videosElement.firstChild;
			
			while(video) {
			    videosElement.removeChild(video);
				video = videosElement.firstChild;
			}
			
			dimmerElement.className = 'hidden';
			videosElement.className = 'hidden';
			
			if (event.preventDefault) event.preventDefault();
			return false;
		},



		showInfo: function (event, element) {
			// jQuery.log(['showInfo', element.id]);
			var infoElement = document.getElementById('universe-info');
			infoElement.className = '';  // Remove 'hidden' class
			
			var infoBoxSize = 16,
				infoBoxMargin = 4;
				index = parseInt(element.id.substr(6), 10),
				image = universe.images[index];
			
			// jQuery.log(element.id)	
				
			// Calculate actual (scaled) image position
			var imageLeft = round(image.left * viewport.zoom.factor + universe.actualWidthPadding),
				imageTop = round(image.top * viewport.zoom.factor + universe.actualHeightPadding),
				imageWidth = round(image.width * viewport.zoom.factor),
				imageHeight = round(image.height * viewport.zoom.factor);
			
			var positionAndSize = 'left:' + (imageLeft + imageWidth - infoBoxSize - infoBoxMargin)
					+ 'px;top:' + (imageTop + imageHeight - infoBoxSize - infoBoxMargin)
					+ 'px;width:' + infoBoxSize
					+ 'px;height:' + infoBoxSize + 'px;';
					
			infoElement.style.cssText = positionAndSize;
			
				
			// jQuery.log(image);
			
		// 	// event.currentTarget.find('.info').fadeIn();
		// 	// $(event.currentTarget).find('.info').animate('opacity', .5);
		// 	// console.log();
		// 	// // Take care of compatibility issues
		// 	// if (!event) var event = window.event; // The event (W3C/Netscape: e, Microsoft: window.event)
		// 	// var target = (window.event) ? event.srcElement : event.target; // The element the event took place on (W3C/Netscape: target, Microsoft: srcElement)
		// 	// var relatedTarget = (event.relatedTarget) ? event.relatedTarget : event.fromElement;  // Element the mouse moved from (W3C/Netscape: fromElement, Microsoft: relatedTarget)
		// 	// 
		// 	// // The mouse moves from the related target to the target
		// 	// if (!methods.isChild(target, relatedTarget) || element != target) return			
		},



		hideInfo: function (event) {
			// jQuery.log('hideInfo');
			var infoElement = document.getElementById('universe-info');
			infoElement.className = 'hidden';
		// 	event.currentTarget.find('.info').fadeOut();
		// 	
		// 	// // Take care of compatibility issues
		// 	// if (!event) var event = window.event; // The event (W3C/Netscape: e, Microsoft: window.event)
		// 	// var target = (window.event) ? event.srcElement : event.target; // The element the event took place on (W3C/Netscape: target, Microsoft: srcElement)
		// 	// var relatedTarget = (event.relatedTarget) ? event.relatedTarget : event.toElement;  // Element the mouse moved to (W3C/Netscape: toElement, Microsoft: relatedTarget)
		// 	// 
		// 	// // The mouse moves from the target to the related target
		// 	// if (!methods.isChild(target, relatedTarget) || element != target) return
		},
	
	
	
		preventDefault: function (event) {
			
			if (!event) var event = window.event;
			
			if (event.preventDefault) event.preventDefault();
			return false;
			
		},



		monitor: function (values) {
			
			// return;
			
			// Default display
			// monitor['$viewport.width'] = $viewport.width();
			// monitor['$viewport.height'] = $viewport.height();
			// monitor['viewport.zoom.factor'] = viewport.zoom.factor;
			// monitor['universe.left / .top'] = round(universe.left) + 'px / ' + round(universe.top) + 'px';
			// monitor['viewport.zoom.factorInv'] = viewport.zoom.factorInv;
			// monitor['viewport.zoom.level'] = viewport.zoom.level;
			// monitor['viewport.zoom.levelStep'] = viewport.zoom.levelStep;
			// monitor['viewport.zoom.factorStepInv'] = viewport.zoom.factorStepInv;
			// monitor['document size'] = document.width + ' / ' + document.height;
			// monitor['universe.width / height'] = universe.width + 'px / ' + universe.height + 'px';
			// monitor['universe.height'] = universe.height * viewport.zoom.factor;
			
			// Merge/extend
			for (var caption in values) {
				monitor[caption] = values[caption];
			}
			
			// Display as HTML table
			var html = '<table>';
			for (var caption in monitor) {
				html += '<tr><td class="key">' + caption + ':</td><td class="value">' + monitor[caption] + '</td></tr>';
			} 
			html += '</table>';			
			$('#monitor .content').html(html);
		}
	
	
	
	};



})(jQuery, window, document);  // Pass the jQuery object to this function


jQuery.log = function(message) {
	if(window.console) {
		console.log(message);
	} // else {
	// 		alert(message);
	// 	}
};