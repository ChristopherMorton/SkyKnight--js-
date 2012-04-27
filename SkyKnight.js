document.write( "Starto?" );

var canvas = $("#SK_canvas");
var context = canvas[0].getContext( '2d' );

const WIDTH = 20;
const HEIGHT = 15;

const MENU_HEIGHT = 30;

const TILE_DIM = 40;

const JUMP_TIME = 150;

//////////////////////////////////////////////////////////////
// #0 Loading assets
//////////////////////////////////////////////////////////////

// IMAGES

// These images gets flipped and rotated to generate the 24 possible jump images
var jump_img_up_left = [ new Image( 2*TILE_DIM, 3*TILE_DIM ), new Image( 2*TILE_DIM, 3*TILE_DIM ), new Image( 2*TILE_DIM, 3*TILE_DIM ) ];
var jump_img_up_right = [ new Image( 2*TILE_DIM, 3*TILE_DIM ), new Image( 2*TILE_DIM, 3*TILE_DIM ), new Image( 2*TILE_DIM, 3*TILE_DIM ) ];
jump_img_up_left[0].src = "jump_img_up_left1.png";
jump_img_up_left[1].src = "jump_img_up_left2.png";
jump_img_up_left[2].src = "jump_img_up_left3.png";
jump_img_up_right[0].src = "jump_img_up_right1.png";
jump_img_up_right[1].src = "jump_img_up_right2.png";
jump_img_up_right[2].src = "jump_img_up_right3.png";

var no_go_image = new Image( TILE_DIM, TILE_DIM );
no_go_image.src = "no_go_image.png";

var partial_move_image = new Image( TILE_DIM, 2*TILE_DIM );
partial_move_image.src = "partial_move_img.png";

var end_image = new Image( TILE_DIM, TILE_DIM );
end_image.src = "end.png";

var boulder_image = new Image( TILE_DIM, TILE_DIM );
boulder_image.src = "boulder_image.png";

var floor_image = new Image( TILE_DIM, TILE_DIM );
floor_image.src = "floor_tile.png";

var cloud_images = [ new Image(), new Image(), new Image() ];
cloud_images[0].src = "cloud0.png";
cloud_images[1].src = "cloud1.png";
cloud_images[2].src = "cloud2.png";

var background_base_image = new Image( TILE_DIM*WIDTH, TILE_DIM*HEIGHT );
background_base_image.src = "sky2.png";

var player_img_idle1 = new Image( TILE_DIM, TILE_DIM );
var player_img_idle2 = new Image( TILE_DIM, TILE_DIM );
var player_img_jumping1 = new Image( TILE_DIM, TILE_DIM );
player_img_idle1.src = "player_img_idle1.png";
player_img_idle2.src = "player_img_idle2.png";
player_img_jumping1.src = "player_img_jumping1.png";

//////////////////////////////////////////////////////////////
// #1 First, object definitions
//////////////////////////////////////////////////////////////

var NoObject = {
   blocks: false,
   blocksArrows: false,
   blocksJumps: false,
   pushable: false,

   Update: function( dt ) { return; },
   Draw: function( x, y ) { return; },
   Arrowed: function( dir ) { return false; }
};

function BlockingObject( image_string ) {
   this.blocks = true;
   this.blocksArrows = true;
   this.blocksJumps = true;
   this.pushable = false;

   // The exception to the 'load images first' rule
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
   pushable: true,

   image: boulder_image,

   Update: function( dt ) { return; },
   Draw: function( x, y ) { 
      if ( this.image.complete ) {
         context.drawImage( this.image, TILE_DIM*x, TILE_DIM*y );
      }
   },
   Arrowed: function( dir ) { return true; }
};

var object_dict = {};
object_dict[''] = NoObject;
object_dict['boulder'] = Boulder;
object_dict['column'] = new BlockingObject( '3d_column.png' );
object_dict['column'].Draw = function( x, y ) {
   if ( this.image.complete ) {
      context.drawImage( this.image, TILE_DIM*x, TILE_DIM*y - 20 );
   }
}

//////////////////////////////////////////////////////////////
// #2 Second, describe miscellaneous objects
//////////////////////////////////////////////////////////////

var mode = "play";

