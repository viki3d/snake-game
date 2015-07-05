////////////////////////////////////////////////////////////////////////////////
//                                                                            //
// Snake game by Victor Kirov                                                 //
// victor.kirov.eu@gmail.com                                                  //
//                                                                            //
////////////////////////////////////////////////////////////////////////////////

	function Game(initial) {
		var canvas = document.getElementById("playground");
		canvas.width  = 400;
		canvas.height = 400; 
		canvas.style.width  = '400px';
		canvas.style.height = '400px';
		
		this.fieldSize = 10;
		this.fieldWidth = 
			Math.floor( 
				document.getElementById('playground').width / this.fieldSize 
			);
		this.fieldHeight = 
			Math.floor( 
				document.getElementById('playground').height / this.fieldSize 
			);
		if (Game.drawingEngine==null) 
			Game.drawingEngine = 
				new DrawingEngine(
					this.fieldSize, 
					this.fieldWidth, 
					this.fieldHeight
				);
		if (Game.audioEngine==null) 
			Game.audioEngine = new AudioEngine();
		
	
		//  Help function: Get a random number in a range (from, to)
		this.getRandomInt = function(min, max) {
			return Math.floor(Math.random() * (max - min + 1)) + min;
		}
		
		//  Playground types
		this.playgroundTypesEnum = 
			Object.freeze(  
				{ 
					EMPTY:0, WALL:'#223344', SNAKE:'#859B3B', APPLE:'#DC143C' 
				}  
			);
		
		//  Initialize playground
		this.playground = new Array(this.fieldWidth);
		for (var c=0; c<this.playground.length; c++)
			this.playground[c] = new Array(this.fieldHeight);
			
		//  Draw playground boundaries
		for (var rows=0; rows<this.fieldWidth; rows++) {
			for (var cols=0; cols<this.fieldHeight; cols++) {
				this.playground[cols][rows] = this.playgroundTypesEnum.EMPTY;
				if (rows==0 || rows==this.fieldWidth-1 
				|| cols==0 || cols==this.fieldHeight-1) {
					this.playground[cols][rows] = this.playgroundTypesEnum.WALL;
					Game.drawingEngine.draw(
						cols*this.fieldSize, 
						rows*this.fieldSize,
						cols*this.fieldSize + this.fieldSize, 
						rows*this.fieldSize + this.fieldSize,
						this.playgroundTypesEnum.WALL
					);
				}
			}
		}
		
		//  Shorten inner side of boundaries
		for (var rows=0; rows<this.fieldWidth; rows++) {
			for (var cols=0; cols<this.fieldHeight; cols++) {
					if (rows==0 && cols==1) continue;
					if (rows==1 && cols==0) continue;
					if (rows==0 && cols==this.fieldWidth-2) continue;
					if (rows==1 && cols==this.fieldWidth-1) continue;

					if (rows==this.fieldHeight-1 && cols==1) continue;
					if (rows==this.fieldHeight-2 && cols==0) continue;
					if (rows==this.fieldHeight-1 
						&& cols==this.fieldWidth-2) continue;
					if (rows==this.fieldHeight-2 
						&& cols==this.fieldWidth-1) continue;

			
				if (rows==1 || rows==this.fieldHeight-2 
				|| cols==1 || cols==this.fieldWidth-2) {
					Game.drawingEngine.erase(
						cols*this.fieldSize, 
						rows*this.fieldSize,
						cols*this.fieldSize+this.fieldSize, 
						rows*this.fieldSize+this.fieldSize
					);
				}
			}
		}
		
		if (initial) {
			//  Display game intro screen; 
			//  Does not initialize whole game, only the playground.
			Game.drawingEngine.intro();
			return;
		}
		
		//  Playing the game, not crashed or in intro screen
		this.playing = true;
		this.snake = new Snake(this);
		this.apple = new Apple(this, snake.sections);
		
		this.timer = null;
		this.start = function() {
			if (this.timer) {
				clearInterval(this.timer);
				this.timer = null;
			}	
			this.timer = setInterval('this.snake.move(this.snake)', 150);
		}
		
		Game.audioEngine.playBackgroundMusic();
	}

	function PlaygroundPoint(x, y) {
		this.x = x;
		this.y = y;
	}
	
	function PlaygroundField(type) {
		this.type = type;
	}

	//  The apple object, appearing on the playground, eaten by the snake
	function Apple(game, snakeSections) {
		var positionValid = false;
		
		while (!positionValid) {
			this.x = game.getRandomInt(2, game.fieldWidth-2);
			this.y = game.getRandomInt(2, game.fieldHeight-2);
			
			positionValid = true;
			for (var i=0; i<snakeSections.length; i++) {
				if (this.x==snakeSections[i].x && this.y==snakeSections[i].y) {
					positionValid = false;
					break;
				}
			}
		};
	}


	//  Constructor: In Javascript it is a convention to capitalize the names of
	//  constructors so that they are easily distinguished from other functions.
	function Snake(game) {
		parent.snake = this;
	
		//  Make game object available for inner methods
		this.game = game;
		
		//  Make snake longer with [growing] sections, after eats an apple
		this.growing = 0;
		
		//  A convenient way for ENUM in Javascript, 
		//  don't forget to use Object.freeze to make the enum immutable
		this.directionsEnum = 
			Object.freeze(  { NORTH:0, EAST:1, SOUTH:2, WEST: 3 }  );
		this.direction = this.directionsEnum.EAST;
		
		//  Initial snake coordinates
		this.headCoordinates = 	
					new PlaygroundPoint(
						game.getRandomInt(4, 4+Math.random(game.fieldWidth/2)), 
						game.getRandomInt(3, game.fieldHeight-3)
					);
								
		//  The snake body						
		this.sections = [
			this.headCoordinates,
			new PlaygroundPoint(this.headCoordinates.x-1, this.headCoordinates.y),
			new PlaygroundPoint(this.headCoordinates.x-2, this.headCoordinates.y),
		];
		
		
		//  Set snake in playground
		for (var i=0; i<this.sections.length; i++) {
			game.playground[this.sections[i].x][this.sections[i].y] = 
				game.playgroundTypesEnum.SNAKE;
		}
		
		//  After the snake movement is changed, 
		//  animation is needed to be done before the next change
		this.canChangeSnakeMovement = true;
		
		this.move = function() {
			this.canChangeSnakeMovement = true;
		
			var nextHeadCoord = 
				new PlaygroundPoint(this.sections[0].x, this.sections[0].y);
	
			switch (this.direction) {
				case this.directionsEnum.NORTH : 
						nextHeadCoord.y = this.headCoordinates.y - 1; 
					break;
				case this.directionsEnum.EAST : 
						nextHeadCoord.x = this.headCoordinates.x + 1; 
					break;
				case this.directionsEnum.SOUTH : 
						nextHeadCoord.y = this.headCoordinates.y + 1;  
					break;
				case this.directionsEnum.WEST : 
						nextHeadCoord.x = this.headCoordinates.x - 1; 
					break;
				
			}
			
			//  Check for crash
			if (this.game.playground[nextHeadCoord.x][nextHeadCoord.y]!=
					this.game.playgroundTypesEnum.EMPTY 
			&& this.game.playground[nextHeadCoord.x][nextHeadCoord.y]!=
					this.game.playgroundTypesEnum.APPLE) {
				clearInterval(this.game.timer);
				this.game.timer = null;
				Game.drawingEngine.crashed();
				this.game.playing = false;
				Game.audioEngine.crash();
				return;
			}
			
			//  Check for apple eating
			if (nextHeadCoord.x==this.game.apple.x 
			&& nextHeadCoord.y==this.game.apple.y) {
				game.apple = new Apple(this.game, this.sections);
				this.growing = 2;
				Game.audioEngine.eatApple();
			}
			
			//  Unset snake from playground
			for (var i=0; i<this.sections.length; i++) {
				game.playground[this.sections[i].x][this.sections[i].y] = 
					game.playgroundTypesEnum.EMPTY;
			}
			
			//  Check if snake is growing
			if (this.growing>0) {
				this.growing--;
				//  Enlarge the snake by duplicating the last section
				this.sections.push(  this.sections[this.sections.length-1]  );
			}
			else {
				//  Remove tail
				Game.drawingEngine.erase(
					this.sections[this.sections.length-1].x*game.fieldSize-1, 
					this.sections[this.sections.length-1].y*game.fieldSize-1,
					this.sections[this.sections.length-1].x
						*game.fieldSize+game.fieldSize+1, 
					this.sections[this.sections.length-1].y
						*game.fieldSize+game.fieldSize+1					
				);
			}
			
			//  Set next coordinate for every snake section; 
			//  first- body, last- head.
			for (var i=this.sections.length-1; i>0; i--) {
				this.sections[i] = this.sections[i-1];
			}
			this.sections[0] = nextHeadCoord;
			this.headCoordinates = nextHeadCoord;
			
			//  Draws head
			Game.drawingEngine.draw(
				this.sections[0].x*game.fieldSize, 
				this.sections[0].y*game.fieldSize, 
				this.sections[0].x*game.fieldSize+game.fieldSize, 
				this.sections[0].y*game.fieldSize+game.fieldSize,
				game.playgroundTypesEnum.SNAKE
			);

			//  Draws the section before tail (the last but one section)
			Game.drawingEngine.draw(
				this.sections[this.sections.length-1].x*game.fieldSize, 
				this.sections[this.sections.length-1].y*game.fieldSize,
				this.sections[this.sections.length-1].x
					*game.fieldSize+game.fieldSize, 
				this.sections[this.sections.length-1].y
					*game.fieldSize+game.fieldSize,
				game.playgroundTypesEnum.SNAKE
			);
			
			//  Draws the apple
			Game.drawingEngine.draw(
				game.apple.x*game.fieldSize, 
				game.apple.y*game.fieldSize,
				game.apple.x*game.fieldSize+game.fieldSize, 
				game.apple.y*game.fieldSize+game.fieldSize,
				game.playgroundTypesEnum.APPLE
			);
			
			//  Set snake in playground
			for (var i=0; i<this.sections.length; i++) {
				game.playground[this.sections[i].x][this.sections[i].y] = 
					game.playgroundTypesEnum.SNAKE;
			}				
		}
		
		this.changeDirection = function(keyCode) {
			if (!this.canChangeSnakeMovement) return;
			this.canChangeSnakeMovement = false;
			
			switch (keyCode) {
				// Left
				case 37 :
				case 100 :
					if (this.direction==this.directionsEnum.NORTH 
					|| this.direction==this.directionsEnum.SOUTH) {
						this.direction = this.directionsEnum.WEST;
						Game.audioEngine.changeSnakeDirection();
					}
					break;
					
				// Up
				case 38 :
				case 104 :
					if (this.direction==this.directionsEnum.WEST 
					|| this.direction==this.directionsEnum.EAST) {
						this.direction = this.directionsEnum.NORTH;
						Game.audioEngine.changeSnakeDirection();
					}
					break;
					
				// Right
				case 39 :
				case 102 :
					if (this.direction==this.directionsEnum.NORTH 
					|| this.direction==this.directionsEnum.SOUTH) {
						this.direction = this.directionsEnum.EAST;
						Game.audioEngine.changeSnakeDirection();						
					}	
					break;
					
				// Down
				case 40 :
				case 98 :
					if (this.direction==this.directionsEnum.WEST 
					|| this.direction==this.directionsEnum.EAST) {
						this.direction = this.directionsEnum.SOUTH;
						Game.audioEngine.changeSnakeDirection();							
					}	
					break;						
			}
		}
	}
	
	
	