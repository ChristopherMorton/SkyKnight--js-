document.write( "Starto?" );

var canvas = $("#SK_canvas");
var context = canvas[0].getContext( '2d' );

const WIDTH = 20;
const HEIGHT = 15;

const TILE_DIM = 40;

//////////////////////////////////////////////////////////////
// #1 First, object definitions
//////////////////////////////////////////////////////////////

var NoObject = {
   blocks: false,
   blocksArrows: false,
   blocksJumps: false,
   end: false,
   pushable: false,

   Update: function( dt ) { return; },
   Draw: function( x, y ) { return; },
   Arrowed: function( dir ) { return false; }
};

var EndObject = {
   blocks: false,
   blocksArrows: false,
   blocksJumps: false,
   end: true,
   pushable: false,

   image: new Image( TILE_DIM, TILE_DIM ),

   Update: function( dt ) { return; },
   Draw: function( x, y ) { 
      if ( this.image.complete ) {
         context.drawImage( this.image, TILE_DIM*x, TILE_DIM*y );
      }
   },
   Arrowed: function( dir ) { return false; }
};
EndObject.image.src = "end.png";

function BlockingObject( image_string ) {
   this.blocks = true;
   this.blocksArrows = true;
   this.blocksJumps = true;
   this.end = false;
   this.pushable = false;

   this.image = new Image( TILE_DIM, TILE_DIM );
   this.image.src = image_string;

   this.Draw = function( x, y ) {
      if ( this.image.complete ) {
         context.drawImage( this.image, TILE_DIM*x, TILE_DIM*y );
      }
   }
};
BlockingObject.prototype.Update = function( dt ) { return; };
BlockingObject.prototype.Arrowed = function( dir ) { return true; };

var Boulder = {
   blocks: true,
   blocksArrows: true,
   blocksJumps: false,
   end: false,
   pushable: true,

   image: new Image( TILE_DIM, TILE_DIM ),

   Update: function( dt ) { return; },
   Draw: function( x, y ) { 
      if ( this.image.complete ) {
         context.drawImage( this.image, TILE_DIM*x, TILE_DIM*y );
      }
   },
   Arrowed: function( dir ) { return true; }
};
Boulder.image.src = "boulder.png";

var object_dict = {};
object_dict[''] = NoObject;
object_dict['end'] = EndObject;
object_dict['boulder'] = Boulder;
object_dict['column'] = new BlockingObject( 'column.png' );

//////////////////////////////////////////////////////////////
// #2 Second, describe miscellaneous objects
//////////////////////////////////////////////////////////////

var mode = "play";

var background = {
   image: new Image( TILE_DIM * WIDTH, TILE_DIM * HEIGHT ),
   Draw: function() {
      if ( this.image.complete ) {
         context.drawImage( this.image, 0, 0 );
      }
   },
   Update: function( dt ) { return; }
};
background.image.src = "sky.png";

var floor_image = new Image( TILE_DIM, TILE_DIM );
floor_image.src = "floor_tile.png";
function Tile() {
   // 0 => empty, 1 => solid, -x => can be jumped on x more times
   this.floor = 0;
   this.object = "";
}
Tile.prototype.Draw = function( x, y ) {
   if (this.floor == 1 && floor_image.complete) {
      context.drawImage( floor_image, TILE_DIM*x, TILE_DIM*y );
   }
   object_dict[ this.object ].Draw( x, y );
};

var level = Array( WIDTH );
for (var x = 0; x < WIDTH; x++) {
   level[x] = new Array(HEIGHT);
}
function ClearLevel() {
   for (var x = 0; x < WIDTH; x++) {
      for (var y = 0; y < HEIGHT; y++) {
         level[x][y] = new Tile();
      }
   }
}
ClearLevel();

var player_pos = [8, 8]; // initial position depends on the level, of course

var player_img_east = new Image( TILE_DIM, TILE_DIM ),
    player_img_west = new Image( TILE_DIM, TILE_DIM ),
    player_img_north = new Image( TILE_DIM, TILE_DIM ),
    player_img_south = new Image( TILE_DIM, TILE_DIM );
