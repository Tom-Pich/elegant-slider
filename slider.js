class Slider{
	
	constructor(node, options){
		try{
			this.wrapper = node;
			this.width = options.width || "100%";
			this.height = options.height === undefined ? 56.25 : options.height ;
			this.animation = options.animation == "fade" ? "fade" : "translate";
			this.animationTiming = options.animationTiming || 500;
			this.pauseTiming = options.pauseTiming || 0;
			this.position = options.initialPosition || 0;
			this.infiniteCycles = options.infiniteCycles || false;

			this.length = this.wrapper.children.length;
			this._pxWidth = this.wrapper.getBoundingClientRect().width;
			this._pxHeight = this.height ? this._pxWidth*this.height/100 : "" ;
			this.children = Array.from(this.wrapper.children);
			this.slidesTape = document.createElement("div");
		}
		catch(e){console.warn("Please select a valid node")}
	}
	
	buildSliderFrame(){

		// Style Attributes of slider wrapper
		this.wrapper.classList.add("sliderWrapper");
		this.wrapper.style = `width: ${this.width}; height: ${this._pxHeight}px`
		if(!["relative", "absolute", "fixed"].includes(getComputedStyle(this.wrapper).position)){this.wrapper.style.position = "relative"}

		// Create slidesTape that contains all slides
		this.slidesTape = document.createElement("div");
		this.slidesTape.className = "slidesTape";
		this.slidesTape.style.transitionDuration = this.animationTiming + "ms";

		// Wrap each firstchild element in a div.slide element
		this.children.forEach( slide => {
			let slideWrapper = document.createElement("div");
			slideWrapper.classList = "slide";
			slideWrapper.append(slide);
			this.slidesTape.appendChild(slideWrapper)
		})

		// Add content to wrapper
		this.wrapper.appendChild(this.slidesTape)
	}

	generateCommands(){
		this.previousButton = document.createElement("div")
		this.previousButton.classList = "sliderButton previous";
		this.previousButton.innerHTML = "&#x2039;"
		this.previousButton.addEventListener("click", () => this.showSlide(this.position-1))
		this.wrapper.appendChild(this.previousButton)
		
		this.nextButton = document.createElement("div")
		this.nextButton.classList = "sliderButton next";
		this.nextButton.innerHTML = "&#x203A;"
		this.nextButton.addEventListener("click", () => this.showSlide(this.position+1))
		this.wrapper.appendChild(this.nextButton)

		this.updateCommands()
	}

	updateCommands(){
		if(!this.infiniteCycles){
			this.previousButton.style.opacity = !this.position ? 0:1;
			this.nextButton.style.opacity = !!(this.position == this.length-1) ? 0:1
		}
	}

	showSlide(x){
		this.position = x;
		if(!this.infiniteCycles){
			this.position = Math.min(this.position, this.length-1);
			this.position = Math.max(this.position, 0)
		}
		if (this.position > this.length-1){this.quickMoveToFirst()}
		if (this.position < 0){this.quickMoveToLast()}
		console.log(this.position)
		console.log(this._pxWidth)
		this.slidesTape.style.transform = `translateX(-${this.position*this._pxWidth}px)`
		this.updateCommands()
	}

	quickMoveToFirst(x){
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