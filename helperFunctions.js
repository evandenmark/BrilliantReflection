//GENERAL HELPERS

function transform(x, y, s=1, r=0){
    //SPEC: given an x and y translation and an (optional) scalar and rotation
    //      returns the proper string for a d3 transform attribute
    return "translate ("+x+" "+y+") rotate ("+r+") scale ("+s+")";
}

function linearDistance(p1x, p1y, p2x, p2y){
    //SPEC: given the x,y coordinates of two points (p1 and p2)
    //      returns the linear distance between them
    return ((p2x-p1x)**2 + (p2y - p1y)**2)**0.5
}

function isWithinTarget(currentX, currentY){
    //SPEC: given an x and y location
    //      returns true if the location is within the radius of the target, false otherwise
    
    const targetGroup = d3.select("#targetGroup");
    const target = d3.select("#outerTarget");
    var targetX = getTranslation(targetGroup.attr("transform"))[0];
    var targetY = getTranslation(targetGroup.attr("transform"))[1]
    
    return linearDistance(targetX+(UNIT_BOX_SIZE+UNIT_LASER_SIZE), targetY, currentX, currentY) < target.attr('r');
}

function getTranslation(transform) {
    // SPEC: given a d3 group transform selection
    //       returns the transformation attribute
    //       *note*: normally this is not present in a group attr. This is a hack to get it

    var g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    
    // Set the transform attribute to the provided string value.
    g.setAttributeNS(null, "transform", transform);
    
    // consolidate the SVGTransformList containing all transformations
    // to a single SVGTransform of type SVG_TRANSFORM_MATRIX and get
    // its SVGMatrix. 
    var matrix = g.transform.baseVal.consolidate().matrix;
    
    // As per definition values e and f are the ones for the translation.
    return [matrix.e, matrix.f];

}

//FUNCTIONS THAT HELP WHEN THE CONTROL BUTTON IS DRAGGED

//defining the arc of the laser control
const laserArcControlGenerator = d3.arc()
        .outerRadius(LASER_ARC_RADIUS)
        .innerRadius(LASER_ARC_RADIUS*0.95)
        .startAngle(LASER_ARC_MAX)
        .endAngle(LASER_ARC_MIN);

function dragstarted() {
    //called when the laser control button is first clicked
    //method created in case of future use
  }

function dragged() {
    //called when the laser control button is being dragged
    
    //get the location of the mouse drag
    var mouseX = d3.event.x;
    var mouseY = d3.event.y;

    //calculate the degree (in radians) from the east direction
    angleToControl = Math.atan2(mouseY, mouseX) 
    if (angleToControl>0){
        angleToControl = Math.max(angleToControl, 9.0/16*Math.PI);
    } else{
        angleToControl = Math.min(angleToControl, -9.0/16*Math.PI)
    }
    
    //based on the angle, map it onto the arc
    var newX = LASER_ARC_RADIUS*Math.cos(angleToControl)+LASER_ARC_RADIUS;
    var newY = LASER_ARC_RADIUS*Math.sin(angleToControl);

    //move the circle and update laser rotation
    d3.select(this).attr("cx", newX).attr("cy", newY);
    updateLaserRotation(angleToControl)

  }

function updateLaserRotation(angle){
    //SPEC: given the rotation of the laser control button
    //      modifies the rotation of the laser itself and the degree text beside it

        //rotate the laser group
        d3.select("#laserGroupContainer").attr("transform", "rotate ("+(180+angle*180/Math.PI)%360+","+UNIT_LASER_SIZE+","+0+")");
        
        //update the degree text next to it
        d3.select("#degreeText").text(function(){ return 180-Math.abs(Math.round(angleToControl*180/Math.PI)) + String.fromCharCode(176)})
        var controlCircleX = d3.select("#controlCircle").attr('cx');
        var controlCircleY = d3.select("#controlCircle").attr('cy');
        d3.select("#degreeText").attr('transform', transform(controlCircleX-(LASER_ARC_RADIUS*1.4), controlCircleY+40))
}

function dragended() {
    //called when the control button is stopped dragging
    fireLaser();
  }

function fireLaser(){
    //create path
    createLaserPath();

    //create first reflection dot
    createReflectionMarker();
    
}

function createReflectionMarker(){
    // creates a green or gray rectangle at the location of the first laser bounce on the mirror
    // green if the laser hit the target, gray if miss

    if (numberOfBounces != 0){
        //the laser must bounce off at least one mirror to get a marker

        var newReflectionMarker = d3.select("#reflectionMarkers").append("rect")
                                    .attr('transform', transform(mostRecentFirstReflection[0]-10, mostRecentFirstReflection[1]-2))
                                    .attr('fill', 'black')
                                    .attr('height', 8)
                                    .transition()
                                        .duration(500)
                                        .delay(500)
                                        .attr("width", 10);

        if (targetHit){
            //turn the marker green
            newReflectionMarker.attr("fill", '#FF7800');
        }
    }
}

