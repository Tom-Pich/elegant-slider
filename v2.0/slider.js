function create(element, className) {
	let node = document.createElement(element);
	node.className = className;
	return node;
}

class Slider {

	constructor(node, options) {
		try {
			this.wrapper = node;
			this.animation = options.animation === "fade" ? "fade" : "translate";
			this.animationTiming = options.animationTiming || 200;
			this.pauseTiming = options.pauseTiming || 0;
			this.position = parseInt(options.initialPosition) || 1;
			this.infiniteCycle = options.infiniteCycle || false;
			this.showArrows = options.showArrows ?? true;
			this.showDots = options.showDots === undefined ? true : options.showDots;

			this.length = this.wrapper.children.length;
			this.children = Array.from(this.wrapper.children);

			this.wrapper.addEventListener("touchstart", e => this.touchesX = e.touches[0].pageX, { passive: true })
			this.wrapper.addEventListener("touchend", e => this.touchEnd(e, this), { passive: true })
			this.touchesX = 0

			//resizing slider after window resize
			window.addEventListener("resize", () => { this.showSlide(this.position) })
		}
		catch (e) { console.warn("Please select a valid node for Elegant Slider") }
	}


	buildSliderFrame() {

		// Style Attributes of slider wrapper
		this.wrapper.classList.add("sliderWrapper");
		if (!["relative", "absolute", "fixed"].includes(getComputedStyle(this.wrapper).position)) { this.wrapper.style.position = "relative" }
		this.wrapper.style.setProperty("--animation-duration", this.animationTiming + "ms")

		// Create slidesTape that contains all slides
		this.slidesTape = create("div", "slidesTape")
		if (this.animation === "fade") { this.slidesTape.classList.add("opacity-transition") }

		// Wrap each firstchild element in a div.slide element
		this.children.forEach(slideContent => {
			let slide = create("div", "slide")
			slide.append(slideContent);
			this.slidesTape.appendChild(slide)
		})

		// cloning first slide to last position and last slide to first position
		let firstClone = this.slidesTape.children[0].cloneNode(true)
		let lastClone = this.slidesTape.children[this.slidesTape.children.length - 1].cloneNode(true)
		this.slidesTape.appendChild(firstClone)
		this.slidesTape.insertBefore(lastClone, this.slidesTape.children[0])

		// Add content to wrapper
		this.wrapper.appendChild(this.slidesTape)
	}

	generateCommands() {
		if (this.showArrows) {
			this.previousButton = create("div", "sliderButton previous");
			this.previousButton.addEventListener("click", () => this.showSlide(this.position - 1))
			this.nextButton = create("div", "sliderButton next");
			this.nextButton.addEventListener("click", () => this.showSlide(this.position + 1))
			this.wrapper.append(this.nextButton, this.previousButton)
		}

		if (this.showDots) {
			this.dotLine = create("div", "slideDotLine")
			for (let i = 1; i <= this.length; i++) {
				let dot = document.createElement("div")
				dot.addEventListener("click", () => { this.showSlide(i) })
				this.dotLine.appendChild(dot)
			}
			this.wrapper.appendChild(this.dotLine)
		}
	}

	updateCommands() {
		if (!this.infiniteCycle && this.showArrows) {
			this.previousButton.style.opacity = (this.position === 1) ? 0 : 1;
			this.nextButton.style.opacity = this.position === this.length ? 0 : 1
		}

		if (this.showDots) {
			let activeDotIndex
			if (this.position === 0) { activeDotIndex = this.length - 1; }
			else if (this.position > this.length) { activeDotIndex = 0; }
			else { activeDotIndex = this.position - 1; }
			setTimeout(() => {
				Array.from(this.dotLine.children).forEach(dot => { dot.classList.remove("active") })
				this.dotLine.children[activeDotIndex].classList.add("active");
			}, this.animationTiming / 2)
		}
	}

	showSlide(x, isAnimated = true) {
		this.position = x;
		this._pxWidth = this.slidesTape.getBoundingClientRect().width;
		isAnimated ? this.slidesTape.classList.add("animated") : this.slidesTape.classList.remove("animated");
		let isAfterLastSlide = this.position > this.length;
		let isBeforeFirstSlide = this.position === 0;

		if (!this.infiniteCycle) {
			this.position = Math.min(this.position, this.length);
			this.position = Math.max(this.position, 1)
		}

		if (this.animation === "fade") {
			if (isAfterLastSlide) { this.position = 1 }
			else if (isBeforeFirstSlide){ this.position = this.length }
			Array.from(this.slidesTape.children).forEach(slide => { slide.style.opacity = 0 })
			this.slidesTape.children[this.position].style.opacity = 1
		}
		else {
			this.slidesTape.style.transform = `translateX(-${(this.position) * this._pxWidth}px)`
			if (isAfterLastSlide) {
				setTimeout(() => this.showSlide(1, false), this.animationTiming);
			}
			if (isBeforeFirstSlide) {
				setTimeout(() => this.showSlide(this.length, false), this.animationTiming);
			}
		}

		this.updateCommands()

		if (this.pauseTiming) {
			if (this.timeOutID) { clearTimeout(this.timeOutID) }
			this.timeOutID = setTimeout(() => this.showSlide(this.position + 1), this.pauseTiming - (isAnimated ? 0 : this.animationTiming))
		}
	}

	touchEnd(e, slider) {
		let deltaX = slider.touchesX - e.changedTouches[0].pageX
		if (deltaX >= 25) { slider.showSlide(slider.position + 1) }
		else if (deltaX <= -25) { slider.showSlide(slider.position - 1) }
	}

	initiate() {
		if (this.wrapper !== null) {
			this.buildSliderFrame()
			this.generateCommands()
			this.showSlide(this.position, false)
		}
	}
}

function createSlider(node, options = {}) {
	let slider = new Slider(node, options)
	slider.initiate()
}