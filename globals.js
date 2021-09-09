const SCREEN_WIDTH = screen.width;
const SCREEN_HEIGHT = screen.width;
const UNIT_BOX_SIZE = SCREEN_WIDTH*0.25;
const UNIT_LASER_SIZE = SCREEN_WIDTH*0.05;
const WALL_ASPECT_RATIO = 1.0/20;
const LASER_ASPECT_RATIO = 1.0/5;
const LASER_ARC_RADIUS = UNIT_LASER_SIZE*1.5;
const LASER_ARC_MAX = -15.0/16*Math.PI;
const LASER_ARC_MIN = -1.0/16*Math.PI;

var angleToControl; 