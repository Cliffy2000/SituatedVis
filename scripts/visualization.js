/**
 * 
 * Generates a chart with the given data and configuration options.
 *  
 * @param {Array} data - The data to be visualized in the chart.
 * @param {string} title - The title of the chart.
 * @param {number} [width=700] - The visible size of the overall chart.
 * @param {number} [height=400] - The visible size of the overall chart.
 * @param {number} [viewRange=10] - The amount of points visible at a time.
 * @param {number} [rollingAverage=5] - The number of points considered for the rolling average.
 * 
 * @param {boolean} [showXAxisTicks=true] - Whether to show ticks on the X-axis.
 * @param {boolean} [showThreshold=true] - Whether to show threshold lines.
 * @param {boolean} [easeInOut=false] - Whether to apply ease-in-out animation.
 * @param {boolean} [XAxisInverseStatic=false] - Whether the X-axis is inversely static.
 * @param {boolean} [backgroundEncoding=false] - Whether to use background encoding.
 * @param {boolean} [useRollingAverage=false]
 * @param {string} [dynamicLabelSize="none"] - The size of the dynamic labels. Possible options: "none", "linear", "ushaped".
 * @param {string} [labelPosition="follow"] - The position of the labels. Possible options: "follow", "fixed", "side".
 * 
 */
