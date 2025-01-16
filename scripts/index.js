/** This is for d3.js intelliSense */
/** @type {import("d3")} */

Promise.all([
    d3.csv('data/demo_data1.csv', d3.autoType),
    d3.csv('data/demo_data2.csv', d3.autoType),
    d3.csv('data/demo_data3.csv', d3.autoType),
]).then((datasets) => {

    const ROWS = 4;
    const COLS = 5;

    let INTERVAL_ID;
    const ANIM_DURATION = 500;
    const ANIM_DELAY = 1500;
    let step = 1;

    const container = d3.select("#container");
    const chartsContainer = container.select("#chartsContainer")
        .style("grid-template-rows", `repeat(${ROWS}, 1fr)`)
        .style("grid-template-columns", `repeat(${COLS}, 1fr)`)

    const { width: gridWidth, height: gridHeight } = chartsContainer.node().getBoundingClientRect();
    let cellWidth = gridWidth / COLS;
    let cellHeight = gridHeight / ROWS;

    // Fills the titles array
    const titles = Array.from({ length: 3 }, (_, i) => `Machine ${i + 1}`);
    const charts = chartsContainer.selectAll("div")
        .data(d3.zip(datasets, titles))
        .join("div")
        .append(([data, title]) => generateChart(data, title, cellWidth, cellHeight))
        .nodes();


    function startAnimation() {
        INTERVAL_ID = setInterval(animate, ANIM_DELAY);
    }

    function stopAnimation() {
        clearInterval(INTERVAL_ID);
    }

    function animate() {
        for (let chart of charts) {
            chart.update(step, ANIM_DURATION);
        }
        step++;
    }

    startAnimation();
})