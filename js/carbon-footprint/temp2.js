(function () {
    // Dynamic dimensions
    const aspectRatio = 0.7;

    // Get the container and its dimensions
    const container = document.getElementById("carbon-footprint-stacked-column-chart");
    const containerWidth = container.offsetWidth;
    const containerHeight = containerWidth * aspectRatio;

    // Calculate the dynamic margins
    const dynamicMargin = {
        top: containerHeight * 0.15,
        right: containerWidth * 0.6,
        bottom: containerHeight * 0.05,
        left: containerWidth * 0.08,
    };

    // Calculate the width and height for the inner drawing area
    const width = containerWidth - dynamicMargin.left - dynamicMargin.right;
    const height = containerHeight - dynamicMargin.top - dynamicMargin.bottom;

    // Append SVG object
    const svg = d3
        .select("#carbon-footprint-stacked-column-chart")
        .append("svg")
        .attr("viewBox", `0 0 ${containerWidth} ${containerHeight}`)
        .attr("preserveAspectRatio", "xMinYMin meet")
        .append("g")
        .attr("transform", `translate(${dynamicMargin.left},${dynamicMargin.top})`);

    // Add the title
    svg.append("text")
        .attr("class", "chart-title")
        .attr("text-anchor", "start")
        .attr("transform", `translate(-${dynamicMargin.left}, -${dynamicMargin.top / 2})`)
        .text("Greenhouse Gases Contribution by Food Type in Average Diet");

    // Load data from CSV - replace with the correct path to your CSV file
    d3.csv("./data/carbon-footprint/carbon-footprint1.csv").then((data) => {
        // Process data and calculate percentages
        const categories = data.columns.slice(1); // assuming the first column is 'Location'

        // Since we have only one row, use the first (and only) row for data
        const row = data[0];

        // Convert to percentage
        let total = 0;
        categories.forEach((category) => {
            row[category] = +row[category];
            total += row[category];
        });

        // Store original values and calculate percentages
        categories.forEach((category) => {
            row[category + "_original"] = row[category]; // Store original value in a new property
            row[category] = (row[category] / total) * 100; // Convert to percentage
        });

        // Define scales
        const yScale = d3.scaleLinear().range([height, 0]).domain([0, 100]);
        const xScale = d3.scaleBand()
            .range([0, width])
            .domain(["Total"])
            .padding(0.1);

        // Define the colors for the stack
        const colorScale = d3
            .scaleOrdinal()
            .range([
                "#3167a4",
                "#8fc8e5",
                "#386660",
                "#e2e27a",
                "#ffcb03",
                "#ce5845",
                "#ed974a",
            ]);

        const tooltip = d3.select("#tooltip");

        // Add one group for the single data row
        const groups = svg
            .selectAll("g.layer")
            .data(d3.stack().keys(categories)([row]))
            .enter()
            .append("g")
            .classed("layer", true)
            .style("fill", (d) => colorScale(d.key));

        // Draw the bars
        groups
            .selectAll("rect")
            .data((d) => d)
            .enter()
            .append("rect")
            .attr("x", () => xScale("Total"))
            .attr("y", (d) => yScale(d[1]))
            .attr("width", xScale.bandwidth())
            .attr("height", (d) => yScale(d[0]) - yScale(d[1]));

        // Add legend texts to the right of the bars
        groups
            .selectAll("text")
            .data((d) => d)
            .enter()
            .append("text")
            .attr("class", "chart-labels")
            .attr("x", () => xScale("Total") + xScale.bandwidth() + 5) // 5 pixels to the right of the bar
            .attr("y", (d) => yScale(d[0]) + (yScale(d[1]) - yScale(d[0])) / 2)
            .attr("dy", "0.35em")
            .attr("text-anchor", "start")
            .text((d, i, g) => d3.select(g[i].parentNode).datum().key); // Correctly access the key (category) for the legend text

        const formatNumber = d3.format(",");

        // Update mouseover behavior for rects
        groups
            .selectAll("rect")
            .on("mouseover", function (event, d) {
                // Make the tooltip visible
                tooltip.style("opacity", 1);

                // Highlight the hovered bar and mute others
                d3.select(this)
                    .style("opacity", 1)
                    .style("stroke-width", 3) // Optional: Add a border to highlight the rect
                    .style("stroke", "white"); // Optional: Border color

                groups
                    .selectAll("rect")
                    .filter((rect) => rect.data.Location !== d.data.Location)
                    .style("opacity", 0.5);
            })
            .on("mousemove", function (event, d) {
                const mousePosition = d3.pointer(event);
                const category = d3.select(this.parentNode).datum().key;

                tooltip
                    .html(
                        `
              <div class="tooltip-title"><span class="color-legend" style="background-color: ${colorScale(
                            category
                        )};"></span>${category}</div>

              <table class="tooltip-content">
                  <tr>
                  <td>
                      Percent
                  </td>
                  <td class="value">${formatNumber(d.data[category].toFixed(1))}%</td>
                  </tr>
              </table>`
                    )
                    .style("opacity", 0.9)
                    .style("left", event.pageX + 15 + "px")
                    .style("top", event.pageY - 28 + "px");
            })
            .on("mouseout", function () {
                // Hide the tooltip
                tooltip.style("opacity", 0);

                // Restore opacity and remove the border
                d3.select(this).style("opacity", 1).style("stroke-width", 0);

                groups.selectAll("rect").style("opacity", 1);
            });

        // Create custom tick values
        const tickValues = d3.range(0, 101, 20); // Generates an array [0, 20, 40, 60, 80, 100]

        // Add an axis to show the percentage
        const yAxis = d3
            .axisLeft(yScale)
            .tickValues(tickValues) // Set custom tick values
            .tickFormat((d) => d + "%");

        // Append yAxis to svg
        const yAxisGroup = svg
            .append("g")
            .attr("class", "chart-labels")
            .call(yAxis);

        // Optional: Add an xAxis
        const xAxis = d3
            .axisBottom(xScale)
            .tickSizeOuter(0)
            .tickSizeInner(0)
            .tickPadding(5);
        svg
            .append("g")
            .attr("transform", `translate(0, ${height})`)
            .attr("class", "chart-labels")
            .call(xAxis);
    });
})();