/**
 * Get the name of the transition end event
 * @returns string
 */
export const getTransitionEndEvent = () => {
  // transition events with names
  const transEndEvents = {
    transition: "transitionend",
    WebkitTransition: "webkitTransitionEnd",
    MozTransition: "transitionend",
    MsTransition: "MSTransitionEnd",
    OTransition: "oTransitionEnd otransitionend",
  };

  // check for each transition type
  for (let name in transEndEvents) {
    // if transition type is supported
    if (typeof document.body.style[name] !== "undefined") {
      // return transition end event name
      return transEndEvents[name];
    }
  }
};
