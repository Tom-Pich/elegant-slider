/**
 * Elegant Slider 5.4
 * A Very Lightweight Slider
 * https://www.situp-webcreation.com
 *
 * Copyright 2020-2024 Thomas Pichegru
 *
 * Released under the GNU License
 *
 * Released on: 2024-09-09
 */

function ce(element, className) {
  let node = document.createElement(element);
  node.className = className;
  return node;
}

class Slider {
  constructor(node, options) {
    try {
      this.wrapper = node;
      this.slidesTape = node.querySelector(".slides-tape");
      this.animation = this.slidesTape.classList.contains("fade-transition") ? "fade" : "translate";
      this.animationTiming = options.animationTiming || 200;
      this.pauseTiming = options.pauseTiming || 0;
      this.position = 1;
      this.infiniteCycle = options.infiniteCycle || false;
      this.showArrows = options.showArrows ?? true;
      this.showDots = options.showDots === undefined ? true : options.showDots;
      this.showSlideNumber = options.showSlideNumber === undefined ? false : options.showSlideNumber;
      this.preventTouchEvents = options.preventTouchEvents === undefined ? false : options.preventTouchEvents;

      this.length = this.slidesTape.children.length;
      this.children = Array.from(this.slidesTape.children); // does not include duplicates slide before first and after last

      // slide number prevails on dots
      this.showDots = this.showSlideNumber ? false : this.showDots;

      // touche events handling
      if (!this.preventTouchEvents) {
        this.wrapper.addEventListener("touchstart", this.touchStart.bind(this), { passive: true });
        this.wrapper.addEventListener("touchmove", this.touchMove.bind(this), { passive: false });
        this.wrapper.addEventListener("touchend", this.touchEnd.bind(this), { passive: true });
        this.touchesX = 0;
        this.touchesY = 0;
        this.horizontalSwipe = false;
        this.verticalSwipe = false;
      }

      //resizing slider after window resize
      window.addEventListener("resize", () => {
        this.showSlide(this.position, false);
      });

      // custom event slideChange, fired when showSlide is executed. event.detail gives active slide number
      this.slideChangeEvent = new CustomEvent("slideChange", { detail: this.position });
    } catch (e) {
      console.warn("Please select a valid node");
    }
  }

  buildSliderFrame() {
    this.wrapper.style.setProperty("--animation-duration", this.animationTiming + "ms");
    // cloning first and last slides
    let firstClone = this.children[0].cloneNode(true);
    let lastClone = this.children[this.length - 1].cloneNode(true);
    this.slidesTape.appendChild(firstClone);
    this.slidesTape.insertBefore(lastClone, this.children[0]);
  }

  generateCommands() {
    if (this.showArrows) {
      this.previousButton = ce("div", "slider-button previous");
      this.previousButton.setAttribute("role", "button");
      this.previousButton.setAttribute("aria-label", "Précédent");
      this.previousButton.addEventListener("click", () => this.showSlide(this.position - 1));
      this.nextButton = ce("div", "slider-button next");
      this.nextButton.setAttribute("role", "button");
      this.nextButton.setAttribute("aria-label", "Suivant");
      this.nextButton.addEventListener("click", () => this.showSlide(this.position + 1));
      this.wrapper.append(this.nextButton, this.previousButton);
    }

    if (this.showDots) {
      this.dotLine = ce("div", "slide-dot-line");
      for (let i = 1; i <= this.length; i++) {
        const dot = document.createElement("div");
        dot.setAttribute("role", "button");
        dot.setAttribute("aria-label", "slide " + i);
        dot.addEventListener("click", () => {
          this.showSlide(i);
        });
        this.dotLine.appendChild(dot);
      }
      this.wrapper.appendChild(this.dotLine);
    }

    if (this.showSlideNumber) {
      this.slideNumberWrapper = ce("div", "slide-number-wrapper");
      this.wrapper.appendChild(this.slideNumberWrapper);
    }
  }

  updateCommands() {
    if (!this.infiniteCycle && this.showArrows) {
      this.previousButton.hidden = this.position === 1;
      this.nextButton.hidden = this.position === this.length;
    }

    if (this.showDots) {
      let activeDotIndex;
      if (this.position === 0) {
        activeDotIndex = this.length - 1;
      } else if (this.position > this.length) {
        activeDotIndex = 0;
      } else {
        activeDotIndex = this.position - 1;
      }

      // Update active dot in the middle of the animation
      setTimeout(() => {
        Array.from(this.dotLine.children).forEach((dot) => {
          dot.classList.remove("active");
        });
        this.dotLine.children[activeDotIndex].classList.add("active");
      }, this.animationTiming / 2);
    }

    if (this.showSlideNumber) {
      let position = Math.max(1, this.position);
      position = Math.min(this.length, position);
      this.slideNumberWrapper.innerText = `${position}/${this.length}`;
    }
  }