function Cloud( type /* 0,1,2 */
              , xpos, ypos
              , xsize, ysize
              , xvel ) {
   this.image = cloud_images[ type ];
   this.xpos = xpos;
   this.ypos = ypos;
   this.xscale = xsize / 100;
   this.yscale = ysize / 100;
   this.velocity = xvel / 140;
}
Cloud.prototype.Draw = function() {
   if (this.image.complete) {
      context.translate( this.xpos, this.ypos );
      context.scale( this.xscale, this.yscale );
      context.drawImage( this.image, 0, 0 );
      //context.resetTransform();
      context.scale( 1/this.xscale, 1/this.yscale );
      context.translate( -this.xpos, -this.ypos );
   }
}
Cloud.prototype.Update = function( dt ) {
   this.xpos += ( dt * this.velocity );
   if (this.xpos > WIDTH * TILE_DIM)
      return true;
   else
      return false;
}

var getRandomCloud = function () {
   var rand_type = 2 - Math.floor( Math.sqrt(Math.random()*9) );
   var rand_size_mod = Math.floor(Math.random()*11) + (20*rand_type);
   var rand_xsize = 80 + Math.floor(Math.random()*140) + (rand_size_mod*10);
   var rand_ysize = 30 + Math.floor(Math.random()*100) + (rand_size_mod*5);
   return new Cloud(
         rand_type,
         -rand_xsize,
         Math.floor(Math.random()*(HEIGHT*TILE_DIM - rand_ysize)),
         rand_xsize,
         rand_ysize,
         55 + Math.floor(Math.random()*20) - rand_size_mod
         );
}

var background = {
   base_image: background_base_image,
   clouds: [ getRandomCloud(), getRandomCloud(), getRandomCloud(), getRandomCloud() ],

   Draw: function() {
      if ( this.base_image.complete ) {
         context.drawImage( this.base_image, 0, 0 );
         for (var i = 0; i < this.clouds.length; ++i ) {
            (this.clouds[i]).Draw();
         }
      }
   },
   Update: function( dt ) {
      for (var i = 0; i < this.clouds.length; ++i ) {
         var cloud = this.clouds[i];
         if (cloud.Update( dt )) {
            this.clouds[i] = getRandomCloud();
         }
      }
   }
};

function Tile() {
   // 0 => empty, 1 => solid, -x => can be jumped on x more times
   this.floor = 0;
   this.object = "";
}
Tile.prototype.Draw = function( x, y ) {
   /*
   if (this.floor == 1 && floor_image.complete) {
      context.drawImage( floor_image, TILE_DIM*x, TILE_DIM*y );
   }
   */
   object_dict[ this.object ].Draw( x, y );
};

var end_pos = [0,0]; // Where you need to reach to finish the level

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
   end_pos = [0,0]
}
ClearLevel();

// Player handling
var player_pos = [8, 8]; // initial position depends on the level, of course

var player_state = 0; // 0 = not moving
var player_anim_frame = 0;

function DrawPlayer() {
   var draw_image;
   var draw_location = [ player_pos[0] * TILE_DIM, player_pos[1] * TILE_DIM ];
   switch (player_state) {
      case 0: // Not moving
         if (player_anim_frame > 600) {
            draw_image = player_img_idle2;
         } else {
            draw_image = player_img_idle1;
         }
         break;
      case 1: // Mid jump
         draw_image = player_img_jumping1; 
         var djump = (player_anim_frame % JUMP_TIME) / JUMP_TIME;
         var from, to;
         if (player_anim_frame < JUMP_TIME) {
            from = player_pos;
            to = jump_step_one;
         } else if (player_anim_frame < 2*JUMP_TIME) {
            from = jump_step_one;
            to = jump_step_two;
         } else if (player_anim_frame < 3*JUMP_TIME) {
            from = jump_step_two;
            to = jump_target;
         } else {
            from = jump_target;
            to = jump_target;
         }

         draw_location = [ TILE_DIM * (((to[0] - from[0]) * djump) + from[0]),
                           TILE_DIM * (((to[1] - from[1]) * djump) + from[1]) ];
         break;
      case 2: // Shooting arrow
         draw_image = player_img_shooting1;
         break;

      default:
   }
   if (draw_image.complete) {

   $('h2').text( "pos=[" + player_pos[0] + "," + player_pos[1] + "], state=" + player_state + ", mode=" + mode );
      context.drawImage( draw_image, draw_location[0], draw_location[1] );
   }
}

