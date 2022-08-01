var margin = {top: 10, right: 30, bottom: 30, left: 60};

const colors = ["red", "orange", "green", "blue", "purple"];
const ages= ["Under 19", "20-34", "35-49", "50-64", "65+"];
const genders = ["Male", "Female"];



window.onload = function() {
    loadData("death");
};
function constructData(row, years, category) {
    var new_dict = {}
    var history = [];
    for(var year of years) {
        var sub = {};
        sub["Year"] = Number(year);
        sub["Deaths"] = Number(row[year]);
        history.push(sub);
        
    }
    //console.log(new_dict);
    new_dict["category"] = category;
    new_dict["history"] = history;
    return new_dict;
}

function getYears(years) {
    var new_years = [];
    for(var year of years) {
        new_years.push(Number(year));
    }
    return new_years
}

function animate(x, y, annotations, type) {
    d3.selectAll(".line").each(function(d, i) {
        console.log(d3.select("#line" + i).node());
        var totalLength = d3.select("#line" + i).node().getTotalLength();
        d3.selectAll("#line" + i)
        .attr("stroke-dasharray", totalLength + " " + totalLength)
        .attr("stroke-dashoffset", totalLength)
        .transition()
        .duration(5000)
        .ease(d3.easeLinear) 
        .attr("stroke-dashoffset", 0)
        .style("stroke-width",3)
        .end()
        .then(() => {
            
            if(d3.select('svg').attr('id') === type){
                showAnnotataion(x,y, annotations);
            }
            
        })
        

    });
}

function showAnnotataion(x, y, annotations) {
    const type = d3.annotationLabel
    

        const makeAnnotations = d3.annotation()
            //.editMode(true)
            .notePadding(15)
            .type(type)
            .accessors({
                x: d=>  x(d.Year),
                y: d => y(d.Deaths)
            })
            .accessorsInverse({
                Year:d => x.invert(d.x),
                Deaths: d=> y.invert(d.y)
            })
            .annotations(annotations)
        d3.selectAll("svg")
            .append("g")
                .attr("class", "annotation-group")
                .attr("transform",
                          "translate(" + margin.left + "," + margin.top + ")")
                .call(makeAnnotations);
}

function removeTooltip(tooltip, tooltipLine) {
    if (tooltip) tooltip.style('display', 'none');
    if (tooltipLine) tooltipLine.attr('stroke', 'none');
}