  showSlide(x, isAnimated = true, useActiveClass = true) {
    this.position = x;
    this._pxWidth = this.slidesTape.getBoundingClientRect().width;
    isAnimated ? this.slidesTape.classList.add("animated") : this.slidesTape.classList.remove("animated");
    let isAfterLastSlide = this.position > this.length;
    let isBeforeFirstSlide = this.position === 0;

    if (!this.infiniteCycle) {
      this.position = Math.min(this.position, this.length);
      this.position = Math.max(this.position, 1);
	  if (isAfterLastSlide) return
	  if (isBeforeFirstSlide) return
    }

    // remove "active class" (for custom purpose only, not used in basic version)
    Array.from(this.slidesTape.children).forEach((slide) => {
      slide.classList.remove("active");
    });

    // for fade amination
    if (this.animation === "fade") {
      if (isAfterLastSlide) this.position = 1;
      else if (isBeforeFirstSlide) this.position = this.length;
      Array.from(this.slidesTape.children).forEach((slide) => {
        slide.style.opacity = 0;
      });
      this.slidesTape.children[this.position].style.opacity = 1;
    }

    // for translate animation
    else {
      this.slidesTape.style.transform = `translateX(-${this.position * this._pxWidth}px)`;
      if (isAfterLastSlide) {
        setTimeout(() => this.showSlide(1, false, false), this.animationTiming); // show slide without animation and without "active" class
      }
      if (isBeforeFirstSlide) {
        setTimeout(() => this.showSlide(this.length, false, false), this.animationTiming);
      }
    }

    if (useActiveClass) this.slidesTape.children[this.position].classList.add("active"); // add "active" class on current slide – not used by default

    this.updateCommands();

    if (this.pauseTiming) {
      if (this.timeOutID) {
        clearTimeout(this.timeOutID);
      }
      this.timeOutID = setTimeout(() => this.showSlide(this.position + 1), this.pauseTiming - (isAnimated ? 0 : this.animationTiming));
    }

    // custom slideChange event
    this.slideChangeEvent = new CustomEvent("slideChange", { detail: this.position });
    this.wrapper.dispatchEvent(this.slideChangeEvent);
  }

  touchStart(e) {
    const twoFingerTouches = e.touches.length > 1;
    if (twoFingerTouches) {
      this.touchesX = null;
      this.touchesY = null;
    } else {
      this.touchesX = e.touches[0].pageX;
      this.touchesY = e.touches[0].pageY;
    }
    this.horizontalSwipe = false;
    this.verticalSwipe = false;
  }

  touchMove(e) {
    if (this.touchesX === null || this.touchesY === null) return;
    const deltaX = e.touches[0].pageX - this.touchesX;
    const deltaY = e.touches[0].pageY - this.touchesY;

    if (Math.abs(deltaX) >= Math.abs(deltaY)) this.horizontalSwipe = true;
    else this.verticalSwipe = true;

    if (this.horizontalSwipe && !this.verticalSwipe) {
      e.preventDefault(); // Prevent vertical scrolling
      if (deltaX < 0 && this.position === this.length && !this.infiniteCycle) return; // prevent sweeping after last slide if not infinite
      if (deltaX > 0 && this.position === 1 && !this.infiniteCycle) return; // prevent sweeping before first slide if not infinite
      this.slidesTape.classList.remove("animated"); // follow horizontal swipe instantaneously
      const offset = -(this.position * this._pxWidth);
      if (this.animation !== "fade") this.slidesTape.style.transform = `translateX(${offset + deltaX}px)`;
    }
  }

  touchEnd(e) {
    if (this.touchesX === null) return;
    this.slidesTape.classList.add("animated");
    const deltaX = this.touchesX - e.changedTouches[0].pageX;
    if (deltaX >= 50 && !this.verticalSwipe) {
      this.showSlide(this.position + 1);
    } else if (deltaX <= -50) {
      this.showSlide(this.position - 1);
    } else {
      this.showSlide(this.position);
    }
  }

  initiate() {
    if (this.wrapper !== null) {
      this.buildSliderFrame();
      this.generateCommands();
      this.showSlide(this.position, false);
    }
  }
}

export default function createSlider(node, options = {}) {
  const slider = new Slider(node, options);
  slider.initiate();
  return slider;
}
