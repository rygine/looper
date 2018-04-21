import { getTransitionEndEvent } from "./utils/getTransitionEvent";

const LEFT_ARROW = 37;
const RIGHT_ARROW = 39;
const HOVER_EVENT = "hover";
const CLICK_EVENT = "click";
const TRANSITION_SLIDE = "slide";
const TRANSITION_XFADE = "xfade";

const transitionEndEvent = getTransitionEndEvent();

// class definition
export class Looper {
  constructor(element, options) {
    this.element = element;
    this.options = Object.assign(
      {
        // auto-loop interval
        interval: 5000,
        // when to pause auto-loop
        pauseOn: HOVER_EVENT,
        // transition type
        transition: TRANSITION_SLIDE,
      },
      element.dataset || {},
      options
    );
    this.paused = true;
    this.transitioning = false;
    this.timeout = null;
    this.activeItemIndex = 0;
    this.items = Array.from(this.element.getElementsByClassName(".item"));
  }

  init() {
    // setup keyboard accessibility
    this.element.setAttribute("tabindex", 0);
    // use keydown, keypress not reliable in IE
    this.element.addEventListener("keydown", (event) => {
      // handle key
      switch (event.which) {
        // left arrow
        case LEFT_ARROW:
          // go to previous item
          this.prev();
          break;
        // right arrow
        case RIGHT_ARROW:
          // go to next item
          this.next();
          break;
        // give control back to browser for other keys
        default:
          return;
      }
      // prevent browser default action
      event.preventDefault();
    });
    // add ARIA hidden attributes
    this.items.forEach((item) => {
      item.setAttribute("aria-hidden", true);
    });
    // setup pause event
    switch (this.options.pauseOn) {
      case HOVER_EVENT:
        this.addEventListener("mouseenter", () => {
          this.pause();
        });
        this.addEventListener("mouseenter", () => {
          this.loop();
        });
        break;
      case CLICK_EVENT:
        this.element.addEventListener("click", () => {
          if (this.looping) {
            this.pause();
          } else {
            this.loop();
          }
        });
        break;
    }
    // trigger init event
    this.element.dispatchEvent(new Event("init"));
    // start
    this.loop();
  }

  clearTimeout() {
    clearTimeout(this.timeout);
    this.timeout = null;
  }

  /**
   * Start auto-loop of items
   * @return Looper
   */
  loop() {
    this.paused = false;
    this.clearTimeout();
    // setup new loop interval
    this.timeout = setTimeout(this.next.bind(this), this.options.interval);
    // return reference to self for chaining
    return this;
  }

  /**
   * Pause auto-loop of items
   * @return Looper
   */
  pause() {
    // set paused flag
    this.paused = true;
    // dispatch transition end event
    if (transitionEndEvent) {
      this.element.dispatchEvent(new Event(transitionEndEvent));
    }
    this.clearTimeout();
    // return reference to self for chaining
    return this;
  }

  /**
   * Show next item
   * @return Looper
   */
  next() {
    const nextItemIndex =
      this.activeItemIndex === this.items.length - 1
        ? 0
        : this.activeItemIndex + 1;
    // go to next item
    return this.go(nextItemIndex);
  }

  /**
   * Show previous item
   * @return Looper
   */
  prev() {
    const previousItemIndex =
      this.activeItemIndex === 0
        ? this.items.length - 1
        : this.activeItemIndex - 1;
    // go to previous item
    return this.go(previousItemIndex);
  }

  /**
   * Show item
   * @param {number} to
   * @return Looper
   */
  go(to) {
    // ignore out of range index
    // or, if index is already active
    if (to < 0 || to > this.items.length - 1 || to === this.activeItemIndex) {
      return;
    }
    // active item
    var complete = function(active, next, direction) {
      // if not looping, already complete
      if (!this.looping) return;

      // set looping status to false
      this.looping = false;

      // update item classes
      active
        .removeClass("active go " + direction)
        // update ARIA state
        .attr("aria-hidden", true);
      next
        .removeClass("go " + direction)
        .addClass("active")
        // update ARIA state
        .removeAttr("aria-hidden");

      // custom event
      var e = $.Event("shown", {
        // related target is new active item
        relatedTarget: next[0],
        // related index is the index of the new active item
        relatedIndex: $items.index(next),
      });

      // trigger shown event
      this.$element.trigger(e);
    };

    // custom event
    const showEvent = new CustomEvent("show", {
      detail: {
        // related target is next item to show
        relatedTarget: this.items[to],
        relatedIndex: to,
      },
    });

    // trigger show event
    this.element.dispatchEvent(showEvent);

    // return if the event was canceled
    if (showEvent.isDefaultPrevented()) {
      return this;
    }

    // set transitioning status to true
    this.transitioning = true;

    switch (this.transition) {
      case TRANSITION_SLIDE:
      case TRANSITION_XFADE:
        // add direction class to active and next item
        $next.addClass(direction);
        $active.addClass("go " + direction);

        // force re-flow on next item
        $next[0].offsetWidth;

        // add go class to next item
        $next.addClass("go");

        // finish after transition
        this.$element.one(cssTransitionSupport, function() {
          // weird CSS transition when element is initially hidden
          // may cause this event to fire twice with invalid $active
          // element on first run
          if (!$active.length) return;
          complete.call(that, $active, $next, direction);
        });
        break;
      default:
        complete.call(that, $active, $next, direction);
    }

    // if auto-looping
    if (
      (isLooping || (!isLooping && this.options.interval)) &&
      // and, no argument
      (!to ||
        // or, argument not equal to pause option
        (typeof to == "string" && to !== this.options.pause) ||
        // or, argument is valid element object and pause option not equal to "to"
        (to.length && this.options.pause !== "to"))
    )
      // start/resume loop
      this.loop();

    // return reference to self for chaining
    return this;
  }
}