function createLaserPath(){
    //THE BIG KAHUNA FUNCTION THAT ACTUALLY DOES THE WORK

    // Calculates and creates the laser path based on the angle of the laser
    // From the starting point at the tip of the laser, a path is slowly built step by step
    // when mirrors are hit, the path continues in the reflected direction
    // the laser only stops when either 1. it hits the target or 2. it misses the target and hits the back wall

    //starter variables
    targetHit = false;
    numberOfBounces = 0;
    const step = 3;
    var angleFromLaser = angleToControl + Math.PI;
    var reachedFirstReflection = false;

    //defining a line
    var lineFunction = d3.line()
                            .x(function(d) { return d.x; })
                            .y(function(d) { return d.y; });

    //pathPoints is an ordered array that represents the {x,y} coordinates of the line                       
    var pathPoints = [];
    var startPoint = {"x":UNIT_LASER_SIZE,"y":0};
    pathPoints.push(startPoint);
    
    //throughout this process, we keep the most recently added x and y points of the line
    var currentXPoint = pathPoints[pathPoints.length-1].x;
    var currentYPoint = pathPoints[pathPoints.length-1].y;
    

    //while the laser hasn't hit the black wall
    while(currentXPoint < 2*UNIT_BOX_SIZE+UNIT_LASER_SIZE){

        //while current bounce is between the mirrors and hasn't hit the target
        while (currentYPoint > -UNIT_BOX_SIZE*(1.0/2-WALL_ASPECT_RATIO) 
            && currentYPoint <  UNIT_BOX_SIZE/2
            && !isWithinTarget(currentXPoint, currentYPoint)){

                //the next point on the path is the current point PLUS the step in the right direction
                pathPoints.push({
                    "x":currentXPoint+ step*Math.cos(angleFromLaser), 
                    "y":currentYPoint+ step*Math.sin(angleFromLaser)
                })

                //current points are updated
                currentXPoint = pathPoints[pathPoints.length-1].x;
                currentYPoint = pathPoints[pathPoints.length-1].y;

                //check if we have hit the back wall
                if (currentXPoint > 2*UNIT_BOX_SIZE+UNIT_LASER_SIZE){
                    break;
                }
            }
        
        //check if the laser has just reflected off its FIRST mirror
        if (!reachedFirstReflection 
            && !isWithinTarget(currentXPoint, currentYPoint)
            && (currentXPoint < 2*UNIT_BOX_SIZE+UNIT_LASER_SIZE)){
            
            mostRecentFirstReflection = [currentXPoint, currentYPoint]
            reachedFirstReflection = true;
        }

        //check if the laser has either 1. hit the back wall 2. hit the target or 3. is just continuing another mirror bounce
        if (currentXPoint > 2*UNIT_BOX_SIZE+UNIT_LASER_SIZE){
            break;
        }else if (isWithinTarget(currentXPoint, currentYPoint)){
            targetHit = true;
            break;
        } 

        //the laser has just bounced off the mirror
        numberOfBounces +=1

        //the new angle off the mirror is the reflection of the current angle
        angleFromLaser =  Math.atan2(Math.sin(angleFromLaser), Math.cos(angleFromLaser));
        angleFromLaser = -1*angleFromLaser;

        //to ensure that the laser doesn't go past the mirror, we remove the most recent point on the line
        //this is ok because the step size is small enough
        pathPoints.pop();
        currentXPoint = pathPoints[pathPoints.length-1].x;
        currentYPoint = pathPoints[pathPoints.length-1].y;
    }

    // at this point, the correct path from the tip of the laser to its destination has been created 
    // but now it needs to be actually created

    //previous lines should be faded 
    d3.selectAll(".oldLaserLines").attr("opacity", 0.1);

    //create a new line
    var lineGraph = d3.select("#laserGroup").append("path")
                    .transition()
                    .duration(1000)
                    .attr("d", lineFunction(pathPoints))
                    .attr("stroke", "red")
                    .attr("stroke-width", 4)
                    .attr("fill", "none")
                    .attr("class", "oldLaserLines");

    //once the laser path is created, we must determine if we have hit that reflected target before
    updateUniqueHits();
    
}

function updateUniqueHits(){
    //HIT UNIQUENESS
    //Ultimately, the user wants to know how many UNIQUE target hits they have
    //While they might have green markers galore, they might be hitting the same reflection more than once                
    //the number of mirror bounces to a target hit determines the uniqueness of the hit

    //paths where the first reflection is on the bottom mirror are noted by a negative number
    if (angleToControl < 0){
        numberOfBounces *= -1;
    }

    //if the user hasn't hit the target with that many bounces before
    if (!uniqueHits.includes(numberOfBounces) 
        && numberOfBounces != 0
        && targetHit){
        uniqueHits.push(numberOfBounces);
    }
    d3.select("#uniqueHitsNum").text(function(){return uniqueHits.length})
}