export function create(element, className) {
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

			this.length = this.slidesTape.children.length;
			this.children = Array.from(this.slidesTape.children);

			// slide number prevails on dots
			this.showDots = this.showSlideNumber ? false : this.showDots;

			// touch related event
			this.wrapper.addEventListener("touchstart", e => {
				e.preventDefault(); // avoid screen movement when sliding
				this.touchesX = e.touches[0].pageX, { passive: true }
			})
			this.wrapper.addEventListener("touchend", e => this.touchEnd(e, this), { passive: true })
			this.touchesX = 0

			//resizing slider after window resize
			window.addEventListener("resize", () => { this.showSlide(this.position) })
			
			// custom event slideChange, fired when showSlide is executed. event.detail gives active slide number
			this.slideChangeEvent = new CustomEvent('slideChange', { detail: this.position });
		}
		catch (e) { console.warn("Please select a valid node for Elegant Slider") }
	}


	buildSliderFrame() {
		this.wrapper.style.setProperty("--animation-duration", this.animationTiming + "ms")
		// cloning first and last slides
		let firstClone = this.children[0].cloneNode(true)
		let lastClone = this.children[this.length - 1].cloneNode(true)
		this.slidesTape.appendChild(firstClone)
		this.slidesTape.insertBefore(lastClone, this.children[0])
	}

	generateCommands() {
		if (this.showArrows) {
			this.previousButton = create("div", "slider-button previous");
			this.previousButton.setAttribute("role", "button");
			this.previousButton.setAttribute("aria-label", "Précédent");
			this.previousButton.addEventListener("click", () => this.showSlide(this.position - 1))
			this.nextButton = create("div", "slider-button next");
			this.nextButton.setAttribute("role", "button");
			this.nextButton.setAttribute("aria-label", "Suivant");
			this.nextButton.addEventListener("click", () => this.showSlide(this.position + 1))
			this.wrapper.append(this.nextButton, this.previousButton)
		}

		if (this.showDots) {
			this.dotLine = create("div", "slide-dot-line")
			for (let i = 1; i <= this.length; i++) {
				const dot = document.createElement("div")
				dot.setAttribute("role", "button");
				dot.setAttribute("aria-label", "slide " + i )
				dot.addEventListener("click", () => { this.showSlide(i) })
				this.dotLine.appendChild(dot)
			}
			this.wrapper.appendChild(this.dotLine)
		}

		if (this.showSlideNumber){
			this.slideNumberWrapper = create("div", "slide-number-wrapper");
			this.wrapper.appendChild(this.slideNumberWrapper);
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

			// Update active dot in the middle of the animation
			setTimeout(() => {
				Array.from(this.dotLine.children).forEach(dot => { dot.classList.remove("active") })
				this.dotLine.children[activeDotIndex].classList.add("active");
			}, this.animationTiming / 2)
		}

		if (this.showSlideNumber){
			let position = Math.max(1, this.position);
			position = Math.min(this.length, position)
			this.slideNumberWrapper.innerText = `${position}/${this.length}`
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
			this.children.forEach(slide => { slide.style.opacity = 0 })
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
		
		// custom slideChange event
		this.slideChangeEvent = new CustomEvent('slideChange', { detail: this.position });
		this.wrapper.dispatchEvent(this.slideChangeEvent);
	}

	touchEnd(e, slider) {
		let deltaX = slider.touchesX - e.changedTouches[0].pageX
		if (deltaX >= 50) { slider.showSlide(slider.position + 1) }
		else if (deltaX <= -50) { slider.showSlide(slider.position - 1) }
	}

	initiate() {
		if (this.wrapper !== null) {
			this.buildSliderFrame()
			this.generateCommands()
			this.showSlide(this.position, false)
		}
	}
}

export function createSlider(node, options = {}) {
	const slider = new Slider(node, options)
	slider.initiate()

	// return slider so that it can be controlled from outside
	return slider
}