function UpdatePlayer( dt ) {
   player_anim_frame += dt;
   switch (player_state) {
      case 0: // not moving
         if (player_anim_frame > 1200) {
            player_anim_frame = 0;
         }
         break;
      case 1: // jumping
         if (player_anim_frame > 3*JUMP_TIME) {
            // arrive
            player_pos = jump_target;
            player_state = 0;
            player_anim_frame = 0;
            move_indicator = [0, 0, 0]; // reset move
         }
         break;
      default:
         player_anim_frame = 0;
         player_state = 0;
   }

   if ( player_pos[0] === end_pos[0] && player_pos[1] === end_pos[1] ) {
      // You win, hooray!
      mode = "next_level";
      player_anim_frame = 0;
   }
}

// [a,b,c] =>
// a - 0 if no move (self), 1 for arrows/push, 2 for jumps, 3 for half-moves
// b, c - directions. 0123 -> NESW   * new idea?
// b, c - directions, of form [x, y] with x,y = -1,0, or 1
// var move_indicator = [ 0, 0, 0 ];
var move_indicator = [ 0, [-1,0], [0,1] ];
var move_possible = true;
var jump_target = [8, 8];
var jump_step_one = [8, 8];
var jump_step_two = [8, 8]; 
var jump_blockers = [];
var jump_turn_point = 3;

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
   level[12][8].floor = 1;
   level[10][7].floor = 1;
   level[9][10].floor = 1;
   level[12][10].floor = 1;
   end_pos = [12,10];
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

