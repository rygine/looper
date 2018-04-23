import { getTransitionEndEvent } from "./utils/getTransitionEvent";

const LEFT_ARROW = 37;
const RIGHT_ARROW = 39;
const HOVER_EVENT = "hover";
const CLICK_EVENT = "click";
const TRANSITION_SLIDE = "slide";
const TRANSITION_XFADE = "xfade";
const DIRECTION_LEFT = "left";
const DIRECTION_RIGHT = "right";
const DIRECTION_UP = "up";
const DIRECTION_DOWN = "down";

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
        direction: DIRECTION_LEFT,
        autoLoop: false,
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
          if (!this.paused) {
            this.pause();
          }
        });
        this.addEventListener("mouseleave", () => {
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
    // start looping
    if (this.options.autoLoop) {
      this.loop();
    }
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
    this.looping = true;
    this.paused = false;
    this.clearTimeout();
    // setup new loop interval
    this.timeout = setTimeout(this.next.bind(this), this.options.interval);
    return this;
  }

  /**
   * Pause auto-loop of items
   * @return Looper
   */
  pause() {
    // set paused flag
    this.paused = true;
    this.clearTimeout();
    return this;
  }

  /**
   * Stop auto-looping
   */
  stop() {
    this.pause();
    this.looping = false;
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

  _finishTransition(to) {
    this.transitioning = false;
    const activeItem = this.items[this.activeItemIndex];
    const nextItem = this.items[to];
    // update item classes
    activeItem.classList.remove("active", "go", this.options.direction);
    // update ARIA state
    activeItem.setAttribute("aria-hidden", true);
    nextItem.classList.remove("go", this.options.direction);
    nextItem.classList.add("active");
    // update ARIA state
    nextItem.removeAttribute("aria-hidden");

    const shownEvent = new CustomEvent("shown", {
      detail: {
        // related target is next item to show
        relatedTarget: nextItem,
        relatedIndex: to,
      },
    });

    // update active item index
    this.activeItemIndex = to;

    // trigger shown event
    this.element.dispatchEvent(shownEvent);
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
      return this;
    }
    const activeItem = this.items[this.activeItemIndex];
    const nextItem = this.items[to];

    // custom event
    const showEvent = new CustomEvent("show", {
      detail: {
        // related target is next item to show
        relatedTarget: nextItem,
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
        nextItem.classList.add(this.options.direction);
        activeItem.classList.add("go", this.options.direction);
        // force re-flow on next item
        nextItem.offsetWidth;
        // add go class to next item
        nextItem.classList.add("go");
        // finish after transition
        this.element.addEventListener(
          cssTransitionSupport,
          function() {
            // weird CSS transition when element is initially hidden
            // may cause this event to fire twice with invalid $active
            // element on first run
            this._finishTransition(to);
          },
          { once: true }
        );
        break;
      default:
        this._finishTransition(to);
    }

    // if auto-looping, start loop
    if (this.looping) {
      this.loop();
    }
    return this;
  }
}
