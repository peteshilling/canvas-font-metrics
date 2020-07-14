const path = require('path')

module.exports = {
	entry: './src/index.js',
	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: 'canvas-font-metrics.js',
		library: 'CanvasFontMetrics',
		libraryTarget: 'umd'
	}
}
