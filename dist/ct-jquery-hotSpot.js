/*
	@ ct-jquery.hotSpot.js
	---------------------------------------------------------------
	(Formerly known as $.fn.linkify)

	Purpose:

	Make a region (element) behave like a link.
	For accessibility, this function requires that
	the region contains a linked element.

	Usage:

	<div id="foo">
		<h2>Heading</h2>
		<p>Blurb</p>
		<p class="more"><a href="#">Read more</a></p>
	</div>

	<script type="text/javascript">
		$('.promo').hotSpot();
	</script>

	focusin/focusout tested and working in Chrome and IE8

	v 0.2 | DS 17.08.2012 (CFLRI)
	_______________________________________________________________
*/

	(function($) {

		/*jshint browser:true, jquery:true, strict:true, devel:true */
		"use strict";

		$.fn.hotSpot = function(options) {

			// PLUGIN DEFAULTS
			$.fn.hotSpot.defaults = {
				hotSpot_children: false, // a list of child elements which control the hotSpot || [false] for all child elements
				hotSpot_over_classname: 'hotSpot_over',
				hotSpot_over_target_link_callback_name: false, /* name of function to trigger */
				hotSpot_out_target_link_callback_name: false, /* name of function to trigger */
				hotSpot_click_target_link_callback_name: false, /* name of function to trigger */
				hotSpot_debug: false // false || true to enable visual highlighting and console logging
			};

			options = $.extend( $.fn.hotSpot.defaults, options );

			// PLUGIN LOOP
			return this.each(function() {

				var $hotSpot = $(this);

				// IF ALREADY ENHANCED, EXIT
				if ( $hotSpot.data('hotSpot') ) {
					return;
				}

				// GET ALL LINKS
				var $links = $hotSpot.find('a');

				// WHICH IS THE FIRST/HEADING LINK?
				// this is only important if there is more than one Read More link
				var $heading_link = $hotSpot.find('h2 a[href], h3 a[href], h4 a[href], h5 a[href], h6 a[href]').eq(0); /* first (heading) link, excluding anchors */
				// var heading_link_href = $heading_link.attr('href') || ''; // '' is fallback, even if no links in hotSpot

				// WHICH IS THE READ MORE LINK?
				var $more_link = $hotSpot.find('p.more>a[href]'); // link styled with arrow
				// var more_link_href = $more_link.eq(0).attr('href') || '';

				// WHICH LINK WILL WE TRIGGER?
				var $real_link = $(),
						$hotSpot_children;

				if ( $more_link.length === 1 ) {
					// if there is a single Read More link, use that as the hotSpot link (#4503)
					$real_link = $more_link;

					// because there's only one link, it's ok to make the entire hotSpot act as a single link
					if ( ! options.hotSpot_children ) {
						$hotSpot_children = $hotSpot;
					}
					// unless we don't want to do this, in which case only use the specified children
					else {
						$hotSpot_children = $hotSpot.find(options.hotSpot_children);
					}
				}
				else if ( $more_link.length > 1 && $heading_link.length ) {
					// else if there are multiple Read More links, then use the first link (the heading link) (#4503)
					// note that this excludes blocks with NO Read More links, because the editor should only link the heading if there is an accompanying Read More link
					$real_link = $heading_link;

					// because there's more than one link, it's not ok to make the entire hotSpot act as a single link
					// so if the hotSpot can only act as a single link, we cannot create the hotSpot
					if ( ! options.hotSpot_children ) {
						if ( options.hotSpot_debug ) {
							console.log( ' Cannot create hotSpot for ',  $hotSpot, ' - no hotSpot_children defined' );
						}
						return;
					}
					// so in this case only use the specified children, excluding .more links
					else {
						$hotSpot_children = $hotSpot.find(options.hotSpot_children).not('.more'); // http://api.jquery.com/add/
					}
				}

				// IF THERE IS NO LINK TO TRIGGER, THEN EXIT
				if ( ! $real_link.length ) {
					if ( options.hotSpot_debug ) {
						console.log( ' Cannot create hotSpot for ',  $hotSpot, ' - no link to trigger' );
					}
					return;
				}

				// IF THERE ARE ANY OTHER LINKS, THEN EXIT
				// this prevents a hotSpot being created on top of content links which point elsewhere
				var $other_links = $links.not($heading_link).not($more_link);

				if ( $hotSpot_children.find( $other_links ).length ) {
					if ( options.hotSpot_debug ) {
						console.log( ' Cannot create hotSpot for ',  $hotSpot, ' - other links inside' );
					}
					return;
				}

				// LINK TO TRIGGER
				var href = $real_link.attr('href');

				// ADD DATA TO HOTSPOT
				$hotSpot
				.data( 'hotSpot_real_link', $real_link )
				.data( 'hotSpot_href', href );

				// ADD CUSTOM EVENTS TO HOTSPOT SO WE CAN TRIGGER THESE,
				// EITHER FROM THE HOTSPOT ITSELF, OR FROM THE HOTSPOT CHILDREN
				// to test windows.status in Firefox: about:config > dom.disable_window_status_change

				$hotSpot
				.addClass('hotSpot')
				.bind( 'hotSpot.over', function() {
					$(this).addClass(options.hotSpot_over_classname);
					window.status = $(this).data('hotSpot_href');

					if ( options.hotSpot_over_target_link_callback_name ) {
						var target = $(this).data('hotSpot_real_link');
						$(target).trigger( options.hotSpot_over_target_link_callback_name ); // this is repeatedly triggering mouseenter on THIS element, as well as the real link, making this v slow
					}
				})
				.bind( 'hotSpot.out', function() {
					$(this).removeClass(options.hotSpot_over_classname);
					window.status = '';

					if ( options.hotSpot_out_target_link_callback_name ) {
						var target = $(this).data('hotSpot_real_link');
						$(target).trigger( options.hotSpot_out_target_link_callback_name ); // this is repeatedly triggering mouseenter on THIS element, as well as the real link, making this v slow
					}
				})
				.bind( 'hotSpot.click', function() {
					var target = $(this).data('hotSpot_real_link');
					$(target).trigger('click');

					if ( options.hotSpot_click_target_link_callback_name ) {
						$(target).trigger( options.hotSpot_click_target_link_callback_name ); // this is repeatedly triggering mouseenter on THIS element, as well as the real link, making this v slow
					}
				});

				if ( options.hotSpot_debug ) {
					$hotSpot.css('border', '1px dotted grey');
				}

				// ADD LISTENERS TO HOTSPOT / HOTSPOT CHILDREN

				$hotSpot_children
				.addClass('hotSpot_child')
				.bind( 'mouseenter focusin', function() {
					$hotSpot.trigger('hotSpot.over');
				})
				.bind( 'mouseleave focusout', function() {
					$hotSpot.trigger('hotSpot.out');
				})
				.bind( 'click', function() {
					$hotSpot.trigger('hotSpot.click');
				});

				if ( options.hotSpot_debug ) {
					$hotSpot_children.css('border', '1px dotted red');
				}

				// ADD LISTENERS TO REAL LINK
				// bind events to the real_link, so that we can trigger these from our faux link
				// this is so that any other events bound to the real_link by other functions (eg fades etc) are also fired
				$real_link
				.bind( 'click', function(evt) {
					// when this link is triggered
					if ( !evt.originalEvent ) {
						// jump to the link location
						window.location = $(this).attr('href');
						// prevent the event from bubbling up to the triggerer (creating a loop)
						evt.stopPropagation();
					}
				})
				.bind( 'mouseenter', function(evt) {
					// tested and working in FF3.6.7 for mouseenter functions bound after this function is set up
					if ( !evt.originalEvent ) {
						// prevent the event from bubbling up to the triggerer (creating a loop)
						evt.stopPropagation();
					}
				})
				.bind( 'mouseleave', function(evt) {
					// tested and working in FF3.6.7 for mouseleave functions bound after this function is set up
					if ( !evt.originalEvent ) {
						// prevent the event from bubbling up to the triggerer (creating a loop)
						evt.stopPropagation();
					}
				});

				// MARK AS DONE
				$hotSpot.data('hotSpot', true);

			});
		};
	})(jQuery);