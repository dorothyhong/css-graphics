(function () {
   /* ----------------------- Create Tooltip ------------------------ */
   const container = document.getElementById("biofuels-bar-chart2");

   const tooltipDiv = document.createElement("div");
   tooltipDiv.id = "tooltip";
   tooltipDiv.className = "tooltip";
   container.appendChild(tooltipDiv);
 
   const tooltip = d3.select(container).select("#tooltip");

  /* ----------------------- Dynamic dimensions ----------------------- */
  const aspectRatio = 0.7;
  const containerWidth = container.offsetWidth;
  const containerHeight = containerWidth * aspectRatio;

  const dynamicMargin = {
    top: containerHeight * 0.02,
    right: containerWidth * 0.1,
    bottom: containerHeight * 0.15,
    left: containerWidth * 0.15,
  };

  const width = containerWidth - dynamicMargin.left - dynamicMargin.right;
  const height = containerHeight - dynamicMargin.top - dynamicMargin.bottom;

  const svg = d3
    .select("#biofuels-bar-chart2")
    .append("svg")
    .attr("viewBox", `0 0 ${containerWidth} ${containerHeight}`)
    .attr("preserveAspectRatio", "xMinYMin meet")
    .append("g")
    .attr("transform", `translate(${dynamicMargin.left},${dynamicMargin.top})`);

  /* ----------------------- Scales, axes, and color ----------------------- */
  const yScale = d3.scaleBand().range([height, 0]).padding(0.05);
  const xScale = d3.scaleLinear().range([0, width]);
  const colorScale = d3.scaleOrdinal()
    .range(["#1d476d", "#3167a4", "#8fc8e5", "#386660", "#ffcb03", "#ce5845", "#ed974a"]);
  const formatDecimal = d3.format(".0f");

  const xAxis = (g) => g
    .call(d3.axisBottom(xScale).tickValues([0, 50, 100, 150, 200]))
    .call(g => g.select(".domain").attr("stroke", "none"))  // This removes the x-axis line
    .call(g => g.selectAll(".tick line").attr("stroke", "#aaaaaa").attr("stroke-width", "0.2"))  // Make tick lines light grey
    .call(g => g.selectAll(".tick text").attr("class", "chart-labels").attr("fill", "#000"));  // Make tick texts light grey

  const yAxis = (g) => g.call(d3.axisLeft(yScale).tickSizeOuter(0).tickSizeInner(0).tickPadding(10));

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height + dynamicMargin.bottom * 0.7)
    .attr("class", "chart-labels")
    .attr("text-anchor", "middle")
    .attr("fill", "#000")
    .text("Biofuel Yield (GJ/ha)");

  /* ----------------------- Loading and processing data ----------------------- */

  d3.csv(biofuels3, (d) => ({
    feedstock: d.Feedstock,
    region: d.Region,
    biofuelYield: +d["Biofuel Yield"],
  })).then((data) => {
    const feedstocks = [...new Set(data.map((d) => d.feedstock))];
    const maxRegions = d3.max(feedstocks.map(feedstock => data.filter(d => d.feedstock === feedstock).length));

    yScale.domain(feedstocks);
    xScale.domain([0, 200]);  // Adjust the domain to match your tick values

    svg
      .append("g")
      .call(yAxis)
      .selectAll(".tick text")
      .attr("class", "chart-labels")
      .style("font-weight", "bold");  

    const xAxisGroup = svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(xAxis);

    // Add vertical grid lines
    svg.selectAll("line.vertical-grid")
      .data(xScale.ticks(5))  // Adjust to match tickValues
      .enter()
      .append("line")
      .attr("class", "vertical-grid")
      .attr("x1", d => xScale(d))
      .attr("x2", d => xScale(d))
      .attr("y1", 0)
      .attr("y2", height)
      .attr("stroke", "#aaaaaa")
      .attr("stroke-width", "1")
      .attr("stroke-width", "0.2");

    const feedstockGroups = svg
      .selectAll(".feedstock-group")
      .data(feedstocks)
      .enter()
      .append("g")
      .attr("class", "feedstock-group")
      .attr("transform", (d) => `translate(0, ${yScale(d)})`);

    const barHeight = yScale.bandwidth() / maxRegions;
    const paddingBetweenBars = 1;

    feedstockGroups
      .selectAll(".bar")
      .data((d) => data.filter((item) => item.feedstock === d))
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("y", (d, i, nodes) => {
        const numRegions = nodes.length;
        return i * barHeight + (yScale.bandwidth() - barHeight * numRegions) / 2;
      })
      .attr("x", 0)
      .attr("height", barHeight - paddingBetweenBars)
      .attr("width", (d) => xScale(d.biofuelYield))
      .attr("fill", (d) => colorScale(d.feedstock))
      .on('mouseover', function (event, d) {

        d3.select(this)
          .attr("opacity", 0.5);

        const tooltipX = event.clientX;
        const tooltipY = event.clientY;

        tooltip.html(`
          <div class="tooltip-title">${d.region}</div>
          <table class="tooltip-content">
            <tr>
              <td>Biofuel Yield:</td>
              <td class="value"><strong>${formatDecimal(d.biofuelYield)}</strong> GJ/ha</td>
            </tr>
          </table>
        `)
          .style('opacity', '0.9')
          .style("left", `${tooltipX + dynamicMargin.left / 4}px`)
          .style("top", `${tooltipY}px`);
      })
      .on("mousemove", function (event) {
        tooltip.style("left", `${tooltipX + dynamicMargin.left / 4}px`)
          .style("top", `${tooltipY}px`);
      })
      .on("mouseout", function () {
        d3.select(this)
        d3.select(this).attr("opacity", 1);

        tooltip.style('opacity', '0');
      });

    feedstockGroups
      .selectAll(".label")
      .data((d) => data.filter((item) => item.feedstock === d))
      .enter()
      .append("text")
      .attr("class", "chart-labels")
      .attr("x", (d) => xScale(d.biofuelYield) + 5)
      .attr("y", (d, i, nodes) => {
        const numRegions = nodes.length;
        return i * barHeight + (yScale.bandwidth() - barHeight * numRegions) / 2 + barHeight / 2;
      })
      .attr("dy", "0.35em")
      .attr("text-anchor", "start")
      .text((d) => d.region)
      .attr("fill", "#000");
  });
})();