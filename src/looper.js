/** ===========================================================================
 * Looper.js | a jQuery plugin - v1.1.5
 * Copyright 2013 Ry Racherbaumer
 * http://rygine.com/projects/looper.js
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ======================================================================== **/

;(function($, window, document, undefined) {

    "use strict";

    // css transition support detection
    var cssTransitionSupport = (function(){

            // body element
        var body = document.body || document.documentElement,

            // transition events with names
            transEndEvents = {
                'transition'      : 'transitionend',
                'WebkitTransition': 'webkitTransitionEnd',
                'MozTransition'   : 'transitionend',
                'MsTransition'    : 'MSTransitionEnd',
                'OTransition'     : 'oTransitionEnd otransitionend'
            }, name;

        // check for each transition type
        for (name in transEndEvents){

            // if transition type is supported
            if (body.style[name] !== undefined) {

                // return transition end event name
                return transEndEvents[name];
            }
        }

        // css transitions are not supported
        return false;

    })();

    // class definition
    var Looper = function(element, options) {

        this.$element = $(element);
        this.options = options;
        this.looping = false;

        // self-reference
        var self = this;

        // setup keyboard accessibility
        this.$element.attr('tabindex', 0)

            // use keydown, keypress not reliable in IE
            .keydown(function(e){

                // handle key
                switch (e.which) {

                    // left arrow
                    case 37:

                        // go to previous item
                        self.prev();
                        break;

                    // right arrow
                    case 39:

                        // go to next item
                        self.next();
                        break;

                    // give control back to browser for other keys
                    default: return;
                }

                // prevent browser default action
                e.preventDefault();
            })

            // ARIA
            .find('.item').attr('aria-hidden', true);

        // setup pause on hover
        this.options.pause === 'hover' && this.$element
            .on('mouseenter', $.proxy(this.pause, this))
            .on('mouseleave', $.proxy(this.loop, this));

        // trigger init event
        this.$element.trigger('init');

    };

    // class prototype definition
    Looper.prototype = {

        /**
         * Start auto-loop of items
         * @param e
         * @return Looper
         */
        loop: function(e) {

            if (!e) this.paused = false;

            // check for interval
            if (this.interval) {

                // remove interval
                clearInterval(this.interval);
                this.interval = null;
            }

            // setup new loop interval
            if (this.options.interval && !this.paused)
                this.interval = setInterval($.proxy(this.next, this), this.options.interval);

            // return reference to self for chaining
            return this;

        },

        /**
         * Pause auto-loop of items
         * @param e
         * @return Looper
         */
        pause: function(e) {

            if (!e) this.paused = true;

            if (this.$element.find('.next, .prev').length && cssTransitionSupport) {
                this.$element.trigger(cssTransitionSupport);
                this.loop();
            }

            // remove interval
            clearInterval(this.interval);
            this.interval = null;

            // return reference to self for chaining
            return this;

        },

        /**
         * Show next item
         * @return Looper
         */
        next: function() {

            // return if looping
            if (this.looping) return this;

            // go to next item
            return this.go('next');

        },

        /**
         * Show previous item
         * @return Looper
         */
        prev: function() {

            // return if looping
            if (this.looping) return this;

            // go to previous item
            return this.go('prev');

        },

        /**
         * Show item at specified position
         * @param pos
         * @return Looper
         */
        to: function(pos) {

            // return if looping
            if (this.looping) return this;

            // zero-base the position
            --pos;

            var // all items
                $items = this.$element.find('.item'),
                // active item
                $active = $items.filter('.active'),
                // active position
                activePos = $items.index($active);

            // return if position is out of range
            if (pos > ($items.length - 1) || pos < 0) return this;

            // if position is already active
            if (activePos == pos)

                // restart loop
                return this.pause().loop();

            // show item at position
            return this.go($($items[pos]));

        },

        /**
         * Show item
         * @param to
         * @return Looper
         */
        go: function(to) {

            // return if looping
            if (this.looping) return this;

            // all items
            var $items = this.$element.find('.item');

            // if no items, do nothing
            if (!$items.length) return this;

                // active item
            var $active = $items.filter('.active'),

                // active position
                activePos = $items.index($active),

                // next item to show
                $next = typeof to == 'string' ? $active[to]() : to,

                // next position
                nextPos = $items.index($next),

                // is there an auto-loop?
                isLooping = this.interval,

                // direction of next item
                direction = typeof to == 'string'
                    ? to
                    : ((activePos == -1 && nextPos == -1) || nextPos > activePos
                        ? 'next'
                        : 'prev'),

                // fallback if next item not found
                fallback = direction == 'next' ? 'first' : 'last',

                // self-reference
                that = this,

                // finish
                complete = function(active, next, direction) {

                    // if not looping, already complete
                    if (!this.looping) return;

                    // set looping status to false
                    this.looping = false;

                    // update item classes
                    active.removeClass('active go ' + direction)
                        // update ARIA state
                        .attr('aria-hidden', true);
                    next.removeClass('go ' + direction).addClass('active')
                        // update ARIA state
                        .removeAttr('aria-hidden');

                    // custom event
                    var e = $.Event('shown', {
                        // related target is new active item
                        relatedTarget: next[0],
                        // related index is the index of the new active item
                        relatedIndex: $items.index(next)
                    });

                    // trigger shown event
                    this.$element.trigger(e);
                };

            // ensure next element
            $next = $next && $next.length ? $next : $items[fallback]();

            // return if next element is already active
            if ($next.hasClass('active')) return this;

            // custom event
            var e = $.Event('show', {
                // related target is next item to show
                relatedTarget: $next[0],
                relatedIndex: $items.index($next[0])
            });

            // trigger show event
            this.$element.trigger(e);

            // return if the event was canceled
            if (e.isDefaultPrevented()) return this;

            // set looping status to true
            this.looping = true;

            // if auto-looping, pause loop
            if (isLooping) this.pause();

            // if using a slide or cross-fade
            if (this.$element.hasClass('slide') || this.$element.hasClass('xfade')) {

                // if css transition support
                if (cssTransitionSupport) {

                    // add direction class to active and next item
                    $next.addClass(direction);
                    $active.addClass('go ' + direction);

                    // force re-flow on next item
                    $next[0].offsetWidth;

                    // add go class to next item
                    $next.addClass('go');

                    // finish after transition
                    this.$element.one(cssTransitionSupport, function() {

                        // weird CSS transition when element is initially hidden
                        // may cause this event to fire twice with invalid $active
                        // element on first run
                        if (!$active.length) return;
                        complete.call(that, $active, $next, direction);
                    });

                    // ensure finish
                    setTimeout(function() {
                        complete.call(that, $active, $next, direction);
                    }, this.options.speed);

                // no css transition support, use jQuery animation fallback
                } else {

                    // setup animations
                    var active = {},
                        activeStyle,
                        next = {},
                        nextStyle;

                    // save original inline styles
                    activeStyle = $active.attr('style');
                    nextStyle = $next.attr('style');

                    // cross-fade
                    if (this.$element.hasClass('xfade')) {
                        active['opacity'] = 0;
                        next['opacity'] = 1;
                        $next.css('opacity', 0); // IE8
                    }

                    // slide
                    if (this.$element.hasClass('slide')) {
                        if (this.$element.hasClass('up')) {
                            active['top'] = direction == 'next' ? '-100%' : '100%';
                            next['top'] = 0;
                        } else if (this.$element.hasClass('down')) {
                            active['top'] = direction == 'next' ? '100%' : '-100%';
                            next['top'] = 0;
                        } else if (this.$element.hasClass('right')) {
                            active['left'] = direction == 'next' ? '100%' : '-100%';
                            next['left'] = 0;
                        } else {
                            active['left'] = direction == 'next' ? '-100%' : '100%';
                            next['left'] = 0;
                        }
                    }

                    $next.addClass(direction);

                    // do animations
                    $active.animate(active, this.options.speed);
                    $next.animate(next, this.options.speed, function(){

                        // finish
                        complete.call(that, $active, $next, direction);

                        // reset inline styles
                        $active.attr('style', activeStyle || '');
                        $next.attr('style', nextStyle || '');
                    });

                }

            // no animation
            } else {

                // finish
                complete.call(that, $active, $next, direction);
            }

            // if auto-looping
            if ((isLooping || (!isLooping && this.options.interval))

                // and, no argument
                && (!to

                    // or, argument not equal to pause option
                    || (typeof to == 'string' && to !== this.options.pause)

                    // or, argument is valid element object and pause option not equal to "to"
                    || (to.length && this.options.pause !== 'to')))

                // start/resume loop
                this.loop();

            // return reference to self for chaining
            return this;
        }

    };

    // plugin definition
    $.fn.looper = function(option) {

        // looper arguments
        var looperArgs = arguments;

        // for each matched element
        return this.each(function() {

            var $this = $(this),
                looper = $this.data('looperjs'),
                options = $.extend({}, $.fn.looper.defaults, $.isPlainObject(option) ? option : {}),
                action = typeof option == 'string' ? option : option.looper,
                args = option.args || (looperArgs.length > 1 && Array.prototype.slice.call(looperArgs, 1));

            // ensure looper plugin
            if (!looper) $this.data('looperjs', (looper = new Looper(this, options)));

            // go to position if number
            if (typeof option == 'number') looper.to(option);

            // execute method if string
            else if (action) {

                // with arguments
                if (args) looper[action].apply(looper, args.length ? args : ('' + args).split(','));

                // without arguments
                else looper[action]();
            }

            // if there's an interval, start the auto-loop
            else if (options.interval) looper.loop()

            // otherwise, go to first item in the loop
            else looper.go();

        });

    };

    // default options
    $.fn.looper.defaults = {

        // auto-loop interval
        interval: 5000,

        // when to pause auto-loop
        pause: 'hover',

        // css transition speed (must match css definition)
        speed: 500
    };

    // constructor
    $.fn.looper.Constructor = Looper;

    // data api
    $(function() {

        // delegate click event on elements with data-looper attribute
        $('body').on('click.looper', '[data-looper]', function(e) {

            var $this = $(this);

            // ignore the go method
            if ($this.data('looper') == 'go') return;

                // get element target via data (or href) attribute
            var href, $target = $($this.data('target')
                    || (href = $this.attr('href')) && href.replace(/.*(?=#[^\s]+$)/, '')), //strip for ie7

                // setup options
                options = $.extend({}, $target.data(), $this.data());

            // start looper plugin
            $target.looper(options);

            // prevent default event
            e.preventDefault();

        });

        // auto-init plugin
        $('[data-looper="go"]').each(function(){
            var $this = $(this);
            $this.looper($this.data());
        });

    });

})(jQuery, window, document);
