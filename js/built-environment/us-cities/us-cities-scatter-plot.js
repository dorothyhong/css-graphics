(function () {
  /* ----------------------- Create Tooltip ------------------------ */
  const container = document.getElementById("us-cities-scatter-plot");

  const tooltipDiv = document.createElement("div");
  tooltipDiv.id = "tooltip";
  tooltipDiv.className = "tooltip";
  container.appendChild(tooltipDiv);

  const tooltip = d3.select(container).select("#tooltip");

  /* ----------------------- Dynamic dimensions ----------------------- */
  const aspectRatio = 0.7;

  // Get the container and its dimensions
  const containerWidth = container.offsetWidth; // Use offsetWidth for full element width
  const containerHeight = containerWidth * aspectRatio; // Calculate the height based on the width and aspect ratio

  // Calculate the dynamic margins
  const dynamicMargin = {
    top: containerHeight * 0.05,
    right: containerWidth * 0.2,
    bottom: containerHeight * 0.12,
    left: containerWidth * 0.1,
  };

  // Calculate the width and height for the inner drawing area
  const width = containerWidth - dynamicMargin.left - dynamicMargin.right;
  const height = containerHeight - dynamicMargin.top - dynamicMargin.bottom;

  // Append SVG object
  const svg = d3
    .select("#us-cities-scatter-plot")
    .append("svg")
    .attr("viewBox", `0 0 ${containerWidth} ${containerHeight}`)
    .attr("preserveAspectRatio", "xMinYMin meet")
    .append("g")
    .attr("transform", `translate(${dynamicMargin.left},${dynamicMargin.top})`);

  /* ----------------------- X and Y Scales ----------------------- */
  const x = d3.scaleLinear().range([0, width]);
  const y = d3.scaleLinear().range([height, 0]);

  const xAxis = d3.axisBottom(x);
  const yAxis = d3.axisLeft(y).tickFormat((d) => d / 1000);

  // Define color scale for continents
  const colorScale = d3
    .scaleOrdinal()
    .domain(["North America", "Europe", "Asia", "Australia"])
    .range(["#8FC7E5", "#386660", "#3167A3", "#1D476D"]);

  /* ----------------------- Load and process the CSV data ----------------------- */

  d3.csv(uscities2).then((data) => {
    // Process the data
    data.forEach((d) => {
      d.Density = +d.Density;
      d.Energy = +d.Energy;

      // Assign continents based on city names
      if (
        [
          "Sacramento",
          "Houston",
          "Phoenix",
          "San Diego",
          "San Francisco",
          "Denver",
          "Los Angeles",
          "Detroit",
          "Boston",
          "Washington",
          "Chicago",
          "New York",
          "Toronto",
          "Calgary",
          "Winnipeg",
          "Vancouver",
          "Ottawa",
        ].includes(d.City)
      ) {
        d.Continent = "North America";
      } else if (
        [
          "Frankfurt",
          "Brussels",
          "Hamburg",
          "Zurich",
          "Stockholm",
          "Vienna",
          "Copenhagen",
          "Paris",
          "Munich",
          "Amsterdam",
          "London",
        ].includes(d.City)
      ) {
        d.Continent = "Europe";
      } else if (
        [
          "Singapore",
          "Tokyo",
          "Hong Kong",
          "Kuala Lumpur",
          "Jakarta",
          "Bangkok",
          "Seoul",
          "Manila",
          "Surabaya",
        ].includes(d.City)
      ) {
        d.Continent = "Asia";
      } else if (
        [
          "Perth",
          "Brisbane",
          "Melbourne",
          "Sydney",
          "Canberra",
          "Adelaide",
        ].includes(d.City)
      ) {
        d.Continent = "Australia";
      }
    });

    // Update the scale domains with the processed data
    const maxXValue = Math.ceil(d3.max(data, (d) => d.Density) / 50) * 50;
    x.domain([0, maxXValue]);

    const maxYValue = Math.ceil(d3.max(data, (d) => d.Energy) / 10000) * 10000;
    y.domain([0, maxYValue]);

    // Draw X-axis
    const xAxisGroup = svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(xAxis);

    xAxisGroup.selectAll(".tick text").attr("class", "chart-labels");

    // Draw Y-axis
    const yAxisGroup = svg
      .append("g")
      .call(yAxis)
      .attr("class", "chart-labels");

    // Append y-axis label
    yAxisGroup
      .append("text")
      .attr("class", "chart-labels")
      .attr("text-anchor", "middle")
      .attr(
        "transform",
        `rotate(-90) translate(${-height / 2}, ${-dynamicMargin.left * 0.7})`
      )
      .style("fill", "#000")
      .text("Energy Consumption (per 1000 MJ)");

    /* ----------------------- Draw the scatter plot ----------------------- */
    // Calculate the dynamic circle radius
    const circleRadius = width * 0.01; // Set the radius to be 2% of the container width

    const formatNumber = d3.format(",");
    const circles = svg
      .selectAll(".dot")
      .data(data)
      .enter()
      .append("circle")
      .attr("class", "dot")
      .attr("cx", (d) => x(d.Density))
      .attr("cy", (d) => y(d.Energy))
      .attr("r", circleRadius) // Use the dynamic radius here
      .style("fill", (d) => colorScale(d.Continent))
      .on("mouseover", function (event, d) {
        d3.select(this) // Select the hovered circle
          .style("fill", "orange"); // Change the color on hover

        const tooltipX = event.clientX;
        const tooltipY = event.clientY;

        tooltip
          .style("opacity", 0.9)
          .style("left", `${tooltipX + dynamicMargin.left / 4}px`)
          .style("top", `${tooltipY}px`)
          .html(
            `<div class="tooltip-title">${d.City}</div>
                <table class="tooltip-content">
                    <tr>
                        <td>Density:</td>
                        <td class="value">${formatNumber(d.Density)}</td>
                    </tr>
                    <tr>
                        <td>Energy:</td>
                        <td class="value">${formatNumber(d.Energy)}</td>
                    </tr>
                </table>`
          );
      })
      .on("mousemove", function (event) {
        tooltip
          .style("left", `${tooltipX + dynamicMargin.left / 4}px`)
          .style("top", `${tooltipY}px`);
      })
      .on("mouseout", function (event, d) {
        d3.select(this) // Select the circle
          .style("fill", (d) => colorScale(d.Continent)); // Revert to original color

        // Revert the opacity of all circles
        //   d3.selectAll(".dot").style("opacity", 1);

        tooltip.style("opacity", 0);
      });

    // Append x-axis label
    svg
      .append("text")
      .attr("class", "chart-labels")
      .attr("text-anchor", "middle")
      .attr(
        "transform",
        `translate(${width / 2}, ${height + dynamicMargin.bottom * 0.8})`
      )
      .style("fill", "#000")
      .text("Population Density (Inhabitants per Hectare)");

    /* ----------------------- Add Power Regression Line ----------------------- */
    const powerRegression = d3
      .regressionPow()
      .x((d) => d.Density)
      .y((d) => d.Energy)
      .domain(d3.extent(data, (d) => d.Density));

    const trendline = powerRegression(data);

    const line = d3
      .line()
      .x((d) => x(d[0]))
      .y((d) => y(d[1]));

    svg
      .append("path")
      .datum(trendline)
      .attr("fill", "none")
      .attr("stroke", "gray")
      .attr("stroke-width", 2)
      .attr("d", line);

    /* ----------------------- Add Legend ----------------------- */
    const legend = svg
      .append("g")
      .attr(
        "transform",
        `translate(${width - dynamicMargin.right * 0.8}, ${dynamicMargin.top})`
      );

    const legendData = [
      { continent: "North America", color: "#8FC7E5" },
      { continent: "Europe", color: "#386660" },
      { continent: "Asia", color: "#3167A3" },
      { continent: "Australia", color: "#1D476D" },
    ];

    // Calculate the dimensions for legend items
    const legendItemSize = width * 0.04; // Set the width and height to be 4% of the container width
    const gap = width * 0.01; // Decrease the gap between legend items

    legendData.forEach((d, i) => {
      legend
        .append("rect")
        .attr("x", 0)
        .attr("y", i * (legendItemSize + gap)) // Adjust spacing between legend items
        .attr("width", legendItemSize)
        .attr("height", legendItemSize)
        .style("fill", d.color)
        .attr("rx", 3)
        .attr("ry", 3)
        .attr("class", "legend-rect")
        .on("mouseover", function () {
          d3.select(this).style("stroke", "white").style("stroke-width", "2px");

          d3.selectAll(".dot")
            .style("opacity", 0.1)
            .filter((circleData) => circleData.Continent === d.continent)
            .style("opacity", 1);
        })
        .on("mouseout", function () {
          d3.select(this).style("stroke", "none");

          d3.selectAll(".dot").style("opacity", 1);
        });

      legend
        .append("text")
        .attr("x", legendItemSize + gap)
        .attr("y", i * (legendItemSize + gap) + legendItemSize / 2)
        .attr("alignment-baseline", "middle")
        .text(d.continent)
        .attr("class", "chart-labels");
    });
  });
})();
