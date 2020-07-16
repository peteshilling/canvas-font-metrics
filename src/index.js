import FontFaceObserver from 'fontfaceobserver'
import blankFontDataUri from './adobe-blank.js'

// ——————————————————————————————————————————————————
// Variables
// ——————————————————————————————————————————————————

let instances = {}
let insertedBlankFonts = []

const defaultOptions = {
	chars: {
		capHeight: 'S',
		baseline: 'n',
		xHeight: 'x',
		descent: 'p',
		ascent: 'h',
		tittle: 'i',
	},
	fontSize: 16,
	baseline: 'top',
}

const defaultFontWeight = 400
const defaultFontStyle = 'normal'

const ligatureCodes = {
	ff: 64256,
	fi: 64257,
	fl: 64258,
	st: 64262,
}

const blankFontFamily = 'AdobeBlank'

// ——————————————————————————————————————————————————
// Utility Methods
// ——————————————————————————————————————————————————

/**
 * Adds blank 'zero width' font to page to serve as the backup font. This allows glyphs to be detected
 * @param   {String}   weight  - The font weight
 * @param   {String}   style   - The font style
 */

const insertblankFont = (weight, style) => {
	const id = weight + style

	if (insertedBlankFonts.indexOf(id).length > -1) {
		return
	}

	const css = `@font-face {
		font-family: ${blankFontFamily};
		font-weight: ${weight};
		font-style: ${style};
		src: url(${blankFontDataUri}) format('woff');
	}`

	const styleEl = document.createElement('style')
	styleEl.styleTag = 'text/css'
	styleEl.appendChild(document.createTextNode(css))
	document.head.appendChild(styleEl)

	insertedBlankFonts.push(id)
}

/**
 * Wait for font to be loaded onto the page
 * @param    {object}  settings
 * @property {string}  settings.fontFamily
 * @property {string}  settings.fontWeight
 * @property {string}  settings.fontStyle
 * @return   {Promise}
 */

const waitForFont = async ({ fontFamily, fontWeight, fontStyle }) => {
	const observer = new FontFaceObserver(fontFamily, {
		weight: fontWeight,
		style: fontStyle,
	})
	await observer.load()
}

/**
 * Gets unique ID used to cache instances
 * @param    {object}  settings
 * @property {string}  settings.fontFamily
 * @property {string}  settings.fontWeight
 * @property {string}  settings.fontStyle
 * @property {object}  settings.options
 * @return   {string}
 */

const getId = ({ fontFamily, fontWeight, fontStyle, options }) =>
	`${fontFamily}${fontWeight}${fontStyle}${JSON.stringify(options)}`

/**
 * Sets the font styles on the canvas context
 * @param    {object}  settings
 * @property {object}  settings.ctx         - The canvas context
 * @property {string}  settings.fontFamily
 * @property {string}  settings.fontWeight
 * @property {string}  settings.fontStyle
 * @property {number}  settings.fontSize    - The font size in pixels
 */

const setFont = ({ ctx, fontFamily, fontWeight, fontStyle, fontSize, baseline }) => {
	ctx.font = `${fontWeight} ${fontStyle} ${fontSize}px ${fontFamily}, ${blankFontFamily}`
	ctx.textAlign = 'left'
	ctx.textBaseline = baseline
}

/**
 * Detects ligatures in font
 * @property {object}  ctx        - The canvas context
 * @return   {array}   ligatures  - array of detected ligatures
 */

export const detectLigatures = (ctx) => {
	const detected = []
	for (const lig in ligatureCodes) {
		if (ctx.measureText(String.fromCharCode(ligatureCodes[lig])).width > 0) {
			detected.push(lig)
		}
	}
	return detected
}

/**
 * Detects all glyphs in font (warning, this is slow)
 * @property {object}  ctx        - The canvas context
 * @return   {array}   glyphs     - array of detected glyphs
 */

export const detectGlyphs = (ctx) => {
	const detected = []
	let string
	for (let i = 0; i <= 65535; i++) {
		string = String.fromCharCode(i)
		if (ctx.measureText(string).width > 0) {
			detected.push(string)
		}
	}
	return detected
}

/**
 * Normalize measurement to percentage of font size
 * @param  {object}   measurements  - key value pairs of measurements
 * @return {object}   normalized
 */

const normalize = (ctx, measurements, fontSize) => {
	let normalized = {}
	for (const prop in measurements) {
		normalized[prop] = !!measurements[prop] ? measurements[prop] / fontSize : measurements[prop]
	}
	return normalized
}

/**
 * Measures the ascent of a string as a percentage of font size
 * @param  {string}   string    - the string to measure
 * @param  {number}   fontSize  - the font size
 * @return {number}
 */

const measureTop = (ctx, string, fontSize) =>
	ctx.measureText(string).actualBoundingBoxAscent / fontSize

/**
 * Measures the descent of a string as a percentage of font size
 * @param  {string}   string    - the string to measure
 * @param  {number}   fontSize  - the font size
 * @return {number}
 */

const measureBottom = (ctx, string, fontSize) =>
	ctx.measureText(string).actualBoundingBoxDescent / fontSize

// ——————————————————————————————————————————————————
// Canvas Font Metrics Constructor
// ——————————————————————————————————————————————————

/**
 * Create canvas font metrics instance
 * @param    {object}  settings
 * @property {string}  settings.fontFamily
 * @property {string}  settings.fontWeight
 * @property {string}  settings.fontStyle
 * @property {object}  settings.options    - option overrides
 * @return   {object}
 */

async function CanvasFontMetrics({
	fontFamily,
	fontWeight = defaultFontWeight,
	fontStyle = defaultFontStyle,
	options = {},
}) {
	// check if instance already exists
	const id = getId({ fontFamily, fontWeight, fontStyle, options })
	if (instances[id] !== undefined) return instances[id]

	// insert and wait for fonts
	insertblankFont(fontWeight, fontStyle)
	await waitForFont({ fontFamily, fontWeight, fontStyle })
	await waitForFont({ fontFamily: blankFontFamily, fontWeight, fontStyle })

	// merge default options
	const mergedOptions = {
		chars: { ...defaultOptions.chars, ...options.chars },
		...defaultOptions,
		...options,
	}

	const { fontSize, chars, baseline } = mergedOptions

	// ready canvas
	const canvas = document.createElement('canvas')
	const ctx = canvas.getContext('2d')
	setFont({ ctx, fontFamily, fontWeight, fontStyle, fontSize, baseline })

	// cache widths
	let widths = {}

	// create instance
	const metrics = {
		capHeight: measureTop(ctx, chars.capHeight, fontSize),
		baseline: measureBottom(ctx, chars.baseline, fontSize),
		xHeight: measureTop(ctx, chars.xHeight, fontSize),
		descent: measureBottom(ctx, chars.descent, fontSize),
		ascent: measureTop(ctx, chars.ascent, fontSize),
		tittle: measureTop(ctx, chars.tittle, fontSize),
		ligatures: detectLigatures(ctx),
		getGlyphs: () => detectGlyphs(ctx),
		measureWidth: (string) => {
			if (!widths[string]) {
				widths[string] = ctx.measureText(string).width / fontSize
			}
			return widths[string]
		},
		measureText: (string) => {
			return normalize(ctx, ctx.measureText(string), fontSize)
		},
	}

	// cache instance
	instances[id] = metrics

	// return

	return metrics
}

// ——————————————————————————————————————————————————
// Exports
// ——————————————————————————————————————————————————

export default CanvasFontMetrics
export { ligatureCodes, defaultOptions }
