function SkyKnightGame() {
   this.context = $("#game_canvas")[0].getContext( '2d' );

   this.mode = "load"; // "load", "menu", "play"

   this.run = loadFunction;
}

function loadFunction()
{
}

