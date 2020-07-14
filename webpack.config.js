const path = require('path')

module.exports = {
	entry: './src/index.js',
	output: {
		filename: 'canvas-font-metrics.js',
		path: path.resolve(__dirname, 'dist')
	}
}
