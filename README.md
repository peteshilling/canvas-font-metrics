A performant javascript library that provides useful font metrics, including:

-   Ascent
-   Cap height
-   Tittle
-   X-Height
-   Baseline
-   Available ligatures
-   Available glyphs

It uses the [Font Face Observer library](https://fontfaceobserver.com/) to ensure the fonts are loaded before providing metrics.

Note: This library provides some metrics that aren't neccessary for most use cases (ligature and glyph detection, for instance). The bulk of the filesize comes from the inclusion of Adobe's 'Blank' font, which is used to detect what glyphs are available in a font. This functionality can be removed, if needed.

### Usage

```js
var metrics = await CanvasFontMetrics({
	fontFamily: 'Helvetica',
	fontWeight: 400,
	fontStyle: 'normal',
	options: null // override default options
})

/*

metrics {
	capHeight,
	baseline,
	xHeight,
	descent,
	ascent,
	tittle,
	ligatures,
	getGlyphs,
	measureWidth,
	measureText
}

*/
```
