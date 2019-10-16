
// Light theme
// var backgroundColor = "white",
// 	pointsColorCold = "gray",
// 	pointsColorHot = "gray",
// 	labelsPrimaryColor = "black",
// 	labelsSecondaryColor = "silver";

// Blue dark theme
var backgroundColor = "#192428",
	pointsColorCold = "#2e86ab",
	pointsColorHot = "#39ace7",
	labelsPrimaryColor = "#0784b5",
	labelsSecondaryColor = "#414c50";

var connected = false;

var updateVisualization;

var initVisualization = () => {
	var stompClient;

	// Simple circular buffer
	var dataBufferSize = 500,
		dataBufferIndex = 0;
		dataBuffer = [];
		addToBuffer = (point) => {
			dataBuffer[dataBufferIndex] = point;
			dataBufferIndex = (dataBufferIndex + 1) % dataBufferSize;
		}

	// SVG properties
	var svgPadding = 20,
		width = Math.max(document.documentElement.clientWidth, window.innerWidth || 0) - svgPadding,
		height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0) - svgPadding;

	// Chart Y axis parameters
	var yPadding = 50,
		yTop = -height/2 + yPadding,
		yBottom = height/2 - yPadding,
		yRange = 2,
		yLogScaleShift = 1,
		yLogScalePOS = d3.scaleLog([yLogScaleShift, yLogScaleShift + yRange], [0, yTop]),
		yLogScaleNEG = d3.scaleLog([-yLogScaleShift, -yLogScaleShift - yRange], [0, yBottom]),
		valueToYCoordinate = (value) => value > 0 ? yLogScalePOS(value + yLogScaleShift) : yLogScaleNEG(value - yLogScaleShift);

	// Chart X axis parameters
	var xPadding = 150,
		xLeft = -width/2 + xPadding,
		xRight = width/2 - xPadding,
		stepDistance = (xRight - xLeft) / (dataBufferSize-1);

	// Reference lines data
	var referenceData = [{value: 0}];
	var initialTick = yRange/10,
		nTicks = 5;
	for (var i = 0; i < nTicks; i++) {
		referenceData.push({value: initialTick*Math.pow(2, i)});
		referenceData.push({value: -initialTick*Math.pow(2, i)});
	}
	referenceData = referenceData.filter(d => Math.abs(valueToYCoordinate(d.value)) < yBottom);

	// Buttons functions
		activateButton = (id) => {
			d3.select(".button#" + id).style("stroke", labelsPrimaryColor);
			d3.select(".button-label#" + id).style("fill", labelsPrimaryColor);
		},
		deactivateButton = (id) => {
			d3.select(".button#" + id).style("stroke", labelsSecondaryColor);
			d3.select(".button-label#" + id).style("fill", labelsSecondaryColor);
		},
		connect = () => {
			if (!connected) {
				deactivateButton("connect");
				activateButton("disconnect");
				connected = true;
			}
		},
		disconnect = () => {
			if (connected) {
				deactivateButton("disconnect");
				activateButton("connect");
				connected = false;
			}
		};

	// Buttons data
	var buttonsData = [
		{
			id: "connect",
			x: -width/2 + xPadding,
			y: -height/2 + 15,
			text: "connect",
			width: 100,
			height: 25,
			onClick: connect
		}, {
			id: "disconnect",
			x: -width/2 + xPadding + 15 + 100,
			y: -height/2 + 15,
			text: "disconnect",
			width: 100,
			height: 25,
			onClick: disconnect
		}
	];

	// Append SVG
	var svg = d3.select("#viz")
		.append("svg")
		.attr("width", width)
	    .attr("height", height)
	    .style("background-color", backgroundColor)
	    .append('g')
	    .attr("transform", `translate(${width / 2}, ${height / 2})`);

	// Draw buttons
	svg.selectAll(".button")
		.data(buttonsData)
		.enter()
		.append("rect")
		.attr("id", d => d.id)
		.attr("class", "button")
		.attr("x", d => d.x)
		.attr("y", d => d.y)
		.attr("width", d => d.width)
		.attr("height", d => d.height)
		.style("stroke", labelsPrimaryColor)
		.style("stroke-width", .5)
		.style("fill", backgroundColor)
		.style("cursor", "pointer")
		.on("click", d => d.onClick());

	// Add buttons labels
	svg.selectAll(".button-label")
		.data(buttonsData)
		.enter()
		.append("text")
		.attr("id", d => d.id)
		.attr("class", "button-label")
		.attr("x", d => d.x + d.width/2)
		.attr("y", d => d.y + d.height/2)
		.attr("text-anchor", "middle")
		.style("pointer-events", "none")
	    .style("fill", labelsPrimaryColor)
		.text(d => d.text);

	deactivateButton("disconnect");

	// Draw reference lines
	svg.selectAll("path")
		.data(referenceData)
		.enter()
		.append("path")
		.attr("d", d => {
			var p = d3.path();
			p.moveTo(xLeft, valueToYCoordinate(d.value));
			p.lineTo(xRight, valueToYCoordinate(d.value));
			return p.toString();
		})
		.style("fill", "none")
		.style("stroke", d => d.value == 0 ? labelsPrimaryColor : labelsSecondaryColor)
		.style("stroke-width", 1)
		.style("stroke-dasharray", d => d.value == 0 ? null : "2, 2");

	// Add left labels
	svg.selectAll(".left-labels")
		.data(referenceData)
		.enter()
		.append("text")
		.attr("class", "left-labels")
		.attr("x", d => xLeft - 10)
		.attr("y", d => valueToYCoordinate(d.value))
		.attr("text-anchor", "end")
	    .style("fill", d => d.value == 0 ? labelsPrimaryColor : labelsSecondaryColor)
		.text(d => {
			if (d.value == 0) {
				return "𝜋";
			} else if (d.value > 0) {
				return "+" + d.value.toFixed(2);
			} else {
				return d.value.toFixed(2);
			}
		});

	// Add right labels
	var nLabel = svg.append("text")
		.attr("class", "right-labels")
		.attr("x", d => xRight + 10)
		.attr("y", 0)
		.attr("text-anchor", "start")
	    .style("fill", labelsPrimaryColor)
		.text("N = 0");

	// Apply global text properties
	svg.selectAll("text")
		.attr("dominant-baseline", "middle")
		.style("font-family", "Consolas, Monaco, Lucida Console")
	    .style("font-size", "12px");

	// Bind update visualization function
	var i = 0;
    updateVisualization = (point) => {

    	// Copmute x coordinate
        var pointX;
        if (i < dataBufferSize) {
            pointX = xLeft + i*stepDistance;
        } else {
            pointX = xLeft + (dataBufferSize - 1)*stepDistance;
            dataBuffer.forEach(point => point.x = point.x - stepDistance);
        }

        // Put the point in the buffer
        addToBuffer({
            id: i,
            pi: point.pi,
            deltaPi: point.pi - Math.PI,
            x: pointX,
            y: valueToYCoordinate(point.pi - Math.PI)
        });

        // Select points
        var points = svg.selectAll("circle")
            .data(dataBuffer, d => d.id);

        // Enter selection
        points.enter()
            .append("circle")
            .attr("r", 1)
            .attr("cx", d => d.x)
            .attr("cy", d => d.y)
            .style("fill", pointsColorHot)
            .style("opacity", 1)
            .on("click", (d, i) => console.log(d, i));

        // Exit selection
        points.exit()
            .remove();

        // Update selection
        points
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);

        // Update N label
        nLabel.text("N = " + point.i);

        i++;
    }
}

var startEstimation = () => {
	var random = d3.randomUniform(-1, 1),
		i = 0,
    	inCircle = 0,
    	pi = 0,
    	nMax = 1000;

	var isInCircle = (x, y) => Math.pow(x, 2) + Math.pow(y, 2) <= 1;
	
	setInterval(() => {
		if (connected) {
			i = i + 1;
			if (i >= nMax) {
				i = 1;
				inCircle = 0;
				pi = 0;
			}
			var x = random(),
				y = random();
			if (isInCircle(x, y)) inCircle = inCircle + 1;
			pi = inCircle * 4 / i;
			updateVisualization({pi: pi, i:i});
		}
	}, 10);
};

initVisualization();
startEstimation();