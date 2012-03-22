document.write( "Starto?" );
$('p').text( "~0" );
var canvas = $("#SK_canvas");
var context = canvas[0].getContext( '2d' );

const WIDTH = 20;
const HEIGHT = 15;

const TILE_DIM = 40;

$('p').text( "~1" );

var NoObject = {
   blocks: false,
   blocksArrows: false,
   end: false,
   pushable: false,

   Update: function( dt ) { return; },
   Draw: function( x, y ) { return; },
   Arrowed: function( dir ) { return false; }
};

$('p').text( "~2" ); 

var EndObject = {
   blocks: false,
   blocksArrows: false,
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

$('p').text( "~3" ); 

function BlockingObject( image_string ) {
   this.blocks = true;
   this.blocksArrows = true;
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

$('p').text( "~4" ); 

var Boulder = {
   blocks: true,
   blocksArrows: true,
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

$('p').text( "~5" ); 

var object_dict = {};
object_dict[''] = NoObject;
object_dict['end'] = EndObject;
object_dict['boulder'] = Boulder;
object_dict['column'] = new BlockingObject( 'column.png' );

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

$('p').text( "~6" ); 

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


$('p').text( "~7" ); 

var mode = "play";
var level = Array( WIDTH );
for (var x = 0; x < WIDTH; x++) {
   level[x] = new Array(HEIGHT);
}
for (x = 0; x < WIDTH; x++) {
   for (y = 0; y < HEIGHT; y++) {
      level[x][y] = new Tile();
   }
}
// Test level
level[8][8].floor = 1;
level[10][9].floor = 1;
level[12][10].floor = 1;
level[12][10].object = "end"; // 'end' is a thing- a portal or stairs or some such

$('p').text( "~8" ); 

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
// b, c - directions.  0123->NESW.  e.g. [2,2,3] == jump SSW, [1,0,x] == arrow N
var move_indicator = [ 3, 1, 2 ];

// This image gets flipped and rotated to generate the eight jump images
var jump_img_up_left = new Image( 2*TILE_DIM, 3*TILE_DIM );
var jump_img_up_right = new Image( 2*TILE_DIM, 3*TILE_DIM );
jump_img_up_left.src = "jump_img_up_left.png";
jump_img_up_right.src = "jump_img_up_right.png";

var partial_move_image = new Image( TILE_DIM, 2*TILE_DIM );
partial_move_image.src = "partial_move_img.png";

$('p').text( "~9" ); 

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
         context.fillStyle = "rgba(255, 80, 80, 0.2)";
         switch (move_indicator[1]) {
            // For now, just shade it sort of red, a la checkers
            case 0:
               while ( y >= 0 && object_dict[ level[x][y].object ].blocksArrows == 0 ) {
                  context.fillRect( TILE_DIM*(x + 0.3), TILE_DIM*(y - 0.5), TILE_DIM*0.4, TILE_DIM );
                  --y;
               }
               break; 
            case 1:
               while ( x < WIDTH && object_dict[ level[x][y].object ].blocksArrows == 0 ) {
                  context.fillRect( TILE_DIM*(x + 0.5), TILE_DIM*(y + 0.3), TILE_DIM, TILE_DIM*0.4 );
                  ++x;
               }
               break;
            case 2:
               while ( y < HEIGHT && object_dict[ level[x][y].object ].blocksArrows == 0 ) {
                  context.fillRect( TILE_DIM*(x + 0.3), TILE_DIM*(y + 0.5), TILE_DIM*0.4, TILE_DIM );
                  ++y;
               }
               break; 
            case 3:
               while ( x >= 0 && object_dict[ level[x][y].object ].blocksArrows == 0 ) {
                  context.fillRect( TILE_DIM*(x - 0.5), TILE_DIM*(y + 0.3), TILE_DIM, TILE_DIM*0.4 );
                  --x;
               }
               break;
         }
      }
      else if (move_indicator[0] == 2)
      {
         // Jump!
         var jump_image, j_point;
         if( ( move_indicator[1] - move_indicator[2] + 4) % 4 == 1) { // left turn
            jump_image = jump_img_up_left;
            j_point = -1.5*TILE_DIM;
         } else if( ( move_indicator[1] - move_indicator[2] + 4) % 4 == 3) { // right turn
            jump_image = jump_img_up_right;
            j_point = -0.5*TILE_DIM;
         } else {
            // invalid jump
            return;
         }

         // Now rotate
         var angle = move_indicator[1] * Math.PI/2;
         context.translate( TILE_DIM*(x+0.5), TILE_DIM*(y+0.5) );
         context.rotate( angle );

         context.drawImage( jump_image, j_point, -2.5*TILE_DIM, 2*TILE_DIM, 3*TILE_DIM );
         //Reset context
         context.rotate( -angle );
         context.translate( -TILE_DIM*(x+0.5), -TILE_DIM*(y+0.5) );
      } 
      else if (move_indicator[0] == 3)
      {
$('p').text( "~partial" ); 
         // Partial move submitted
         var angle = move_indicator[1] * Math.PI/2;
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
         move_indicator[1] = (dy < 0)?0:2;
      }
   } else if (y == player_pos[1]) {
      move_indicator[0] = 1;
      move_indicator[1] = (dx < 0)?3:1;
   } else {
      move_indicator[0] = 2;
      var diag1 = (dx - dy); // dividing line (==0) looks like this: \
      var diag2 = (dx + dy); // dividing line (==0) looks like this: /

      if ( dx > dy ) {
         if ( dx < -dy ) {
            move_indicator[1] = 0;
            move_indicator[2] = (dx < 0)?3:1;
         } else {
            move_indicator[1] = 1;
            move_indicator[2] = (dy < 0)?0:2; 
         }
      } else {
         if ( dx < -dy ) {
            move_indicator[1] = 3;
            move_indicator[2] = (dy < 0)?0:2; 
         } else {
            move_indicator[1] = 2;
            move_indicator[2] = (dx < 0)?3:1;
         }
      }
   }
$('p').text( "~new_indicator: [" + move_indicator[0] + "," + move_indicator[1] + "," + move_indicator[2] + "]<br/>x_pix= " + x_pix + ", y_pix= " + y_pix); 
   DrawLevel();
}


canvas.mousemove( OnMouseMove ); 

canvas.click( OnMouseMove );


DrawLevel();

//SetInterval( UpdateAll, 30 );