function generateChart(
	data,
	title,
	width = 700,
	height = 400,
	viewRange = 10,
	rollingAverage = 5,
	showXAxisTicks = true,
	showThreshold = true,
	easeInOut = false,
	XAxisInverseStatic = false,
	backgroundEncoding = false,
	useRollingAverage = false,
	dynamicLabelSize = "none",
	labelPosition = "follow"
) {
	// this is the size of the visible chart
	let CANVAS_WIDTH = width;
	let CANVAS_HEIGHT = height;

	// this is the width on the right side of the plot for additional information
	const INFO_DEFAULT_WIDTH = 125;
	let INFO_WIDTH = (labelPosition === "side") ? INFO_DEFAULT_WIDTH : 0;

	// this is the size of the chart area
	let CHART_WIDTH = CANVAS_WIDTH - INFO_WIDTH;
	let CHART_HEIGHT = CANVAS_HEIGHT;
	const CHART_MARGIN = { top: 10, right: 15, bottom: 30, left: 35 };
	const CHART_PADDING = { top: 40, right: 20, bottom: 30, left: 40 };

	const VIEW_RANGE = viewRange;
	// const X_AXIS_RIGHT_PADDING = CHART_WIDTH * 0.05;
	const X_AXIS_LEFT_MARGIN = 0.5;
	const X_AXIS_RIGHT_MARGIN = 0.25;

	const TEXT_PADDING = { horizontal: 4, vertical: 3 };
	const TITLE_FONT_SIZE = 18;

	let TICK_FREQUENCY = 1;
	if (viewRange > 100) {
		TICK_FREQUENCY = 10;
	} else if (viewRange > 50) {
		TICK_FREQUENCY = 5;
	} else if (viewRange > 15) {
		TICK_FREQUENCY = 2;
	}

	let AXIS_TICK_SIZE = 4;
	let AXIS_FONT_SIZE = 13;

	// TODO: width / viewRange ratio
	let POINT_SIZE = 4;
	
	let LABEL_FONT_DEFAULT_SIZE = 17;
	let LABEL_FONT_SIZE_RANGE = [14, 28];

	const MIN_THRESHOLD = 30;
	const MAX_THRESHOLD = 70;

	let currentIndex = 0; // this is not the exact current x value

	const svg = d3.create("svg")
		.attr("width", CANVAS_WIDTH)
		.attr("height", CANVAS_HEIGHT);
	
	const titleText = svg.append("text")
		.attr("x", CANVAS_WIDTH / 2)
		.attr("y", CHART_PADDING.top / 2)
		.attr("dy", "-0.4em")
		.attr("text-anchor", "middle")
		.attr("dominant-baseline", "hanging")
		.attr("font-size", `${TITLE_FONT_SIZE}px`)
		.text(title);

	const movableChartClipPath = svg.append("clipPath")
		.attr("id", "movableChartClipPath")
		.append("rect")
		.attr("x", CHART_PADDING.left)
		.attr("y", 0)
		.attr("width", CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right)
		.attr("height", CHART_HEIGHT)
		.attr("fill", "white");
	
	const xAxisInverseStaticClipPath = svg.append("clipPath")
		.attr("id", "xAxisInverseStaticClipPath")
		.append("rect")
		.attr("x", CHART_PADDING.left - 10)
		.attr("y", -10)
		.attr("width", CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right + 10)
		.attr("height", CHART_HEIGHT + 10)
		.attr("fill", "white");

	const movableChartGroupContainer = svg.append("g")
		.attr("clip-path", "url(#movableChartClipPath");
	const movableChartGroup = movableChartGroupContainer.append("g");

	const x = d3.scaleLinear()
		.domain([1 - X_AXIS_LEFT_MARGIN, data.length + X_AXIS_RIGHT_MARGIN])
		.range([CHART_PADDING.left, ((CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right) / (viewRange - X_AXIS_LEFT_MARGIN + X_AXIS_RIGHT_MARGIN)) * (data.length - X_AXIS_LEFT_MARGIN + X_AXIS_RIGHT_MARGIN) + CHART_PADDING.left]);

	const tickGap = (x.range()[1] - x.range()[0]) / (data.length - X_AXIS_LEFT_MARGIN + X_AXIS_RIGHT_MARGIN);

	const xAxis = customXAxis(x);
	
	if (XAxisInverseStatic) {
		const xAxisGroup = svg.append("g")
		.attr("transform", `translate(0, ${CHART_HEIGHT - CHART_PADDING.bottom})`)
		.call(xAxis)
		.attr("clip-path", "url(#xAxisInverseStaticClipPath");
	} else {
		const xAxisGroup = movableChartGroup.append("g")
		.attr("transform", `translate(0, ${CHART_HEIGHT - CHART_PADDING.bottom})`)
		.call(xAxis);
	}

	const y = d3.scaleLinear()
		.domain([0, 100])
		.range([CHART_HEIGHT - CHART_PADDING.bottom, CHART_PADDING.top]);
	
	const yAxis = d3.axisLeft(y)
		.tickSizeInner(AXIS_TICK_SIZE);
	const yAxisGroup = svg.append("g")
		.attr("transform", `translate(${CHART_PADDING.left}, 0)`)
		.call(yAxis);
	yAxisGroup.selectAll(".tick text")
		.style("fill", "gray")
		.style("font-size", AXIS_FONT_SIZE);

	const gridGroup = svg.insert("g", ":first-child");

	gridGroup.selectAll(".horizontal-line")
		.data(y.ticks())
		.join("line")
		.attr("class", "horizontal-line")
		.attr("x1", CHART_PADDING.left)
		.attr("x2", CHART_WIDTH - CHART_PADDING.right)
		.attr("y1", d => y(d))
		.attr("y2", d => y(d))
		.attr("stroke", "#eee");
	
	gridGroup.selectAll(".vertical-line")
		.data(d3.range(1, data.length + 1, TICK_FREQUENCY).slice(0, viewRange / TICK_FREQUENCY))
		.join("line")
		.attr("class", "vertical-line")
		.attr("x1", d => x(d))
		.attr("x2", d => x(d))
		.attr("y1", CHART_PADDING.top)
		.attr("y2", CHART_HEIGHT - CHART_PADDING.bottom)
		.attr("stroke", "#eee")
		.style("z-index", -1);
	
	const lines = movableChartGroup.append("path")
		.datum(data)
		.attr("stroke", "#8C8C8C")
		.attr("stroke-width", 1.5)
		.attr("fill", "none")
		.attr("d", d3.line()
			.x(d => x(d.index))
			.y(d => y(d.value))
		);

	const points = movableChartGroup.append("g")
		.selectAll("dot")
		.data(data)
		.enter()
		.append("circle")
		.attr("cx", d => x(d.index))
		.attr("cy", d => y(d.value))
		.attr("r", POINT_SIZE)
		.attr("fill", d => getThresholdColor(d.value));
	
	let rightPoint = data[currentIndex + viewRange - 1];
	let average = Math.round(d3.mean(
		data.slice(currentIndex + viewRange - rollingAverage + 1, currentIndex + viewRange + 1), 
		d => d.value
	));
	let labelValue = useRollingAverage ? average : rightPoint.value;
	let labelXPos = x(rightPoint.index);
	let labelYPos = y(labelValue);

	if (labelPosition === "side") {
		// TODO: dynamic spacing
		labelXPos = CHART_WIDTH + INFO_WIDTH / 2 - 10;
		labelYPos = CHART_HEIGHT / 1.85;
	} else if (labelPosition === "fixed") {
		labelYPos = y.range()[1] - 10;
	}

	const labelGroup = svg.append("g")
		.attr("transform", `translate(${labelXPos}, ${labelYPos})`);
		
	const linearFontSizeScale = d3.scaleLinear()
		.domain(y.domain())
		.range([LABEL_FONT_SIZE_RANGE[0], LABEL_FONT_SIZE_RANGE[1]]);

	const ushapedFontSizeScale = d3.scaleLinear()
		.domain([y.domain()[0], (y.domain()[0] + y.domain()[1]) / 2, y.domain()[1]])
		.range([LABEL_FONT_SIZE_RANGE[1], LABEL_FONT_SIZE_RANGE[0], LABEL_FONT_SIZE_RANGE[1]]);
	
	console.log(data.slice(currentIndex + viewRange - 4, currentIndex + viewRange + 1));

	const labelText = labelGroup.append("text")
		.text(labelValue)
		.attr("text-anchor", "middle")
		.attr("dominant-baseline", "middle")
		.style("font-family", "sans-serif")
		.style("font-size", getDynamicFontSize(labelValue))
		.style("fill", labelPosition === "side" ? "#121212" : "white");
	
	if (labelPosition !== "side") {
		labelText.transition()
			.duration(0)
			.on("end", function () {
				const textBBox = d3.select(this).node().getBBox();

				labelGroup.insert("rect", "text")
					.attr("x", textBBox.x - TEXT_PADDING.horizontal)
					.attr("y", textBBox.y - TEXT_PADDING.vertical)
					.attr("width", textBBox.width + 2 * TEXT_PADDING.horizontal)
					.attr("height", textBBox.height + 2 * TEXT_PADDING.vertical)
					.attr("fill", getThresholdColor(labelValue))
					.attr("rx", 3)
					.attr("ry", 3);
			});
	}


	function update(step, animTime) {
		currentIndex = step - 1;
		
		const anim = d3.transition("transmove").duration(animTime);
		if (easeInOut) {
			anim.ease(d3.easePoly.exponent(3));
		}

		rightPoint = data[currentIndex + viewRange - 1];
		average = Math.round(d3.mean(
			data.slice(currentIndex + viewRange - rollingAverage + 1, currentIndex + viewRange + 1), 
			d => d.value
		));
		labelValue = useRollingAverage ? average : rightPoint.value;

		movableChartGroup.transition(anim)
			.attr("transform", `translate(${-tickGap * currentIndex}, 0)`);
		
		if (labelPosition === "follow") {
			labelGroup.transition(anim).attr("transform", `translate(${labelXPos}, ${y(labelValue)})`);
		}
		
		labelText.text(labelValue)
			.style("font-size", getDynamicFontSize(labelValue));
		
		const textBBox = labelText.node().getBBox();
		labelGroup.transition(anim).select("rect")
			.attr("x", textBBox.x - TEXT_PADDING.horizontal)
			.attr("y", textBBox.y - TEXT_PADDING.vertical)
			.attr("width", textBBox.width + 2 * TEXT_PADDING.horizontal)
			.attr("height", textBBox.height + 2 * TEXT_PADDING.vertical)
			.attr("fill", getThresholdColor(labelValue));
	}

	function resize() {

	}

	function customXAxis(scale) {
		const axis = d3.axisBottom(scale)
			.tickValues(d3.range(1, data.length + 1, TICK_FREQUENCY))
			.tickFormat(showXAxisTicks ? d3.format("d") : "")
			.tickSizeInner(showXAxisTicks ? AXIS_TICK_SIZE : 0);

		if (XAxisInverseStatic) {
			axis.tickFormat(showXAxisTicks ? (d, i) => (i + 1 - viewRange) : "");
		}

		return function (selection) {
			selection.call(axis);
			// selection.selectAll(".domain")
			// 	.attr("d", d => {
			// 		const old = d3.select(selection.node()).select(".domain").attr("d");
			// 		return old.replace(/V-?\d+(\.\d+)?$/, "");
			// 	});

			selection.selectAll(".tick text")
				.style("fill", "gray")
				.style("font-size", AXIS_FONT_SIZE);
		};
	}

	function getThresholdColor(n) {
		if (!showThreshold) {
			return "#8C8C8C";
		}

		if (n > MAX_THRESHOLD) {
			return "#FF7F50";
		} else if (n < MIN_THRESHOLD) {
			return "#00B2EE";
		} else {
			return "#8C8C8C";
		}
	}

	function getBackgroundColor(n) {
		if (!backgroundEncoding) {
			return "white";
		}

		if (n > MAX_THRESHOLD) {
			return "#FFBFA8";
		} else if (n < MIN_THRESHOLD) {
			return "#80D9F7";
		} else {
			return "white";
		}
	}


	function getDynamicFontSize(n) {
		if (labelPosition === "side") {
			return `74px`;
		}

		if (dynamicLabelSize === "none") {
			return `${LABEL_FONT_DEFAULT_SIZE}px`;
		} else if (dynamicLabelSize === "linear") {
			return `${linearFontSizeScale(n)}px`;
		} else if (dynamicLabelSize === "ushaped") {
			return `${ushapedFontSizeScale(n)}px`;
		}
	}
	
	Object.assign(svg.node(), { update, resize });
	return svg.node();
}