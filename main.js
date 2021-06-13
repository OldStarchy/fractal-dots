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
		if (this.position === null) {
			this.position = Point.random().scale(
				this.context.canvas.width,
				this.context.canvas.height
			);

			this.drawDotAt(this.position);
			return;
		}

		const dot = ArrayHelper.random(this.dots);

		this.position = Point.lerp(this.position, dot, this.stepRatio);

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
		this.resetBtn = document.getElementsByClassName('js_reset-btn');
		[...this.resetBtn].forEach((btn) =>
			btn.addEventListener('click', () => this.reset())
		);
		this.startBtn = document.getElementsByClassName('js_start-btn');
		[...this.startBtn].forEach((btn) =>
			btn.addEventListener('click', () => this.start())
		);
		this.pauseBtn = document.getElementsByClassName('js_pause-btn');
		[...this.pauseBtn].forEach((btn) =>
			btn.addEventListener('click', () => this.pause())
		);
		this.stepBtn = document.getElementsByClassName('js_step-btn');
		[...this.stepBtn].forEach((btn) =>
			btn.addEventListener('click', () => this.step())
		);
		this.clearBtn = document.getElementsByClassName('js_clear-btn');
		[...this.clearBtn].forEach((btn) =>
			btn.addEventListener('click', () => this.clear())
		);

		/** @type {HTMLInputElement} */
		this.jumpRatioIpt = /** @type {HTMLInputElement} */ (
			document.getElementsByClassName('js_jump-ratio')[0]
		);
		this.jumpRatioIpt.addEventListener('input', () => this.setJumpRatio());
		/** @type {HTMLInputElement} */
		this.iterationsPerStepIpt = /** @type {HTMLInputElement} */ (
			document.getElementsByClassName('js_iterations-per-step')[0]
		);
		this.iterationsPerStepIpt.addEventListener('input', () =>
			this.setIterationsPerStep()
		);
		/** @type {HTMLInputElement} */
		this.stepDelayIpt = /** @type {HTMLInputElement} */ (
			document.getElementsByClassName('js_step-delay')[0]
		);
		this.stepDelayIpt.addEventListener('input', () => this.setStepDelay());
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

	setJumpRatio() {
		const val = Number.parseFloat(this.jumpRatioIpt.value);
		if (!isNaN(val)) {
			this.app.stepRatio = val;
		}
	}
	setIterationsPerStep() {
		const val = Number.parseInt(this.iterationsPerStepIpt.value);
		if (!isNaN(val)) {
			this.app.iterationsPerStep = val;
		}
	}
	setStepDelay() {
		const val = Number.parseInt(this.stepDelayIpt.value);
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