player_img_east.src = "player_img_east.png";
//player_img_west.src = "player_img_west.png";
player_img_north.src = "player_img_north.png";
//player_img_south.src = "player_img_south.png";

// [a,b,c] =>
// a - 0 if no move (self), 1 for arrows/push, 2 for jumps, 3 for half-moves
// b, c - directions. 0123 -> NESW   * new idea?
// b, c - directions, of form [x, y] with x,y = -1,0, or 1
// var move_indicator = [ 0, 0, 0 ];
var move_indicator = [ 0, [-1,0], [0,1] ];

// This image gets flipped and rotated to generate the eight jump images
var jump_img_up_left1 = new Image( 2*TILE_DIM, 3*TILE_DIM );
var jump_img_up_left2 = new Image( 2*TILE_DIM, 3*TILE_DIM );
var jump_img_up_left3 = new Image( 2*TILE_DIM, 3*TILE_DIM );
var jump_img_up_right1 = new Image( 2*TILE_DIM, 3*TILE_DIM );
var jump_img_up_right2 = new Image( 2*TILE_DIM, 3*TILE_DIM );
var jump_img_up_right3 = new Image( 2*TILE_DIM, 3*TILE_DIM );
jump_img_up_left1.src = "jump_img_up_left1.png";
jump_img_up_left2.src = "jump_img_up_left2.png";
jump_img_up_left3.src = "jump_img_up_left3.png";
jump_img_up_right1.src = "jump_img_up_right1.png";
jump_img_up_right2.src = "jump_img_up_right2.png";
jump_img_up_right3.src = "jump_img_up_right3.png";

var jump_img_up_left = [ jump_img_up_left1, jump_img_up_left2, jump_img_up_left3 ];
var jump_img_up_right = [ jump_img_up_right1, jump_img_up_right2, jump_img_up_right3 ];

var no_go_image = new Image( TILE_DIM, TILE_DIM );
no_go_image.src = "no_go_image.png";

var partial_move_image = new Image( TILE_DIM, 2*TILE_DIM );
partial_move_image.src = "partial_move_img.png";

//////////////////////////////////////////////////////////////
// #3 Here's where we describe all the levels...
//////////////////////////////////////////////////////////////

var cur_dungeon = 0, cur_level = 0;
function SetDungeon0Level( level_num ) {
   // Test level
   ClearLevel();
   level[8][8].floor = 1;
   level[8][6].object = "column";
   level[9][6].floor = 1;
   level[9][8].object = "column";
   level[9][9].object = "column";
   level[10][9].floor = 1;
   level[10][7].floor = 1;
   level[9][10].floor = 1;
   level[12][10].floor = 1;
   level[12][10].object = "end";
}

var dungeons = [
   SetDungeon0Level//,
  // SetDungeon1Level
   ];

function LoadLevel( dungeon_num, level_num ) {
   if ( dungeon_num >= 0 && dungeon_num < dungeons.length ) {
$('p').text( "loading level" );

      dungeons[dungeon_num]( level_num );
   }
} 

//////////////////////////////////////////////////////////////
// #4 Finally, game logic
//////////////////////////////////////////////////////////////

function DrawPlayer() {
   if (player_img_east.complete) {
      context.drawImage( player_img_north, TILE_DIM*player_pos[0], TILE_DIM*player_pos[1] );
   }
}

