//GENERAL HELPER

function transform(x, y, s=1, r=0){
    return "translate ("+x+" "+y+") rotate ("+r+") scale ("+s+")";
}

function linearDistance(p1x, p1y, p2x, p2y){
    return ((p2x-p1x)**2 + (p2y - p1y)**2)**0.5
}

const laserArcControlGenerator = d3.arc()
        .outerRadius(LASER_ARC_RADIUS)
        .innerRadius(LASER_ARC_RADIUS*0.95)
        .startAngle(LASER_ARC_MAX)
        .endAngle(LASER_ARC_MIN);

//LASER CONTROL

function dragstarted() {
    //nothing
    console.log("starting drag")
    firstLaserShot = true;
  }
function dragged() {
    //from the center of the laser group
    var mouseX = d3.event.x;
    var mouseY = d3.event.y;
    angleToControl = Math.atan2(mouseY, mouseX) //radians from east direction
    if (angleToControl>0){
        angleToControl = Math.max(angleToControl, 9.0/16*Math.PI);
    } else{
        angleToControl = Math.min(angleToControl, -9.0/16*Math.PI)
    }
    
    var newX = LASER_ARC_RADIUS*Math.cos(angleToControl)+LASER_ARC_RADIUS;
    var newY = LASER_ARC_RADIUS*Math.sin(angleToControl);

    //move the circle and update laser rotation
    d3.select(this).attr("cx", newX).attr("cy", newY);
    updateLaserRotation(angleToControl)

  }
function dragended() {
    console.log("FIRE")
    fireLaser();
  }

function updateLaserRotation(angle){
    d3.select("#laserGroupContainer").attr("transform", "rotate ("+(180+angle*180/Math.PI)%360+","+UNIT_LASER_SIZE+","+0+")");
    d3.select("#degreeText").text(function(){ return 180-Math.abs(Math.round(angleToControl*180/Math.PI)) + String.fromCharCode(176)})

    var controlCircleX = d3.select("#controlCircle").attr('cx');
    var controlCircleY = d3.select("#controlCircle").attr('cy');

    d3.select("#degreeText").attr('transform', transform(controlCircleX-(LASER_ARC_RADIUS+10), controlCircleY+10))
}

function fireLaser(){
    //create path
    createLaserPath();

    //create first reflection dot
    createReflectionCircle();
    
}

function createReflectionCircle(){
    var reflectionCircles = d3.select("#mirrorBoxGroup").append('g')
    .attr("id", 'reflectionCircles')
    .attr("transform", transform(-(UNIT_BOX_SIZE+UNIT_LASER_SIZE),0));

    if (numberOfBounces != 0){
        var newReflectionCircle = reflectionCircles.append("rect")
                                .attr('transform', transform(mostRecentFirstReflection[0]-10, mostRecentFirstReflection[1]-2))
                                .attr('fill', '#686868')
                                .attr('height', 8)
                                .transition()
                                    .duration(500)
                                    .delay(500)
                                    .attr("width", 10);

        if (targetHit){
            newReflectionCircle.attr("fill", '#1EC300');
        }
    }
}

function createLaserPath(){
    targetHit = false;
    numberOfBounces = 0;
    var lineFunction = d3.line()
                            .x(function(d) { return d.x; })
                            .y(function(d) { return d.y; });

    var pathPoints = [];
    var startPoint = {"x":UNIT_LASER_SIZE,"y":0};
    const step = 3;
    var angleFromLaser = angleToControl + Math.PI;
    pathPoints.push(startPoint);
    var currentXPoint = pathPoints[pathPoints.length-1].x;
    var currentYPoint = pathPoints[pathPoints.length-1].y;
    var reachedFirstReflection = false;

    //while the laser hasn't hit the black wall
    while(currentXPoint < 2*UNIT_BOX_SIZE+UNIT_LASER_SIZE){
        //while current bounce is between the mirrors
        while (currentYPoint > -UNIT_BOX_SIZE*(1.0/2-WALL_ASPECT_RATIO) 
            && currentYPoint <  UNIT_BOX_SIZE/2
            && !isWithinTarget(currentXPoint, currentYPoint)){
                pathPoints.push({
                    "x":currentXPoint+ step*Math.cos(angleFromLaser), 
                    "y":currentYPoint+ step*Math.sin(angleFromLaser)
                })
                currentXPoint = pathPoints[pathPoints.length-1].x;
                currentYPoint = pathPoints[pathPoints.length-1].y;
                if (currentXPoint > 2*UNIT_BOX_SIZE+UNIT_LASER_SIZE){
                    break;
                }
            }
        if (!reachedFirstReflection 
            && !isWithinTarget(currentXPoint, currentYPoint)
            && (currentXPoint < 2*UNIT_BOX_SIZE+UNIT_LASER_SIZE)){
            //this means it has just reflected off its first mirror

            mostRecentFirstReflection = [currentXPoint, currentYPoint]
            reachedFirstReflection = true;
        }

        if (currentXPoint > 2*UNIT_BOX_SIZE+UNIT_LASER_SIZE){
            break;
        }else if (isWithinTarget(currentXPoint, currentYPoint)){
            targetHit = true;
            console.log(targetHit);
            break;
        } else {
            //just another bounce
            numberOfBounces +=1
        }
        angleFromLaser =  Math.atan2(Math.sin(angleFromLaser), Math.cos(angleFromLaser));
        angleFromLaser = -1*angleFromLaser;
        pathPoints.pop();
        currentXPoint = pathPoints[pathPoints.length-1].x;
        currentYPoint = pathPoints[pathPoints.length-1].y;
        
    }

    d3.selectAll(".oldLaserLines").attr("opacity", 0.1);

    var lineGraph = d3.select("#laserGroup").append("path")
                    .transition()
                    .duration(1000)
                    .attr("d", lineFunction(pathPoints))
                    .attr("stroke", "red")
                    .attr("stroke-width", 4)
                    .attr("fill", "none")
                    .attr("class", "oldLaserLines");

    //update the unique hits dict
    if (angleToControl < 0){
        numberOfBounces *= -1;
    }
    if (!uniqueHits.includes(numberOfBounces) 
        && numberOfBounces != 0
        && targetHit){
        uniqueHits.push(numberOfBounces);
    }
    d3.select("#uniqueHitsNum").text(function(){return uniqueHits.length})

    console.log(uniqueHits);
}

function isWithinTarget(currentX, currentY){
    const targetGroup = d3.select("#targetGroup");
    const target = d3.select("#outerTarget");
    var targetX = getTranslation(targetGroup.attr("transform"))[0];
    var targetY = getTranslation(targetGroup.attr("transform"))[1]
    
    return linearDistance(targetX+(UNIT_BOX_SIZE+UNIT_LASER_SIZE), targetY, currentX, currentY) < target.attr('r');
}

function getTranslation(transform) {
    // Create a dummy g for calculation purposes only. This will never
    // be appended to the DOM and will be discarded once this function 
    // returns.
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