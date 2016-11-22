jQuery(document).ready(function (e) {

	// console.log('WP_DEBUG = ' + WP_DEBUG);

	// Extend $.support object
	$.support.touch = 'ontouchend' in document;
	
	var $body = $('#body');
	$body.addClass($.support.touch ? 'touch' : 'click');
	
	// // Bind menu handler to element
	// var isTouchMenuVisible = false;
	// console.log(isTouchMenuVisible)
	// // $('#navigation-collapsed').click( toggleCollapsedMenu );
	//
	
	/**
	 * Menu bar metrics
	 *                            |width| Max | Min
	 * #logotype                  | 145 |  *  |  *
	 * #navigation-left           | 236 |  *  |
	 * #zoomlevel-button-decrease |  20 |  *  |
	 * #zoomlevel-slider          | 125 |  *  |  *
	 * #zoomlevel-button-increase |  40 |  *  |
	 * #navigation-right          | 241 |  *  | 
	 * #navigation-collapsed      |  72 |     |  *
	 *                                  | 807 | 342     
	 */	
	/** NEW
	 * Menu bar metrics
	 *                            |width| Max | Min
	 * #logotype                  | 145 |  *  |  * OK
	 * #navigation-left           | 241 |  *  |
	 * #zoomlevel-button-decrease |  25 |  *  |
	 * #zoomlevel-slider          | 100 |  *  |  *
	 * #zoomlevel-button-increase |  45 |  *  |
	 * #navigation-right          | 241 |  *  | 
	 * #navigation-collapsed      |  72 |     |  *
	 *                                  | 797 | 265     
	 */	var INCLUDE_MARGIN = true,
		menuBar = {
			'items' : {
				'logotype': {
					'width': $('#logotype').outerWidth(INCLUDE_MARGIN),
					'isHidden': false
				},
				'navigation-left': {
					'width': $('#navigation-left').outerWidth(INCLUDE_MARGIN),
					'isHidden': false
				},
				'zoomlevel-button-decrease': {
					'width': $('#zoomlevel-button-decrease').outerWidth(INCLUDE_MARGIN),
					'isHidden': false
				},
				'zoomlevel-slider': {
					'minWidth': 100,  // Was 100
					'maxWidth': 175,
					'isHidden': false
				},
				'zoomlevel-button-increase': {
					'width': $('#zoomlevel-button-increase').outerWidth(INCLUDE_MARGIN),
					'isHidden': false
				},
				'navigation-right': {
					'width': $('#navigation-right').outerWidth(INCLUDE_MARGIN),
					'isHidden': false
				},
				'navigation-collapsed': {
					'width': $('#navigation-collapsed').outerWidth(INCLUDE_MARGIN),
					'isHidden': true
				}
			},
			'itemSets' : [
				{ 'items': ['logotype', 'zoomlevel-slider', 'navigation-collapsed'] },  // Min
				// { 'items': ['logotype', 'navigation-left', 'zoomlevel-slider', 'navigation-collapsed'] },
				{ 'items': ['logotype', 'navigation-left', 'zoomlevel-slider', 'navigation-right'] },
				{ 'items': ['logotype', 'navigation-left', 'zoomlevel-button-decrease', 'zoomlevel-slider', 'zoomlevel-button-increase', 'navigation-right'] } // Max
			],
			'currentSet': -1
		}
	
	// console.log("$('#navigation-collapsed').outerWidth(INCLUDE_MARGIN) = " + $('#navigation-collapsed').outerWidth(INCLUDE_MARGIN))
	// Add two more keys to each menu bar item
	var menuBarItemSetsCount = menuBar.itemSets.length;
	for (var key in menuBar.items) {
		// menuBar.items[key].isHidden = false;
		menuBar.items[key].isInItemSet = Array(menuBarItemSetsCount);
	}
	
	// Iterate over menu bar item sets aggregate widths and populate isInItemSet Array
	var i = menuBarItemSetsCount,
		j;
	
	while (i--) {
		j = menuBar.itemSets[i].items.length;
		// var foo = '';
		menuBar.itemSets[i].minWidth = 0;
		while (j--) {
			menuBar.itemSets[i].minWidth += menuBar.items[menuBar.itemSets[i].items[j]].minWidth || menuBar.items[menuBar.itemSets[i].items[j]].width;
			menuBar.items[menuBar.itemSets[i].items[j]].isInItemSet[i] = true;
			// foo += ' ' + (menuBar.items[menuBar.itemSets[i].items[j]].minWidth || menuBar.items[menuBar.itemSets[i].items[j]].width);
		}
		// console.log('menuBar.itemSets[' + i + '].minWidth = ' + menuBar.itemSets[i].minWidth + foo);
	}
		
	// Ajust menu to click/touch & screen width
	adjustLayout();
	window.onresize = adjustLayout;
	window.onorientationchange = adjustLayout;
	
	// Show/hide menu elements
	function adjustLayout(event) {
 
		$('html').width(window.innerWidth);  // SEE: http://julio-ody.tumblr.com/post/38211623350/mobile-safari-device-width-height-orientationchange-bug
		
		// Set class of body element to portrait/landscape + touch/click
		if (document.body.clientWidth < document.body.clientHeight) {
			var addClasses = 'portrait',
				removeClasses = 'landscape';
		} else {
			var removeClasses = 'portrait',
				addClasses = 'landscape';
		}
		if (document.body.clientWidth < 480) {
			addClasses += ' narrow';
			removeClasses += ' wide';
		} else {
			removeClasses += ' narrow';
			addClasses += ' wide';
		}
		$body.removeClass(removeClasses).addClass(addClasses);
		
		if ($.support.touch) window.scrollTo(0, 1);
		
		
		// Find menu bar item set that fits into available width
		i = menuBarItemSetsCount;
		while (i--) {
			// console.log('menuBar.itemSets[' + i + '].minWidth = ' + menuBar.itemSets[i].minWidth);
 			if (document.body.clientWidth > menuBar.itemSets[i].minWidth) {
				// console.log(i);
				break;
			}
		}
		// i = 0;
		// console.log('document.body.clientWidth = ' + document.body.clientWidth);
		// console.log('menuBar.currentSet = ' + menuBar.currentSet);
		// Show/hide menu bar items accordingly
		if (menuBar.currentSet != i) {
			
			menuBar.currentSet = i;
			
			if (menuBar.currentSet == 0) {
				$('#navigation').addClass('collapsed');
				// $('#zoomlevel').addClass('collapsed');
			} else {
				$('#navigation').removeClass('collapsed');
				// $('#zoomlevel').removeClass('collapsed');
			}
			
			// var j = menuBarItemSetsCount;
			for (var key in menuBar.items) {
				var menuBarItem = menuBar.items[key]
				if (menuBarItem.isInItemSet[i] && menuBarItem.isHidden) {
					$('#' + key).removeClass('hidden');
					menuBarItem.isHidden =  false;
				} else if (!menuBarItem.isInItemSet[i] && !menuBarItem.isHidden) {
					$('#' + key).addClass('hidden');
					menuBarItem.isHidden =  true;
				}				
			}
		}
		
		// Adjust width of zoom level slider
		$('#zoomlevel-slider').css('width', 
			Math.min(menuBar.items['zoomlevel-slider'].maxWidth, 
			document.body.clientWidth - menuBar.itemSets[menuBar.currentSet].minWidth + menuBar.items['zoomlevel-slider'].maxWidth - menuBar.items['zoomlevel-slider'].minWidth + 20) + 'px');
	}
	
	
	var isCollapsed = true;
	document.getElementById('navigation-collapsed').onclick = function (event) {  // FireFox needs the event handler for event.preventDefault()
	
		if (isCollapsed) {  // Show
			$('#navigation-left').removeClass('hidden');
			$('#navigation-right').removeClass('hidden');
			isCollapsed = false;			
		} else {  // Hide
			$('#navigation-left').addClass('hidden');
			$('#navigation-right').addClass('hidden');
			isCollapsed = true;
		}
	
		// Don't follow link
		if (event.preventDefault) event.preventDefault();  // Internet Explorer does not support 'event.preventDefault();'...
		return false;  // ...but 'return false;'
	}
	
	
	// Initialize viewport
	var universe = $('#universe-viewport').universe();
	
	
	// Set initial display of secondary menu level (the page has not be rendered yet).
	var navigation = $('.navigation.has-children').each(function () {
		
		var $this = $(this),
			$level2 = $this.find('.level-2'),
			$dropshadow = $this.find('.dropshadow').css({ 'width': $level2.width(), 'height': 0 }),
			height = $level2.height(),
			isShown = false;
			
		$level2.css({ 'visibility': 'visible', 'height': 0 });
		
		
		function showLevel() {  // Mouseover
			$level2.stop().animate(
				{ 'height': height },
				{ step: function (now, fx) {
						$dropshadow.css('height', now); 
					}
				}
			);
			return false;
		}
		function hideLevel () {  // Mouseout
			$level2.stop().animate(
				{ 'height': 0 },
				{ step: function (now, fx) {
						$dropshadow.css('height', now);
					}
				}
			);
			return false;
		}
		
		if ($.support.touch) {
			$this.find('a').click(function () {
				showLevel();
				
				var preventDefault = isShown;
				isShown = true;
				
				return preventDefault;
			});
		} else {
			$this.hover(
				showLevel,
				hideLevel
			);
		}
	});




});

/**
2011.10.04: Removed browser dependencies from mousewheelPrecision
 */