function DrawMoveIndicator() {
   if (move_indicator[0] != 0) {
      var x = player_pos[0],
          y = player_pos[1];

      if (move_indicator[0] == 1) {
         // arrow or push
         context.strokeStyle = "rgba(255, 80, 80, 0.8)";
         context.fillStyle = "rgb(255, 80, 80)";
         
         while ( y >= 0 && y < HEIGHT && x >= 0 && x < WIDTH
                 && object_dict[ level[x][y].object ].blocksArrows == 0 ) {
            x += move_indicator[1][0];
            y += move_indicator[1][1];
         }

         context.beginPath();
         context.moveTo( TILE_DIM*( player_pos[0] + 0.5 ), TILE_DIM*( player_pos[1] + 0.5 ) );
         context.lineTo( TILE_DIM*( x + 0.5 ), TILE_DIM*( y + 0.5 ) );
         context.closePath();
         context.stroke();
         // Include an arrow somehow? 
      }
      else if (move_indicator[0] == 2)
      {
         // Jump!
         // First, is the jump possible?
         var target = [ player_pos[0] + (2* move_indicator[1][0]) + move_indicator[2][0],
                        player_pos[1] + (2* move_indicator[1][1]) + move_indicator[2][1] ];
         if ( target[0] < 0 || target[0] >= WIDTH || target[1] < 0 || target[1] >= HEIGHT ) {
            // Off screen
            return;
         }
         var target_location = level[ target[0] ][ target[1] ];
         if ( target_location.floor == false || object_dict[ target_location.object ].blocks ) {
            // Can't jump to here
            context.drawImage( no_go_image, TILE_DIM*target[0], TILE_DIM*target[1] );
            return;
         } 

         // Now check is there's anything in the way...
         var turn_point = 0;
         var blockers = [];
         var step_one = [player_pos[0] + move_indicator[1][0],
                         player_pos[1] + move_indicator[1][1]];
         var step_two = [step_one[0] + move_indicator[1][0],
                         step_one[1] + move_indicator[1][1]];

         if ( object_dict[ level[step_one[0]][step_one[1]].object ].blocksJumps ) {
            // First dir 1 step blocked
            turn_point = 1;
            blockers[ blockers.length ] = step_one;
            step_one = [player_pos[0] + move_indicator[2][0],
                        player_pos[1] + move_indicator[2][1]];
            step_two = [step_one[0] + move_indicator[1][0],
                        step_one[1] + move_indicator[1][1]];

            if ( object_dict[ level[step_one[0]][step_one[1]].object ].blocksJumps ) {
               // dir 2 step blocked

               blockers[ blockers.length ] = step_one;
               turn_point = 0;
            } else if ( object_dict[ level[step_two[0]][step_two[1]].object ].blocksJumps ) { 
               // next dir 1 step blocked

               blockers[ blockers.length ] = step_two;
               turn_point = 0;
            }
         } else if ( object_dict[ level[step_two[0]][step_two[1]].object ].blocksJumps ) {
            // Second dir 1 step blocked
            turn_point = 2;
            step_two = [step_one[0] + move_indicator[2][0],
                        step_one[1] + move_indicator[2][1]];

            if ( object_dict[ level[step_two[0]][step_two[1]].object ].blocksJumps ) { 
               // dir 2 step blocked

               blockers[ blockers.length ] = step_two;
               turn_point = 0;
            }
         } else {
            turn_point = 3;
         }
         
         if (turn_point == 0) {
            // Shade blocking tiles
            context.fillStyle = "rgba(255,0,0,0.3)";
            for (var i = 0; i < blockers.length; ++i) {
               context.fillRect( blockers[i][0]*TILE_DIM, blockers[i][1]*TILE_DIM, TILE_DIM, TILE_DIM );
            }
            context.drawImage( no_go_image, TILE_DIM*target[0], TILE_DIM*target[1] );

         } else { 
            // Get the imagery required
            var jump_image, j_point;
            if( ( move_indicator[1][0] == 0 && move_indicator[1][1] == move_indicator[2][0] ) ||
                ( move_indicator[1][1] == 0 && move_indicator[1][0] == -move_indicator[2][1] ) ) {
               // Left turn
               jump_image = jump_img_up_left[ turn_point-1 ];
               j_point = -1.5*TILE_DIM;
            } else  {
               // Right turn
               jump_image = jump_img_up_right[ turn_point-1 ];
               j_point = -0.5*TILE_DIM;
            }

            // Now rotate and draw
            var angle = (  (move_indicator[1][0] == 0)?
                           (  (move_indicator[1][1] == 1)? 1:0 ):
                           (  (move_indicator[1][0] == 1)? 0.5:1.5 )  ) * Math.PI ;
            context.translate( TILE_DIM*(x+0.5), TILE_DIM*(y+0.5) );
            context.rotate( angle );

            context.drawImage( jump_image, j_point, -2.5*TILE_DIM, 2*TILE_DIM, 3*TILE_DIM );

            //Reset context
            context.rotate( -angle );
            context.translate( -TILE_DIM*(x+0.5), -TILE_DIM*(y+0.5) );
         }
      } 
      else if (move_indicator[0] == 3)
      {
         // Partial move submitted
         var angle = (  (move_indicator[1][0] == 0)?
                        (  (move_indicator[1][1] == 1)? 1:0 ):
                        (  (move_indicator[1][0] == 1)? 0.5:1.5 )  ) * Math.PI ;
         context.translate( TILE_DIM*(x+0.5), TILE_DIM*(y+0.5) );
         context.rotate( angle );

         context.drawImage( partial_move_image, -0.5*TILE_DIM, -1.5*TILE_DIM, TILE_DIM, 2*TILE_DIM );
         //Reset context
         context.rotate( -angle );
         context.translate( -TILE_DIM*(x+0.5), -TILE_DIM*(y+0.5) );
      }
   }
}