function CalculateMoveErrata() {
   move_possible = true;
   if (move_indicator[0] == 1) {
      // nothing?  maybe something later?
   }
   else if (move_indicator[0] == 2) {
      jump_blockers = [];
      jump_turn_point = 0;

      // Step one: is the jump on the map?
      jump_target = [ player_pos[0] + (2* move_indicator[1][0]) + move_indicator[2][0],
                     player_pos[1] + (2* move_indicator[1][1]) + move_indicator[2][1] ];
      if ( jump_target[0] < 0 || jump_target[0] >= WIDTH || jump_target[1] < 0 || jump_target[1] >= HEIGHT ) {
         move_possible = false;
         return;
      }
      // Step two: is the target location occupied?
      var target_location = level[ jump_target[0] ][ jump_target[1] ];
      if ( target_location.floor == false || object_dict[ target_location.object ].blocks ) {
         // Can't jump to here
         move_possible = false;
         return;
      } 

      // Step three: check is there's anything in the way
      jump_step_one = [player_pos[0] + move_indicator[1][0],
                      player_pos[1] + move_indicator[1][1]];
      jump_step_two = [jump_step_one[0] + move_indicator[1][0],
                      jump_step_one[1] + move_indicator[1][1]];

      if ( object_dict[ level[jump_step_one[0]][jump_step_one[1]].object ].blocksJumps ) {
         // First dir 1 step blocked
         jump_turn_point = 1;
         jump_blockers[ jump_blockers.length ] = jump_step_one;
         jump_step_one = [player_pos[0] + move_indicator[2][0],
                     player_pos[1] + move_indicator[2][1]];
         jump_step_two = [jump_step_one[0] + move_indicator[1][0],
                     jump_step_one[1] + move_indicator[1][1]];

         if ( object_dict[ level[jump_step_one[0]][jump_step_one[1]].object ].blocksJumps ) {
            // dir 2 step blocked

            jump_blockers[ jump_blockers.length ] = jump_step_one;
            move_possible = false;
         } else if ( object_dict[ level[jump_step_two[0]][jump_step_two[1]].object ].blocksJumps ) { 
            // next dir 1 step blocked

            jump_blockers[ jump_blockers.length ] = jump_step_two;
            move_possible = false;
         }
      } else if ( object_dict[ level[jump_step_two[0]][jump_step_two[1]].object ].blocksJumps ) {
         // Second dir 1 step blocked
         jump_turn_point = 2;
         jump_step_two = [jump_step_one[0] + move_indicator[2][0],
                     jump_step_one[1] + move_indicator[2][1]];

         if ( object_dict[ level[jump_step_two[0]][jump_step_two[1]].object ].blocksJumps ) { 
            // dir 2 step blocked

            jump_blockers[ jump_blockers.length ] = jump_step_two;
            move_possible = false;
         }
      } else {
         jump_turn_point = 3;
      }
   } else if (move_indicator[0] == 3) { // Partial
      // Nothing?
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
         /*
         jump_target = [ player_pos[0] + (2* move_indicator[1][0]) + move_indicator[2][0],
                        player_pos[1] + (2* move_indicator[1][1]) + move_indicator[2][1] ];
         if ( jump_target[0] < 0 || jump_target[0] >= WIDTH || jump_target[1] < 0 || jump_target[1] >= HEIGHT ) {
            // Off screen
            return;
         }
         var target_location = level[ jump_target[0] ][ jump_target[1] ];
         if ( target_location.floor == false || object_dict[ target_location.object ].blocks ) {
            // Can't jump to here
            context.drawImage( no_go_image, TILE_DIM*jump_target[0], TILE_DIM*jump_target[1] );
            return;
         } 

         // Now check is there's anything in the way...
         jump_turn_point = 0;
         jump_blockers = [];
         var step_one = [player_pos[0] + move_indicator[1][0],
                         player_pos[1] + move_indicator[1][1]];
         var step_two = [step_one[0] + move_indicator[1][0],
                         step_one[1] + move_indicator[1][1]];

         if ( object_dict[ level[step_one[0]][step_one[1]].object ].blocksJumps ) {
            // First dir 1 step blocked
            jump_turn_point = 1;
            jump_blockers[ jump_blockers.length ] = step_one;
            step_one = [player_pos[0] + move_indicator[2][0],
                        player_pos[1] + move_indicator[2][1]];
            step_two = [step_one[0] + move_indicator[1][0],
                        step_one[1] + move_indicator[1][1]];

            if ( object_dict[ level[step_one[0]][step_one[1]].object ].blocksJumps ) {
               // dir 2 step blocked

               jump_blockers[ jump_blockers.length ] = step_one;
               jump_turn_point = 0;
            } else if ( object_dict[ level[step_two[0]][step_two[1]].object ].blocksJumps ) { 
               // next dir 1 step blocked

               jump_blockers[ jump_blockers.length ] = step_two;
               jump_turn_point = 0;
            }
         } else if ( object_dict[ level[step_two[0]][step_two[1]].object ].blocksJumps ) {
            // Second dir 1 step blocked
            jump_turn_point = 2;
            step_two = [step_one[0] + move_indicator[2][0],
                        step_one[1] + move_indicator[2][1]];

            if ( object_dict[ level[step_two[0]][step_two[1]].object ].blocksJumps ) { 
               // dir 2 step blocked

               jump_blockers[ jump_blockers.length ] = step_two;
               jump_turn_point = 0;
            }
         } else {
            jump_turn_point = 3;
         }
         */
         //CalculateMoveErrata();
         
         if (move_possible == false) { // Can't do it!
            // Shade blocking tiles
            context.fillStyle = "rgba(255,0,0,0.3)";
            for (var i = 0; i < jump_blockers.length; ++i) {
               context.fillRect( jump_blockers[i][0]*TILE_DIM, jump_blockers[i][1]*TILE_DIM, TILE_DIM, TILE_DIM );
            }
            context.drawImage( no_go_image, TILE_DIM*jump_target[0], TILE_DIM*jump_target[1] );

         } else { 
            // Get the imagery required
            var jump_image, j_point;
            if( ( move_indicator[1][0] == 0 && move_indicator[1][1] == move_indicator[2][0] ) ||
                ( move_indicator[1][1] == 0 && move_indicator[1][0] == -move_indicator[2][1] ) ) {
               // Left turn
               jump_image = jump_img_up_left[ jump_turn_point-1 ];
               j_point = -1.5*TILE_DIM;
            } else  {
               // Right turn
               jump_image = jump_img_up_right[ jump_turn_point-1 ];
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

function DrawEnd() {
   if ( end_image.complete ) {
      context.drawImage( end_image, end_pos[0]*TILE_DIM, end_pos[1]*TILE_DIM );
   }
}

function DrawLevel() {
   //var min_player_row = Math.floor(player_pos[1]);
   var x,y;
   background.Draw();
   
   if ( floor_image.complete ) {
      for (y = 0; y < HEIGHT; y++) {
         for (x = 0; x < WIDTH; x++) {
            if ( level[x][y].floor == 1 ) {
               context.drawImage( floor_image, x*TILE_DIM, y*TILE_DIM );
            }
         }
      } 
   }
   DrawEnd();
   DrawMoveIndicator();
   DrawPlayer();
   for (y = 0; y < HEIGHT; y++) {
      for (x = 0; x < WIDTH; x++) {
         level[x][y].Draw( x, y );
      }
   } 
}

var cur_x_pix = 0;
var cur_y_pix = 0;

function CalculateMove() {
   if (player_state != 0) return; // Mid-air players don't make moves, yet

   var x = Math.floor( cur_x_pix / TILE_DIM ),
       y = Math.floor( cur_y_pix / TILE_DIM );
   var dx = cur_x_pix - TILE_DIM*(player_pos[0] + 0.5),
       dy = cur_y_pix - TILE_DIM*(player_pos[1] + 0.5);

   var new_move = [0, 0, 0];
   if (x == player_pos[0]) {
      if (y == player_pos[1]) {
         new_move[0] = 0;
      } else {
         new_move[0] = 1;
         new_move[1] = (dy < 0)?[0,-1]:[0,1];
      }
   } else if (y == player_pos[1]) {
      new_move[0] = 1;
      new_move[1] = (dx < 0)?[-1,0]:[1,0];
   } else {
      new_move[0] = 2;
      var diag1 = (dx - dy); // dividing line (==0) looks like this: \
      var diag2 = (dx + dy); // dividing line (==0) looks like this: /

      if ( dx > dy ) {
         if ( dx < -dy ) {
            new_move[1] = [0, -1];
            new_move[2] = (dx < 0)?[-1,0]:[1,0];
         } else {
            new_move[1] = [1,0];
            new_move[2] = (dy < 0)?[0,-1]:[0,1]; 
         }
      } else {
         if ( dx < -dy ) {
            new_move[1] = [-1,0];
            new_move[2] = (dy < 0)?[0,-1]:[0,1]; 
         } else {
            new_move[1] = [0,1];
            new_move[2] = (dx < 0)?[-1,0]:[1,0];
         }
      }
   }
$('p').html( "~new_indicator: [" + new_move[0] + ",[" + new_move[1][0] + "," + new_move[1][1] + "],[" + new_move[2][0] + "," + new_move[2][1] + "]]<br/>x_pix= " + cur_x_pix + ", y_pix= " + cur_y_pix); 

   if ( new_move[0] != move_indicator[0] ||
        new_move[1][0] != move_indicator[1][0] ||
        new_move[1][1] != move_indicator[1][1] ||
        new_move[2][0] != move_indicator[2][0] ||
        new_move[2][1] != move_indicator[2][1] ) {
      // It is a different move!
      move_indicator = new_move;
      CalculateMoveErrata();
   }
}

function MakeTheMove() {
   if (move_possible) {
      if (move_indicator[0] == 2) { // Jump!
         player_state = 1;
         player_anim_frame = 0;
      }
   }
}

function OnMouseMove( e ) {
   cur_x_pix = e.pageX - canvas[0].offsetLeft;
   cur_y_pix = e.pageY - canvas[0].offsetTop;
}

function OnClick( e ) {
   cur_x_pix = e.pageX - canvas[0].offsetLeft;
   cur_y_pix = e.pageY - canvas[0].offsetTop;
   if (player_state === 0) {
      CalculateMove();
      MakeTheMove();
   }
}

function UpdateAll( dt ) {
   switch (mode) {
      case "play": 
         UpdatePlayer( dt );
         CalculateMove();
         background.Update( dt );
         DrawLevel();
         break;
      case "next_level":

         
         //DrawLevel();
         break;
   }
}

canvas.mousemove( OnMouseMove ); 

canvas.click( OnClick );

LoadLevel( 0, 0 );

$('p').text( "success" );
document.write( "Endo?" );

setInterval( "UpdateAll(35)", 35 );
