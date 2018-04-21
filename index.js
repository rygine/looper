import { Looper } from "./src/looper";

// initialize all looper elements
Array.from(document.querySelectorAll("[data-looper]")).forEach((element) => {
  new Looper(element);
});