function DrawLevel() {
   background.Draw();

   for (x = 0; x < WIDTH; x++) {
      for (y = 0; y < HEIGHT; y++) {
         level[x][y].Draw( x, y );
      }
   } 
   
   DrawPlayer();

   DrawMoveIndicator();
}


function OnMouseMove( e ) {
   var x_pix = e.pageX - canvas[0].offsetLeft;
   var y_pix = e.pageY - canvas[0].offsetTop;
   var x = Math.floor( x_pix / TILE_DIM ),
       y = Math.floor( y_pix / TILE_DIM );
   var dx = x_pix - TILE_DIM*(player_pos[0] + 0.5),
       dy = y_pix - TILE_DIM*(player_pos[1] + 0.5);
   if (x == player_pos[0]) {
      if (y == player_pos[1]) {
         move_indicator[0] = 0;
      } else {
         move_indicator[0] = 1;
         move_indicator[1] = (dy < 0)?[0,-1]:[0,1];
      }
   } else if (y == player_pos[1]) {
      move_indicator[0] = 1;
      move_indicator[1] = (dx < 0)?[-1,0]:[1,0];
   } else {
      move_indicator[0] = 2;
      var diag1 = (dx - dy); // dividing line (==0) looks like this: \
      var diag2 = (dx + dy); // dividing line (==0) looks like this: /

      if ( dx > dy ) {
         if ( dx < -dy ) {
            move_indicator[1] = [0, -1];
            move_indicator[2] = (dx < 0)?[-1,0]:[1,0];
         } else {
            move_indicator[1] = [1,0];
            move_indicator[2] = (dy < 0)?[0,-1]:[0,1]; 
         }
      } else {
         if ( dx < -dy ) {
            move_indicator[1] = [-1,0];
            move_indicator[2] = (dy < 0)?[0,-1]:[0,1]; 
         } else {
            move_indicator[1] = [0,1];
            move_indicator[2] = (dx < 0)?[-1,0]:[1,0];
         }
      }
   }
$('p').html( "~new_indicator: [" + move_indicator[0] + ",[" + move_indicator[1][0] + "," + move_indicator[1][1] + "],[" + move_indicator[2][0] + "," + move_indicator[2][1] + "]]<br/>x_pix= " + x_pix + ", y_pix= " + y_pix); 
   DrawLevel();
}

function OnClick( e ) {
   return;
}

canvas.mousemove( OnMouseMove ); 

//canvas.click( OnClick );

LoadLevel( 0, 0 );

DrawLevel();

$('p').text( "success" );
document.write( "Endo?" );

//SetInterval( UpdateAll, 30 );
