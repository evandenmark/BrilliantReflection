function initialLoad(){
    //Loads the standard elements of the interactive space

    var interactiveSVG = d3.select("#interactiveSpace").append("svg")
					    .attr("width", SCREEN_WIDTH)
					    .attr("height", SCREEN_HEIGHT);


    var mirrorBoxGroup = interactiveSVG.append("g")
                            .attr("transform", transform(2*UNIT_BOX_SIZE, UNIT_BOX_SIZE))
                            .attr("id", "mirrorBoxGroup");

    //bottom mirror
    mirrorBoxGroup.append("rect")
                    .attr("height", UNIT_BOX_SIZE*WALL_ASPECT_RATIO)
                    .attr("width", 2*UNIT_BOX_SIZE)
                    .attr("fill", "blue")
                    .attr("class", "mirror")
                    .attr("id", "bottomMirror")
                    .attr("transform", transform(-UNIT_BOX_SIZE, UNIT_BOX_SIZE/2));
    
    //top mirror
    mirrorBoxGroup.append("rect")
                    .attr("height", UNIT_BOX_SIZE*WALL_ASPECT_RATIO)
                    .attr("width", 2*UNIT_BOX_SIZE)
                    .attr("fill", "blue")
                    .attr("class", "mirror")
                    .attr("id", "topMirror")
                    .attr("transform", transform(-UNIT_BOX_SIZE, -1*UNIT_BOX_SIZE/2));

    //right wall
    mirrorBoxGroup.append("rect")
                    .attr("height", UNIT_BOX_SIZE*(1+WALL_ASPECT_RATIO))
                    .attr("width", UNIT_BOX_SIZE*WALL_ASPECT_RATIO)
                    .attr("fill", "black")
                    .attr("class", "wall")
                    .attr("id", "rightWall")
                    .attr("transform", transform(UNIT_BOX_SIZE, -UNIT_BOX_SIZE/2));

    //target
    var targetGroup = mirrorBoxGroup.append('g')
                        .attr("transform", transform(UNIT_BOX_SIZE*0.75,0))
                        .attr("id", "targetGroup");

    targetGroup.append("circle")
                    .attr("fill", '#FF7800')
                    .attr("r", UNIT_BOX_SIZE/15)
                    .attr("id", "outerTarget");
    
    targetGroup.append("circle")
                    .attr("fill", 'white')
                    .attr("r", UNIT_BOX_SIZE/22);
    
    targetGroup.append("circle")
                    .attr("fill", '#FF7800')
                    .attr("r", UNIT_BOX_SIZE/32);
    
    
    //laser
    const LASER_HEIGHT = UNIT_LASER_SIZE*LASER_ASPECT_RATIO;

    var laserGroup = mirrorBoxGroup.append('g')
                        .attr("transform", transform(-1*(UNIT_BOX_SIZE+UNIT_LASER_SIZE),0))
                        .attr("id", "laserGroup");
    
    var laserGroupContainer = laserGroup.append('g').attr("id", "laserGroupContainer");

    laserGroupContainer.append('rect')
                    .attr("width", UNIT_LASER_SIZE)
                    .attr("height", LASER_HEIGHT)
                    .attr("fill", "black")
                    .attr("transform", transform(0,-LASER_HEIGHT/2));
    
    laserGroupContainer.append('rect')
                    .attr("fill", "red")
                    .attr("width", LASER_HEIGHT)
                    .attr("height", LASER_HEIGHT/2)
                    .attr("transform", transform(UNIT_LASER_SIZE*(1-LASER_ASPECT_RATIO),-LASER_HEIGHT/4));
    

    //laser control
    var laserControl = mirrorBoxGroup.append("g")
                                    .attr("transform", transform(-UNIT_BOX_SIZE,0));

    //defines the arc of the control                            
    const laserArcControlGenerator = d3.arc()
        .outerRadius(LASER_ARC_RADIUS)
        .innerRadius(LASER_ARC_RADIUS*0.95)
        .startAngle(-15.0/16*Math.PI)
        .endAngle(-1.0/16*Math.PI);

    const laserControlArc = laserControl.append("path")
            .attr("d", laserArcControlGenerator())
            .attr("fill", 'gray')
            .attr("opacity", 0.2);
    
    laserControl.append("circle")
                    .attr("fill", "gray")
                    .attr('r', LASER_HEIGHT)
                    .attr('transform', transform(-LASER_ARC_RADIUS, 0))
                    .attr("id", 'controlCircle')
                    .call(d3.drag() // call specific function when circle is dragged
                        .on("start", dragstarted)
                        .on("drag", dragged)
                        .on("end", dragended))
    
    laserControl.append('text')
                .attr('class', 'text')
                .attr("id", "degreeText")
                .attr('transform', transform(-LASER_ARC_RADIUS*1.2, LASER_ARC_RADIUS/4))
                .text('')

    
    // reflection markers
    var reflectionMarkers = d3.select("#mirrorBoxGroup").append('g')
                    .attr("id", 'reflectionMarkers')
                    .attr("transform", transform(-(UNIT_BOX_SIZE+UNIT_LASER_SIZE),0));
    

    
    //basic text
    interactiveSVG.append('text')
                    .attr('transform', transform(SCREEN_WIDTH/2, SCREEN_HEIGHT/16))
                    .attr('class', 'text')
                    .attr("id", "main-text")
                    .style("text-anchor", "middle")
                    .text("Bounce the laser off the mirrors to hit your target!");
    

    interactiveSVG.append('text')
                    .attr('transform', transform(SCREEN_WIDTH/10, SCREEN_HEIGHT/4))
                    .attr('class', 'text')
                    .style("text-anchor", "middle")
                    .text("Move your laser!");
    
    interactiveSVG.append('text')
                    .attr('transform', transform(7*SCREEN_WIDTH/8, SCREEN_HEIGHT/4))
                    .attr('class', 'text')
                    .style("text-anchor", "middle")
                    .text("Unique Hits:");

    interactiveSVG.append('text')
                    .attr('transform', transform(7*SCREEN_WIDTH/8, SCREEN_HEIGHT/4+30))
                    .attr('class', 'text')
                    .attr('id', 'uniqueHitsNum')
                    .style("text-anchor", "middle")
                    .text('0');


}

initialLoad();