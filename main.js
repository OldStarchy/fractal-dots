//@ts-check
function assert(test, message) {
	if (!test) {
		alert(message);
		throw new Error(message);
	}
}

class Point {
	/**
	 * @param {number} x
	 * @param {number} y
	 */
	constructor(x, y) {
		/**
		 * @readonly
		 * @type {number}
		 */
		this.x = x;
		/**
		 * @readonly
		 * @type {number}
		 */
		this.y = y;
	}

	static random() {
		return new Point(Math.random(), Math.random());
	}

	/**
	 * @param {number} x
	 * @param {number} y
	 */
	scale(x, y) {
		return new Point(this.x * x, this.y * y);
	}

	/**
	 * @param {Point} other
	 */
	add(other) {
		return new Point(this.x + other.x, this.y + other.y);
	}

	/**
	 * @param {Point} a
	 * @param {Point} b
	 * @param {number} mix
	 */
	static lerp(a, b, mix) {
		return a.add(b.add(a.scale(-1, -1)).scale(mix, mix));
	}

	isNaN() {
		return isNaN(this.x) || isNaN(this.y);
	}

	isInfinity() {
		return Math.abs(this.x) === Infinity || Math.abs(this.y) === Infinity;
	}
}

class ArrayHelper {
	/**
	 * @template T
	 * @param {Array<T>} array
	 * @returns T
	 */
	static random(array) {
		return array[Math.floor(Math.random() * array.length)];
	}
}

class FractalDots {
	/**
	 * @param {CanvasRenderingContext2D} context
	 */
	constructor(context) {
		/** @type {Array<Point>} */
		this.dots = [];

		/** @type {number|null} */
		this.runInterval = null;

		/** @type {Point|null} */
		this.position = null;

		/**
		 * @type {number}
		 */
		this.stepRatio = 0.9;

		/**
		 * @type {number}
		 */
		this.sideStep = 0;

		/**
		 * @type {CanvasRenderingContext2D}
		 */
		this.context = context;

		/**
		 * @type {number}
		 */
		this.iterationsPerStep = 100;

		/**
		 * @type {number}
		 */
		this.stepDelay = 10;
	}

	/**
	 * @param {Point} dot
	 */
	addDot(dot) {
		this.dots.push(dot);
		this.drawDotAt(dot);
	}

	reset() {
		this.dots = [];
		this.position = null;
		this.clear();
	}

	isRunning() {
		return this.runInterval !== null;
	}

	start() {
		if (this.runInterval == null) {
			this.runInterval = setInterval(() => this.step(), this.stepDelay);
		}
	}

	stop() {
		if (this.runInterval !== null) {
			clearInterval(this.runInterval);
			this.runInterval = null;
		}
	}

	step() {
		if (this.dots.length < 2) {
			return;
		}

		for (let index = 0; index < this.iterationsPerStep; index++) {
			this.advanceOneDot();
		}
	}

	advanceOneDot() {
		if (
			this.position === null ||
			this.position.isNaN() ||
			this.position.isInfinity()
		) {
			this.position = Point.random().scale(
				this.context.canvas.width,
				this.context.canvas.height
			);

			this.drawDotAt(this.position);
			return;
		}

		const dot = ArrayHelper.random(this.dots);

		const diff = dot.add(this.position.scale(-1, -1));
		const sideways = new Point(diff.y, -diff.x).scale(
			this.sideStep * this.stepRatio,
			this.sideStep * this.stepRatio
		);

		this.position = Point.lerp(this.position, dot, this.stepRatio).add(
			sideways
		);

		this.drawDotAt(this.position);
	}

	clear() {
		this.context.clearRect(
			0,
			0,
			this.context.canvas.width,
			this.context.canvas.height
		);

		this.dots.forEach((dot) => {
			this.drawDotAt(dot);
		});
	}

	/**
	 * @param {Point} point
	 */
	drawDotAt(point) {
		this.context.fillStyle = '#000';
		this.context.beginPath();
		this.context.arc(point.x, point.y, 1, 0, Math.PI * 2);
		this.context.fill();
	}
}

class UI {
	/**
	 * @param {FractalDots} app
	 * @param {HTMLCanvasElement} canvas
	 */
	constructor(app, canvas) {
		/**
		 * @type {FractalDots}
		 */
		this.app = app;

		this.canvas = canvas;

		this.canvas.addEventListener('click', (e) => {
			this.canvasClick(e.clientX, e.clientY);
		});

		this.bindButtonClick('js_reset-btn', () => this.reset());
		this.bindButtonClick('js_start-btn', () => this.start());
		this.bindButtonClick('js_pause-btn', () => this.pause());
		this.bindButtonClick('js_step-btn', () => this.step());
		this.bindButtonClick('js_clear-btn', () => this.clear());

		this.bindInputValue(
			'js_jump-ratio',
			() => this.getJumpRatio(),
			(val) => this.setJumpRatio(val)
		);
		this.bindInputValue(
			'js_iterations-per-step',
			() => this.getIterationsPerStep(),
			(val) => this.setIterationsPerStep(val)
		);
		this.bindInputValue(
			'js_step-delay',
			() => this.getStepDelay(),
			(val) => this.setStepDelay(val)
		);
		this.bindInputValue(
			'js_side-step',
			() => this.getSideStep(),
			(val) => this.setSideStep(val)
		);
	}

	bindButtonClick(cssClass, callback) {
		for (const button of document.getElementsByClassName(cssClass)) {
			button.addEventListener('click', callback);
		}
	}

	bindInputValue(cssClass, getter, setter) {
		for (const input of document.getElementsByClassName(cssClass)) {
			if (input instanceof HTMLInputElement) {
				input.value = getter();

				input.addEventListener('input', () => setter(input.value));
			}
		}
	}

	/**
	 * @param {number} x
	 * @param {number} y
	 */
	canvasClick(x, y) {
		const point = new Point(x, y);

		this.app.addDot(point);
	}

	reset() {
		this.app.stop();
		this.app.reset();
	}
	start() {
		this.app.start();
	}
	pause() {
		this.app.stop();
	}
	step() {
		this.app.stop();
		this.app.step();
	}
	clear() {
		this.app.clear();
	}

	getJumpRatio() {
		return this.app.stepRatio;
	}

	setJumpRatio(value) {
		const val = Number.parseFloat(value);
		if (!isNaN(val)) {
			this.app.stepRatio = val;
		}
	}

	getSideStep() {
		return this.app.sideStep;
	}

	setSideStep(value) {
		const val = Number.parseFloat(value);
		if (!isNaN(val)) {
			this.app.sideStep = val;
		}
	}

	getIterationsPerStep() {
		return this.app.iterationsPerStep;
	}

	setIterationsPerStep(value) {
		const val = Number.parseInt(value);
		if (!isNaN(val)) {
			this.app.iterationsPerStep = val;
		}
	}

	getStepDelay() {
		return this.app.stepDelay;
	}

	setStepDelay(value) {
		const val = Number.parseInt(value);
		if (!isNaN(val)) {
			const running = this.app.isRunning();
			this.app.stop();
			this.app.stepDelay = val;
			if (running) this.app.start();
		}
	}
}

const canvas = /** @type {HTMLCanvasElement} */ (
	document.getElementById('main')
);
assert(canvas, 'No canvas');

if (!(canvas instanceof HTMLCanvasElement)) {
	assert(false, 'Canvas is not canvas');
}

canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;

const app = new FractalDots(canvas.getContext('2d'));
const ui = new UI(app, canvas);