async function loadData(type){
    var data = await d3.csv("https://a.usafacts.org/api/v4/Metrics/csv/113346?&_ga=2.110233733.1205394869.1659282928-510300506.1659282928")
    .then(function (data) {
        console.log(data);
        var pre_svg =  d3.selectAll("svg");
        if(!pre_svg.empty() && pre_svg.attr('id') === type){
            return;
        }

        d3.selectAll("svg").remove();
        //console.log(data.columns.slice(1));
        var years_str = data.columns.slice(19)
        console.log(years_str)
        var years_int = getYears(years_str);
        var margin = {top: 10, right: 30, bottom: 30, left: 60};
        var width = 1200 - margin.left - margin.right;
        var height = 600 - margin.top - margin.bottom;
    
        var svg = d3.select(".chart")
            .append("svg")
                .attr("id", type)
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)                .append("g")
                .attr("transform",
                        "translate(" + margin.left + "," + margin.top + ")");


        var x = d3.scalePoint().domain(years_str).range([0, width]);
        
    
        var death_y = d3.scaleLinear().domain([25000, 50000]).range([height, 0]);
        var age_y = d3.scaleLinear().domain([0, 20000]).range([height, 0]);
        var gender_y = d3.scaleLinear().domain([0, 40000]).range([height, 0]);


        if(type === "death"){
            var death_data = []
            for(let row  = 0; row <1; row++){
                death_data.push(constructData(data[row], years_str, "total"));
            }
            console.log(death_data);

            var annotations = [{
                note: {
                    label: "The number of deaths increase rapidly after 2019",
                    bgPadding: 20,
                    
                },
                connector: {
                    end: "dot",
                    type: "line",
                    lineType: "vertical",
                    endScale: 8
                },
                data: {
                    Year: 2019,
                    Death: 39707            
                },
                className: "show-bg",
                color: ['#1B4F72'],
                x: x(2019),
                y: death_y(39707),
                dy: -150,
                dx: -120
            }]

            var line = d3.line()
                .x(d =>  x(d.Year))
                .y(d => death_y(d.Deaths));

            
            svg.append("g")
                .attr("class", "x-axis")
                .attr("transform", "translate(0, "+height+")")
                .call(d3.axisBottom(x)
                            .tickValues([2000, 2002, 2004, 2006, 2008, 2010, 2012, 2014, 2016, 2018, 2020]));
            svg.append("g")
                .attr("class", "y-axis")
                .call(d3.axisLeft(death_y)
                            .tickValues([25000, 30000, 35000, 40000, 45000, 50000]));
            svg.selectAll()
                .data(death_data)
                .enter()
                .append("path")
                .attr("id", function(d, i) {return "line" + i;})
                .attr("class", "line")
                .datum(d => d.history)
                .attr("d", line)
                .attr("fill", "none")
                .attr("stroke", "red")
                .attr("stroke-width", 8);

            animate(x, death_y, annotations, type);
            
            
            var tooltip = d3.select("#tooltip");
            var tooltipLine = svg.append("line");

            var tipBox = svg.append("rect")
                .attr('width', width)
                .attr('height', height)
                .attr('opacity', 0)
                .on('mousemove', drawTooltip)
                .on('mouseout', removeTooltip(tooltip, tooltipLine));
            
            
            function drawTooltip() {
                    //console.log(d3.mouse(d3.select("svg").selectAll("rect").nodes()[0])[0])
            
                var year = years_str[Math.floor(d3.mouse(tipBox.node())[0]/x.step())];
                console.log(year);
        
                tooltipLine.attr('stroke', 'black')
                    .attr('x1', x(year))
                    .attr('x2', x(year))
                    .attr('y1', 0)
                    .attr('y2', height);
                        
                tooltip.html(year)
                    .style('display', 'block')
                    .style('left', d3.event.pageX+"px")
                    .style('top', (d3.event.pageY + 30)+"px")
                    .selectAll()
                    .data(death_data)
                    .enter()
                    .append('div')
                    .style('color', function(d, i){return colors[i];})
                    .html(d => d.category + ': ' + d.history.find(h => h.Year == year).Deaths);
            }

        } else if(type === "age"){

            var age_data = []
            for(let row  = 8; row <13; row++){
                age_data.push(constructData(data[row], years_str, ages[row-8]));
            }
            console.log(age_data);



            var annotations = [{
                note: {
                    label: "Only the deaths of age 65+ decreased after 2019",
                    bgPadding: 20,
                    
                },
                connector: {
                    end: "dot",
                    type: "line",
                    lineType: "vertical",
                    endScale: 8
                },
                data: {
                    Year: 2019,
                    Death: 39707            
                },
                className: "show-bg",
                color: ['#1B4F72'],
                x: x(2019),
                y: age_y(5274),
                dy: -150,
                dx: -120
            }]


            var line = d3.line()
                .x(d =>  x(d.Year))
                .y(d => age_y(d.Deaths));

            
                //.data(death_data)
                //.enter()
            
            svg.append("g")
                .attr("class", "x-axis")
                .attr("transform", "translate(0, "+height+")")
                .call(d3.axisBottom(x)
                            .tickValues([2000, 2002, 2004, 2006, 2008, 2010, 2012, 2014, 2016, 2018, 2020]));
            svg.append("g")
                .attr("class", "y-axis")
                .call(d3.axisLeft(age_y)
                            .tickValues([0, 5000, 10000, 15000, 20000]));
            svg.selectAll()
                .data(age_data)
                .enter()
                .append("path")
                .attr("class", "line")
                .attr("id", function(d, i) {return "line" + i;})
                .datum(d => d.history)
                .attr("d", line)
                .attr("fill", "none")
                .attr("stroke", function(d, i) { return colors[i];})
                .attr("stroke-width", 8);

            
            animate(x, age_y, annotations, type);

            var legend_keys = ["Under 19", "20-34", "35-49", "50-64", "65+"];
            var colDict= {"Under 19": "red", "20-34": "orange", "35-49": "green", "50-64": "blue", "65+": "purple"};

            var lineLegend = svg.selectAll(".lineLegend").data(legend_keys)
                .enter().append("g")
                .attr("class","lineLegend")
                .attr("transform", function (d,i) {
                    return "translate(" + (margin.left) + "," + (i*20)+")";
                });         

            lineLegend.append("text").text(function (d) {return d;})
                .attr("transform", "translate(15, 6)");

            lineLegend.append("rect")
                .attr("fill", d => colDict[d])
                .attr("width", 12).attr('height', 5);
            
            var tooltip = d3.select("#tooltip");
            var tooltipLine = svg.append("line");
    
            var tipBox = svg.append("rect")
                    .attr('width', width)
                    .attr('height', height)
                    .attr('opacity', 0)
                    .on('mousemove', drawTooltip)
                    .on('mouseout', removeTooltip(tooltip, tooltipLine));
            
            function drawTooltip() {
                        //console.log(d3.mouse(d3.select("svg").selectAll("rect").nodes()[0])[0])
                
                var year = years_str[Math.floor(d3.mouse(tipBox.node())[0]/x.step())];
                console.log(year);
            
                tooltipLine.attr('stroke', 'black')
                    .attr('x1', x(year))
                    .attr('x2', x(year))
                    .attr('y1', 0)
                    .attr('y2', height);
                            
                tooltip.html(year)
                    .style('display', 'block')
                    .style('left', d3.event.pageX+"px")
                    .style('top', (d3.event.pageY + 30)+"px")
                    .selectAll()
                    .data(age_data)
                    .enter()
                    .append('div')
                    .style('color', function(d, i){return colors[i];})
                    .html(d => d.category + ': ' + d.history.find(h => h.Year == year).Deaths);
                }
        } else{

            var gender_data = []
            for(let row  = 22; row <24; row++){
                gender_data.push(constructData(data[row], years_str, genders[row-22]));
            }
            console.log(gender_data);

            

            var annotations = [{
                note: {
                    label: "The Number of male deaths increase after 2019",
                    bgPadding: 20,
                    
                },
                connector: {
                    end: "dot",
                    type: "line",
                    lineType: "vertical",
                    endScale: 8
                },
                data: {
                    Year: 2019,
                    Death: 39707            
                },
                className: "show-bg",
                color: ['#1B4F72'],
                x: x(2019),
                y: gender_y(34041),
                dy: 150,
                dx: -10
            }]


            var line = d3.line()
                .x(d =>  x(d.Year))
                .y(d => gender_y(d.Deaths));

            svg.append("g")
                .attr("class", "x-axis")
                .attr("transform", "translate(0, "+height+")")
                .call(d3.axisBottom(x)
                            .tickValues([2000, 2002, 2004, 2006, 2008, 2010, 2012, 2014, 2016, 2018, 2020]));
            svg.append("g")
                .attr("class", "y-axis")
                .call(d3.axisLeft(gender_y)
                            .tickValues([0, 5000, 10000, 15000, 20000, 25000, 30000, 35000]));
            svg.selectAll()
                .data(gender_data)
                .enter()
                .append("path")
                .attr("class", "line")
                .attr("id", function(d, i) {return "line" + i;})
                .datum(d => d.history)
                .attr("d", line)
                .attr("fill", "none")
                .attr("stroke", function(d, i) { return colors[i];})
                .attr("stroke-width", 8);

            animate(x, gender_y, annotations, type);

            var legend_keys = ["Male", "Female"]
            var colDict= {"Male": "red", "Female": "yellow"};

            var lineLegend = svg.selectAll(".lineLegend").data(legend_keys)
                .enter().append("g")
                .attr("class","lineLegend")
                .attr("transform", function (d,i) {
                    return "translate(" + (margin.left) + "," + (i*20)+")";
                });         

            lineLegend.append("text").text(function (d) {return d;})
                .attr("transform", "translate(15, 6)");

            lineLegend.append("rect")
                .attr("fill", d => colDict[d])
                .attr("width", 12).attr('height', 5);
            var tooltip = d3.select("#tooltip");
            var tooltipLine = svg.append("line");
    
            var tipBox = svg.append("rect")
                    .attr('width', width)
                    .attr('height', height)
                    .attr('opacity', 0)
                    .on('mousemove', drawTooltip)
                    .on('mouseout', removeTooltip(tooltip, tooltipLine));
            function drawTooltip() {
                        //console.log(d3.mouse(d3.select("svg").selectAll("rect").nodes()[0])[0])
            
                var year = years_str[Math.floor(d3.mouse(tipBox.node())[0]/x.step())];
                console.log(year);
            
                tooltipLine.attr('stroke', 'black')
                    .attr('x1', x(year))
                    .attr('x2', x(year))
                    .attr('y1', 0)
                    .attr('y2', height);
                            
                tooltip.html(year)
                    .style('display', 'block')
                    .style('left', d3.event.pageX+"px")
                    .style('top', (d3.event.pageY + 30)+"px")
                    .selectAll()
                    .data(gender_data)
                    .enter()
                    .append('div')
                    .style('color', function(d, i){return colors[i];})
                    .html(d => d.category + ': ' + d.history.find(h => h.Year == year).Deaths);
            }
        }

        /*
        function drawTooltip(data) {
            //console.log(d3.mouse(d3.select("svg").selectAll("rect").nodes()[0])[0])
            var year = years_str[Math.floor(d3.mouse(d3.select("svg").selectAll("rect").nodes()[0])[0]/x.step())];
            console.log(year);

            tooltipLine.attr('stroke', 'black')
                
                .attr('x1', x(year))
                .attr('x2', x(year))
                .attr('y1', 0)
                .attr('y2', height);
                
            tooltip.html(year)
                .style('display', 'block')
                .style('left', d3.event.pageX+"px")
                .style('top', (d3.event.pageY + 30)+"px")
                .selectAll()
                .data(data)
                .enter()
                .append('div')
                .style('color', function(d, i){return colors[i];})
                .html(d => d.category + ': ' + d.history.find(h => h.Year == year).Deaths);
        }
        */
    });
    
    
}