class Slider{
	
	constructor(node, options){
		try{
			this.wrapper = node;
			this.animation = options.animation == "fade" ? "fade" : "translate";
			this.animationTiming = options.animationTiming || 500;
			this.pauseTiming = options.pauseTiming || 0;
			this.position = parseInt(options.initialPosition) || 0;
			this.infiniteCycle = options.infiniteCycle || false;
			this.showArrows = options.showArrows ?? true;
			this.showDots = options.showDots === undefined ? true : options.showDots;

			this.length = this.wrapper.children.length;
			this.children = Array.from(this.wrapper.children);
			this.slidesTape = document.createElement("div");

			this.wrapper.addEventListener("touchstart", e => this.touchesX = e.touches[0].pageX, {passive: true})
			this.wrapper.addEventListener("touchend", e => this.touchEnd(e, this), {passive: true})
			this.touchesX = 0

			//resizing slider after window resize
			window.addEventListener("resize", () => {
				this._pxWidth = this.wrapper.getBoundingClientRect().width;
				if(this.animation !== "fade"){
					this.slidesTape.style.transform = `translateX(-${this.position*this._pxWidth}px)`
				}
			})
		}
		catch(e){console.warn("Please select a valid node"); console.log(e)}
	}
	
	buildSliderFrame(){

		// Style Attributes of slider wrapper
		this.wrapper.classList.add("sliderWrapper");
		this._pxWidth = this.wrapper.getBoundingClientRect().width;
		this.wrapper.style.height = `${this._pxHeight}px`
		if(!["relative", "absolute", "fixed"].includes(getComputedStyle(this.wrapper).position)){this.wrapper.style.position = "relative"}

		// Create slidesTape that contains all slides
		this.slidesTape = document.createElement("div");
		this.slidesTape.className = "slidesTape";
		this.slidesTape.style.transitionDuration = this.animationTiming + "ms";
		if(this.animation === "fade"){this.slidesTape.classList.add("opacity-transition")}

		// Wrap each firstchild element in a div.slide element
		this.children.forEach( slide => {
			let slideWrapper = document.createElement("div");
			slideWrapper.classList = "slide";
			slideWrapper.append(slide);
			if(this.animation === "fade"){slideWrapper.style.transitionDuration = this.animationTiming + "ms"}
			this.slidesTape.appendChild(slideWrapper)
		})

		// Add content to wrapper
		this.wrapper.appendChild(this.slidesTape)
	}

	generateCommands(){
		if(this.showArrows){
			this.previousButton = document.createElement("div")
			this.previousButton.classList = "sliderButton previous";
			this.previousButton.addEventListener("click", () => this.showSlide(this.position-1))
			this.wrapper.appendChild(this.previousButton)
			
			this.nextButton = document.createElement("div")
			this.nextButton.classList = "sliderButton next";
			this.nextButton.addEventListener("click", () => this.showSlide(this.position+1))
			this.wrapper.appendChild(this.nextButton)
		}

		if(this.showDots){
			this.dotLine = document.createElement("div")
			this.dotLine.className = "slideDotLine"
			for (let i = 0 ; i < this.length ; i++){
				let dot = document.createElement("div")
				dot.addEventListener("click", () =>{this.showSlide(i)})
				this.dotLine.appendChild(dot)
				}
			this.wrapper.appendChild(this.dotLine)
		}
	}

	updateCommands(){
		if(!this.infiniteCycle && this.showArrows){
			this.previousButton.style.opacity = !this.position ? 0:1;
			this.nextButton.style.opacity = !!(this.position == this.length-1) ? 0:1
		}

		if(this.showDots){
			Array.from(this.dotLine.children).forEach(dot => { dot.classList.remove("active") })
			if(this.position > this.dotLine.children.length-1){ this.dotLine.children[0].classList.add("active") }
			else {this.dotLine.children[this.position].classList.add("active")}
		}
	}

	showSlide(x){
		this.position = x;
		if(!this.infiniteCycle){
			this.position = Math.min(this.position, this.length-1);
			this.position = Math.max(this.position, 0)
		}
		if (this.position > this.length-1){
			if(this.animation === "fade"){this.position = 0}
			else{this.quickMoveToFirst()}
		}
		if (this.position < 0){
			if(this.animation === "fade"){this.position = this.length -1}
			else{this.quickMoveToLast()}
		}
		if(this.animation === "fade"){
			Array.from(this.slidesTape.children).forEach(slide => {
				slide.style.opacity = 0
				slide.style.zIndex = 0
			})
			this.slidesTape.children[this.position].style.opacity = 1
			this.slidesTape.children[this.position].style.zIndex = 1
		}
		else{this.slidesTape.style.transform = `translateX(-${this.position*this._pxWidth}px)`}

		this.updateCommands()

		if (this.pauseTiming){
			if(this.timeOutID){clearTimeout(this.timeOutID)}
			this.timeOutID = setTimeout(() => this.showSlide(this.position+1), this.pauseTiming)
		}
	}

	quickMoveToFirst(){
		let newSlide = document.createElement("div")
		newSlide.className="slide"
		let slideClone = this.children[0].cloneNode(true)
		newSlide.append(slideClone)
		this.slidesTape.append(newSlide)

		setTimeout(() => {
				this.slidesTape.style.transitionDuration = "0ms";
				this.showSlide(0)
				setTimeout(() => this.slidesTape.style.transitionDuration = this.animationTiming + "ms", 10);
				this.slidesTape.children[this.length].remove()
			}, this.animationTiming
		)
	}

	quickMoveToLast(){
		let newSlide = document.createElement("div")
		newSlide.className="slide"
		let slideClone = this.children[this.length-1].cloneNode(true)
		newSlide.append(slideClone)
		this.slidesTape.insertBefore(newSlide, this.slidesTape.children[0])

		this.slidesTape.style.transitionDuration = "0ms";
		this.showSlide(1)

		setTimeout(()=>{
			this.slidesTape.style.transitionDuration = this.animationTiming + "ms"
			this.showSlide(0)
		}, 10)

		setTimeout(() => {
				this.slidesTape.style.transitionDuration = "0ms";
				this.showSlide(this.length-1)
				setTimeout(() => this.slidesTape.style.transitionDuration = this.animationTiming + "ms", 10);
				this.slidesTape.children[0].remove()
			}, this.animationTiming
		)
	}

	touchEnd(e, slider){
		let deltaX = slider.touchesX - e.changedTouches[0].pageX
		if(deltaX >= 25){slider.showSlide(slider.position+1)}
		else if(deltaX <= -25){slider.showSlide(slider.position-1)}
	}

	initiate(){
		if(this.wrapper !== null){
			this.buildSliderFrame()
			this.generateCommands()
			this.showSlide(this.position)
		}
	}

}

function createSlider(node, options = {}){
	var slider = new Slider (node, options)
	slider.initiate()
}