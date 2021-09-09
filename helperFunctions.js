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

    //create path
    createLaserPath();

    //create first reflection dot
    createReflectionMarker();
  }