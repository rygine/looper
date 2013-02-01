/** ===========================================================================
 * Cycle.js | a jQuery plugin - v1.1.0
 * Copyright 2013 Ry Racherbaumer
 * http://rygine.com/projects/cycle.js
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
    var Cycle = function(element, options) {
        this.$element = $(element);
        this.options = options;
        this.cycling = false;

        // self-reference
        var self = this;

        // setup ARIA accessibility
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
            .find('.item').attr('aria-hidden', true);

        // setup pause on hover
        this.options.pause === 'hover' && this.$element
            .on('mouseenter', $.proxy(this.pause, this))
            .on('mouseleave', $.proxy(this.cycle, this));

        // trigger init event
        this.$element.trigger('init');
    };

    // class prototype definition
    Cycle.prototype = {

        /**
         * Start auto-cycle of items
         * @param e
         * @return Cycle
         */
        cycle: function(e) {
            if (!e) this.paused = false;

            // check for interval
            if (this.interval) {

                // remove interval
                clearInterval(this.interval);
                this.interval = null;
            }

            // setup new cycle interval
            if (this.options.interval && !this.paused)
                this.interval = setInterval($.proxy(this.next, this), this.options.interval);

            // return reference to self for chaining
            return this;
        },

        /**
         * Pause auto-cycle of items
         * @param e
         * @return Cycle
         */
        pause: function(e) {
            if (!e) this.paused = true;
            if (this.$element.find('.next, .prev').length && cssTransitionSupport) {
                this.$element.trigger(cssTransitionSupport);
                this.cycle();
            }

            // remove interval
            clearInterval(this.interval);
            this.interval = null;

            // return reference to self for chaining
            return this;
        },

        /**
         * Show next item
         * @return Cycle
         */
        next: function() {
            // return if cycling
            if (this.cycling) return this;

            // go to next item
            return this.go('next');
        },

        /**
         * Show previous item
         * @return Cycle
         */
        prev: function() {
            // return if cycling
            if (this.cycling) return this;

            // go to previous item
            return this.go('prev');
        },

        /**
         * Show item at specified position
         * @param pos
         * @return Cycle
         */
        to: function(pos) {
            // zero-base the position
            --pos;

            var // all items
                $items = this.$element.find('.item'),
                // active item
                $active = $items.filter('.active'),
                // active position
                activePos = $items.index($active),
                // self-reference
                that = this;

            // return if position is out of range
            if (pos > ($items.length - 1) || pos < 0) return this;

            // if cycling
            if (this.cycling)
                // go to item after done
                return this.$element.one('cycled', function() {
                    that.to(pos);
                });

            // if position is already active
            if (activePos == pos)
                // restart cycle
                return this.pause().cycle();

            // show item at position
            return this.go($($items[pos]));
        },

        /**
         * Cycle to item
         * @param to
         * @return Cycle
         */
        go: function(to) {
            // wait for current cycle to finish
            if (this.cycling) return this;

                // all items
            var $items = this.$element.find('.item'),
                // active item
                $active = $items.filter('.active'),
                // active position
                activePos = $items.index($active),
                // next item to show
                $next = typeof to == 'string' ? $active[to]() : to,
                // next position
                nextPos = $items.index($next),
                // is there an auto-cycle?
                isCycling = this.interval,
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
                // complete the cycle
                complete = function(active, next, direction) {

                    // if not cycling, already complete
                    if (!this.cycling) return;

                    // set cycling status to false
                    this.cycling = false;

                    // update item classes
                    active.removeClass('active go ' + direction)
                        // update ARIA state
                        .attr('aria-hidden', true);
                    next.removeClass('go ' + direction).addClass('active')
                        // update ARIA state
                        .removeAttr('aria-hidden');

                    // custom event
                    var e = $.Event('cycled', {
                        // related target is new active item
                        relatedTarget: next[0],
                        // related index is the index of the new active item
                        relatedIndex: $items.index(next)
                    });

                    // trigger cycled event
                    this.$element.trigger(e);
                };

            // ensure next element
            $next = $next && $next.length ? $next : $items[fallback]();

            // return if next element is already active
            if ($next.hasClass('active')) return this;

            // custom event
            var e = $.Event('cycle', {
                // related target is next item to show
                relatedTarget: $next[0],
                relatedIndex: $items.index($next[0])
            });

            // trigger cycle event
            this.$element.trigger(e);

            // return if the event was canceled
            if (e.isDefaultPrevented()) return this;

            // set cycling status to true
            this.cycling = true;

            // if auto-cycling, pause cycle
            if (isCycling) this.pause();

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

                    // complete cycle after transition
                    this.$element.one(cssTransitionSupport, function() {

                        // weird CSS transition when cycle element is initially hidden
                        // make cause this event to first twice with invalid $active
                        // element on first run
                        if (!$active.length) return;
                        complete.call(that, $active, $next, direction);
                    });

                    // ensure that cycle is completed
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

                        // complete cycle
                        complete.call(that, $active, $next, direction);

                        // reset inline styles
                        $active.attr('style', activeStyle || '');
                        $next.attr('style', nextStyle || '');
                    });

                }

            // no animation
            } else {

                // complete cycle
                complete.call(that, $active, $next, direction);
            }

            // if auto-cycling
            if ((isCycling || (!isCycling && this.options.interval))
                // and, no argument
                && (!to
                    // or, argument not equal to pause option
                    || (typeof to == 'string' && to !== this.options.pause)
                    // or, argument is valid element object and pause option not equal to "to"
                    || (to.length && this.options.pause !== 'to')))
                // start/resume cycle
                this.cycle();

            // return reference to self for chaining
            return this;
        }

    };

    // plugin definition
    $.fn.cycle = function(option) {
        // cycle arguments
        var cycleArgs = arguments;

        // for each matched element
        return this.each(function() {
            var $this = $(this),
                cycle = $this.data('cyclejs'),
                options = $.extend({}, $.fn.cycle.defaults, typeof option == 'object' && option),
                action = typeof option == 'string' ? option : option.cycle,
                args = option.args || (cycleArgs.length > 1 && Array.prototype.slice.call(cycleArgs, 1));

            // ensure cycle plugin
            if (!cycle) $this.data('cyclejs', (cycle = new Cycle(this, options)));

            // go to position if number
            if (typeof option == 'number') cycle.to(option);

            // execute method if string
            else if (action) {

                // with arguments
                if (args) cycle[action].apply(cycle, args.length ? args : ('' + args).split(','));

                // without arguments
                else cycle[action]();
            }

            // if there's an interval, start the auto-cycle
            else if (options.interval) cycle.cycle();
        });
    };

    // default options
    $.fn.cycle.defaults = {
        // auto-cycle interval
        interval: 5000,
        // when to pause auto-cycle
        pause: 'hover',
        // css transition speed (must match css definition)
        speed: 500
    };

    // constructor
    $.fn.cycle.Constructor = Cycle;

    // data api
    $(function() {

        // delegate click event on elements with data-cycle attribute
        $('body').on('click.cycle', '[data-cycle]', function(e) {
            var $this = $(this);
            // ignore the init method
            if ($this.data('cycle') == 'go') return;
                // get element target via data (or href) attribute
            var href, $target = $($this.data('target')
                    || (href = $this.attr('href')) && href.replace(/.*(?=#[^\s]+$)/, '')), //strip for ie7
                // setup options
                options = $.extend({}, $target.data(), $this.data());

            // start cycle plugin
            $target.cycle(options);

            // prevent default event
            e.preventDefault();
        });

        // auto-init plugin
        $('[data-cycle="go"]').each(function(){
            var $this = $(this);
            $this.cycle($this.data());
        });

    });

})(jQuery, window, document);
