(async () => {
  // Load data from external sources
  const us = await d3.json("https://d3js.org/us-10m.v2.json");

  // Define csv file path if it's not already defined
  if (typeof csvFile === "undefined") {
    var csvFile = "../../data/energy/grid-energy/grid-energy1.csv";
  }

  const projectData = await d3.csv(csvFile);

  // Maps of state states to color and storage data
  const fipsToData = {};
  projectData.forEach((d) => {
    let color;
    const projects = parseInt(d.Projects);
    if (projects === 0) color = "#aa4949";
    else if (projects >= 289) color = "#4f9b52";
    else if (projects >= 20 && projects <= 80) color = "#94ce89";
    else if (projects >= 5 && projects <= 19) color = "#8ab4e0";
    else if (projects >= 1 && projects <= 4) color = "#c77c7c";

    fipsToData[d.States] = {
      color: color,
      projects: d.Projects,
    };
  });

  const states = topojson.feature(us, us.objects.states).features.map((d) => {
    const data = fipsToData[d.id] || {};
    d.properties = { ...d.properties, ...data };
    return d;
  });

  const aspectRatio = 0.65; // Define an aspect ratio for the chart

  // Get the container and its dimensions
  const container = document.getElementById("grid-energy-interactive-map");
  const containerWidth = container.offsetWidth; // Use offsetWidth for full element width
  const containerHeight = containerWidth * aspectRatio; // Calculate the height based on the width and aspect ratio

  // Calculate the dynamic margins
  const dynamicMargin = {
    top: containerHeight * 0.05, // 5% of the container height
    right: containerWidth * 0.15, // 15% of the container width
    bottom: containerHeight * 0.1, // 10% of the container height
    left: containerWidth * 0.08, // 5% of the container width
  };

  // Calculate the width and height for the inner drawing area
  const width = containerWidth - dynamicMargin.left - dynamicMargin.right;
  const height = containerHeight - dynamicMargin.top - dynamicMargin.bottom;

  // Append SVG object
  const svg = d3
    .select("#grid-energy-interactive-map")
    .append("svg")
    .attr("viewBox", `0 0 ${containerWidth} ${containerHeight}`)
    .attr("preserveAspectRatio", "xMinYMin meet")
    .append("g")
    .attr("transform", `translate(${dynamicMargin.left},${dynamicMargin.top})`);

  // Define the scale factor for the map
  const scaleFactor = width / 850; // Adjust this scaling factor as needed

  // Create geoTransform function to scale down the map
  const transform = d3.geoTransform({
    point: function (x, y) {
      this.stream.point(x * scaleFactor, y * scaleFactor);
    },
  });
  const path = d3.geoPath().projection(transform);

  const tooltip = d3.select("#diagram-tooltip");

  // Highlight states based on the color
  const highlightStates = (color) => {
    svg
      .selectAll("path")
      .transition()
      .style("opacity", (d) => (d.properties.color === color ? 1 : 0.2));

    legendContainer
      .selectAll("rect")
      .style("opacity", (d) => (d === color ? 1 : 0.2));
  };

  // Reset highlighting to default
  const resetHighlight = () => {
    svg.selectAll("path").transition().style("opacity", 1);

    legendContainer.selectAll("rect").style("opacity", 1);
  };

  const formatNumber = d3.format(",");

  // Draw the map
  svg
    .append("g")
    .selectAll("path")
    .data(states)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("fill", (d) => d.properties.color || "#fff")
    .attr("stroke", "#000")
    .attr("stroke-width", 0.5)
    .on("mouseover", function (event, d) {
      // d3.select(this).style("fill-opacity", 0.7);

      const tooltipX = event.clientX + window.scrollX;
      const tooltipY = event.clientY + window.scrollY;

      tooltip
        .html(
          `<div class="tooltip-title">${d.properties.name}</div>
               <div class="tooltip-content">
               Projects: ${d.properties.projects || 0}
               </div>`
        )
        .style("opacity", 0.9)
        .style("left", `${tooltipX}px`)
        .style("top", `${tooltipY}px`);
    })
    .on("mouseout", function () {
      d3.select(this).style("fill-opacity", 1);
      tooltip.style("opacity", 0);
    });

  // Create the legend
  const legendColors = ["#4f9b52", "#94ce89", "#8ab4e0", "#c77c7c", "#aa4949"];
  const legendText = ["≥ 289", "20-80", "5-19", "1-4", "0"];

  const legendData = legendColors.map((color, i) => ({
    color,
    text: legendText[i],
  }));

  // Adjust legend position to the right of the map.
  const legend = svg
    .append("g")
    .attr("class", "legend")
    .attr(
      "transform",
      `translate(${width + dynamicMargin.left / 2}, ${height / 2})`
    ); // Adjust this line for legend positioning

  // Calculate the legend rectangle dimensions based on container size
  const legendRectWidth = containerWidth * 0.02; // 2% of container width
  const legendRectHeight = containerHeight * 0.02; // 2% of container height

  legend
    .selectAll("rect")
    .data(legendData)
    .enter()
    .append("rect")
    .attr("x", 0)
    .attr("y", (d, i) => i * (legendRectHeight + 5)) // Add some spacing between rectangles
    .attr("width", legendRectWidth)
    .attr("height", legendRectHeight)
    .style("fill", (d) => d.color)
    .attr("stroke", "#000")
    .attr("stroke-width", 0.5)
    .on("mouseover", (event, d) => highlightStates(d.color))
    .on("mouseout", resetHighlight);

  legend
    .selectAll("text")
    .data(legendData)
    .enter()
    .append("text")
    .attr("x", legendRectWidth + 5) // Position text to the right of the rectangle
    .attr("y", (d, i) => i * (legendRectHeight + 5) + legendRectHeight) // Center text vertically
    .text((d) => d.text)
    .attr("class", "chart-labels")
    .on("mouseover", (event, d) => highlightStates(d.color))
    .on("mouseout", resetHighlight);
})();
