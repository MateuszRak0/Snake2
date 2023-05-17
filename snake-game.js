const canvas = document.getElementById("game-scene");
const scoreDisplay = document.getElementById("score-display");
let joystick = new JoyStick(document.getElementById("game-window"));
let ctx = canvas.getContext("2d");
let map = countMapSurface();
let playerRespawnPoint = map.map[`2:2`];
let player;
let pointsmenager;
let gamePaused = true;
let menuWindows = {};
const snakeColors = {
    blue:{
        firstColor:"#0051ff",
        secondColor:"#0b4fdf",
    },
    orange:{
        firstColor:"#e8b911",
        secondColor:"#e89211",
    },
    pink:{
        firstColor:"#ea14bf",
        secondColor:"#dd11b4",
    }

}
window.onload = loadGameComponents;

function loadGameComponents(){
    for(let menuWindow of document.getElementsByClassName("game-menu")){ // Saved all menu windows to call them later by button value.
        let name = menuWindow.getAttribute("name");
        menuWindows[name] = menuWindow;
    }
    
    for(let button of document.getElementsByName("switch-menu-page")){ // load all buttons from menu
        button.addEventListener("click",switchMenuWindow);
    }

    for(let button of document.getElementsByName("choice-game-mode")){ // load choice game mode buttons
        button.addEventListener("click",setGameMode);
    }

    for(let button of document.getElementsByName("choice-snake-color")){ // load choice snake color buttons
        button.addEventListener("click",setSnakeColor)
    }

    document.getElementById("game-button-pause").addEventListener("click",pauseGame);
    document.getElementById("game-button-resume").addEventListener("click",resumeGame);

}

function switchMenuWindow(){ // Switch menu window by button value 
    menuWindows[this.value].classList.add("window-element-active");
    this.offsetParent.classList.remove("window-element-active");

}

function setGameMode(){
    if(this.value == "nowalls"){
        Snake.prototype.checkBorders  = function(){
                if(this.x < 0){ this.x = map.borders.right; } 
                else if(this.x > map.borders.right){this.x = 0;}
                else if(this.y < 0){ this.y = map.borders.bottom}
                else if(this.y > map.borders.bottom){ this.y = 0}
            }
    }
    else{
        Snake.prototype.checkBorders  = function(){
            if(this.x < 0 || this.x > map.borders.right){ this.dead()} 
            else if(this.y < 0 || this.y > map.borders.bottom){ this.dead()}
        }
    }
    this.offsetParent.classList.remove("window-element-active");
    menuWindows["snakecolor-menu"].classList.add("window-element-active");
}


function setSnakeColor(){
    Snake.prototype.colors = snakeColors[this.value];
    this.offsetParent.classList.remove("window-element-active");
    startGame(); // Starting game after select snake color 
}

function startGame(){
    player = new Snake(playerRespawnPoint);
    pointsmenager = new PointsMenager();
    joystick.callback = player.steering.bind(player);
    gamePaused = false;
    menuWindows["game-topbar"].classList.add("window-element-active");
    gameLoop();
}

function pauseGame(){
    gamePaused = true;
    menuWindows["pause-menu"].classList.add("window-element-active");
    menuWindows["game-topbar"].classList.remove("window-element-active");
}

function resumeGame(){
    gamePaused = false;
    menuWindows["pause-menu"].classList.remove("window-element-active");
    menuWindows["game-topbar"].classList.add("window-element-active");
    gameLoop();
}

// TYPICAL GAME FUNCTIONS BELOW !

// MAPA
function Map(width,height,cell_size){
    this.surface = (width*cell_size) * (height*cell_size);
    this.cell_size = cell_size;
    this.map = {};
    this.width = width;
    this.height = height;

    this.borders = {
        right:(width*cell_size) + this.cell_size,
        bottom:(height*cell_size) + this.cell_size,
    }

    this.createCell = function(x,y,size){
        return {
            x:x,
            realX:x*size,
            y:y,
            realY:y*size,
            center:{
                x:(x*size) + Math.ceil(size/2),
                y:(y*size) + Math.ceil(size/2),
            }
        }
    }

    this.renderBorders = function(){
        ctx.strokeRect(0,0,this.borders.right+this.cell_size,this.borders.bottom+this.cell_size)
    }

    this.get_cell = function(real_x,real_y){
        let x = Math.floor(real_x/cell_size);
        let y = Math.floor(real_y/cell_size);
        return this.map[`${x}:${y}`]
    }

    for(let x = 0; x<=width; x++){
        for(let y = 0; y<=height; y++){
            let cell = this.createCell(x,y,cell_size)
            this.map[`${x}:${y}`] = cell;
        }
    }
    canvas.width = this.borders.right;
    canvas.height = this.borders.bottom;
}

// GRACZ
Snake.prototype.dead = function(){
    this.alive = false;
    gamePaused = true;
    menuWindows["gameover-menu"].classList.add("window-element-active");
    menuWindows["game-topbar"].classList.remove("window-element-active");
    document.getElementById("dead-score-display").innerHTML = `Twój wynik: ${pointsmenager.points}`;
}

function Snake(respawn_point){
    this.x = respawn_point.center.x;
    this.y = respawn_point.center.y;
    this.alive = true;
    this.length = 5;
    this.speed = .3;
    this.snakeNeck = [];
    this.snakeBody = [];

    this.last_cell = map.get_cell(this.x,this.y);
    this.actual_cell = map.get_cell(this.x,this.y);

    this.actual_move = {
        vertical:true,
        direction:1
    };

    this.next_move = {
        vertical:true,
        direction:1
    };

    this.move = function(){
        let real_speed = this.actual_move.direction*this.speed;

        if(this.actual_move.vertical){  this.y += real_speed } 
        else{ this.x += real_speed }

        if(this.snakeBody.length > this.length) this.snakeBody.pop();

        this.normX = Math.floor(this.x);
        this.normY = Math.floor(this.y);
    };

    this.checkActualCell = function(){ // Get info about head position on map
        let cell = map.get_cell(this.normX,this.normY);

        if(cell){
            if(cell != this.actual_cell){ // Enter to next map cell
                if(this.snakeBody.includes(cell)) this.dead();
                this.snakeBody.unshift(this.actual_cell);
                this.actual_cell = cell;
                this.smallowed++
            }

            if(this.normX == cell.center.x && this.normY == cell.center.y){ // when in center of cell
                if(cell != this.last_cell){
                    this.locked = false;
                    this.last_cell = cell;
                }

                if(this.locked == false){ //CENTER ONCE
                    this.locked = true;
                    pointsmenager.collect(cell);
                    this.turn();
                }
            }
        }
        else{
            this.checkBorders();
        }

    };

    this.steering = function(keyboard){
        switch(keyboard.key){
            case "ArrowUp":
            case "w":
                player.next_move.vertical = true;
                player.next_move.direction = -1;
                break
    
            case "ArrowDown":
            case "s":
                player.next_move.vertical = true;
                player.next_move.direction = 1;
                break
    
            case "ArrowLeft":
            case "a":
                player.next_move.vertical = false;
                player.next_move.direction = -1;
                break

            case "ArrowRight":
            case "d":
                player.next_move.vertical = false;
                player.next_move.direction = 1;
                break
        }
    };


    this.turn = function(){
        this.actual_move.direction = this.next_move.direction;
        this.actual_move.vertical = this.next_move.vertical;

        this.x = this.last_cell.center.x;
        this.y = this.last_cell.center.y;
    }

    this.smallow = function(point){
        this.speed += point.speedBonus;
        this.length += point.lengthBonus;
        this.smallowed = 0;
    }

    this.live = function(){
        if(this.alive){
            this.move();
            this.checkActualCell();
            this.renderNeck();
            
        }
        this.draw();
        this.renderHead();
    };

    this.renderNeck = function(){ // the neck is only used for the effect of smooth movement
        this.snakeNeck.unshift({
            x:this.x,
            y:this.y,
        })

        if(this.snakeNeck.length > 30){
            this.snakeNeck.pop();
        }
    };

    this.renderHead = function(){
        let x = this.x;;
        let y = this.y;
        ctx.fillStyle = "#fbe4e4"
        ctx.beginPath();
        switch(this.actual_move.vertical){
            case true:
                ctx.arc(this.x+5,this.y,2, 0, 2 * Math.PI);
                y  += this.actual_move.direction*(map.cell_size/2);
                ctx.arc(this.x-4,this.y,2, 0, 2 * Math.PI);
                break

            case false:
                x += this.actual_move.direction*(map.cell_size/2);
                ctx.arc(this.x,this.y+5,2, 0, 2 * Math.PI);
                ctx.arc(this.x,this.y-4,2, 0, 2 * Math.PI);
                break
        }
        ctx.fill();
        ctx.fillStyle = "#ff0000";
        ctx.fillRect(x-2,y-2,4,4);
    }

    this.draw = function(){
        for(let i = 0; i < this.snakeBody.length; i++){
            ctx.fillStyle = this.colors.firstColor;
            if(i % 2 == 0)ctx.fillStyle = this.colors.secondColor; 
            
            let point = this.snakeBody[i];
            if(i == this.smallowed){
                ctx.fillRect(point.realX-2,point.realY-2,map.cell_size+4,map.cell_size+4)
            } 
            else{
                ctx.fillRect(point.realX,point.realY,map.cell_size,map.cell_size)
            }
        }
        ctx.fillStyle = this.colors.firstColor;
        for(let point of this.snakeNeck){
            let size = map.cell_size;
            ctx.fillRect(point.x-(size/1.9),point.y-(size/1.9),size*1.1,size*1.1);
            
        }
    };

    window.addEventListener("keydown",this.steering)
}


// Points to eat 
function PointsMenager(){
    this.normal = false;
    this.special = false;
    this.specialColdown;
    this.points = 0;

    this.updateDisplay = function(){
        scoreDisplay.innerHTML = this.points;
    }
    
    this.collect = function(cell){
        this.specialColdown --; // collect functions is called once on a cell so it's perfect place to countdown
        let data;
        if(this.normal.cell == cell){
            data = this.normal;
            this.normal = false;
            
        } 
        else if (this.special.cell == cell){
            data = this.special;
            this.special = false;
            
        }
        if(data){
            player.smallow(data);
            this.points += data.pointValue;
            this.updateDisplay();
        } 
    }

    this.randomInt = function(max){
            return Math.floor(Math.random() * max);
    }

    this.randomCell = function(){
        let cell;
        let isBusy = true;
        while(isBusy){
            let x = this.randomInt(map.width);
            let y = this.randomInt(map.height);
            cell = map.map[`${x}:${y}`];
            if(!player.snakeBody.includes(cell)){
                isBusy = false;
            }
        }
        return cell
    }

    this.createPoint = function(img="point_normal.png",speed=.002,length=1,pointValue=5){
        let cell = this.randomCell();
        let image = new Image(16,16);
        image.src = img;  //"point_normal.png";
        return {
            cell:cell,
            img:image,
            speedBonus:speed,
            lengthBonus:length,
            pointValue:pointValue,
        }
    }

    this.createTimePoint = function(){
        this.special = this.createPoint("point_special.png",.004,2,15);
        this.specialColdown = 20; // counting like that becouse snake can speed up and reach spec points faster :)
    }

    this.renderPoints = function(){
        if(this.normal) ctx.drawImage(this.normal.img,this.normal.cell.realX, this.normal.cell.realY);
        if(this.special) ctx.drawImage(this.special.img,this.special.cell.realX, this.special.cell.realY);
        
    }

    this.live = function(){
        if(!this.normal) this.normal = this.createPoint();
        if(!this.special || this.specialColdown < 0) this.createTimePoint(); 
        this.renderPoints();
    }

}


// GAMELOOP
function gameLoop(){
    ctx.clearRect(0,0,canvas.clientWidth,canvas.height)
    pointsmenager.live();
    player.live();
    if(!gamePaused) setTimeout(gameLoop);
}

// FIT to device function
function countMapSurface(){
    let window = document.getElementById("game-container");
    let window_width = window.offsetWidth;
    let window_height = window.offsetHeight;
    let max_width = Math.floor(window_width/16) - 1;
    let max_height = Math.floor(window_height/16) - 1;
    if(max_width >= 40 && max_height >= 20){
        return new Map(40,20,16); // max horizontal oriented size
    } else if(max_width >= 20 && max_height >= 40) {
        return new Map(20,40,16); // Max vertical oriented size
    } else {
        let surface = max_width * max_height;

        while(surface > 820){
            max_width --;
            max_height --;
            surface = max_width * max_height
        }
        
        return new Map(max_width,max_height,16);
        
    }
}

// JOYSTICK for mobile devices
function JoyStick(window){
    this.gameWindow = window;
    this.popup = document.getElementById("joystick");
    this.popupSize = this.popup.clientWidth;
    this.pivot = this.popup.querySelector("div");
    this.pivot.style.left = "30px";
    this.pivot.style.top = "30px";

    this.returnToutchPos = function(event){
        var rect = event.target.getBoundingClientRect();
        var x = event.targetTouches[0].pageX - rect.left;
        var y = event.targetTouches[0].pageY - rect.top;
        return {
            x:x,
            y:y
        }
    }

    this.firstToutch = function(event){
        let toutchPos = this.returnToutchPos(event);
        let newX = toutchPos.x - this.popupSize/2;
        let newY = toutchPos.y - this.popupSize/2;
        this.popup.style.visibility = "visible";

        let distance_right = this.gameWindow.clientWidth - (newX + this.popupSize);
        let distance_left = 0 - newX;
        let distance_bottom = this.gameWindow.clientHeight - (newY + this.popupSize);
        let distance_top = 0 - newY;

        if(distance_left > 0){ newX += distance_left; } // overflow left
        else if (distance_right < 0){ newX += distance_right; } // oberflow right

        if(distance_top > 0){ newY += distance_top; } // overflow top
        else if (distance_bottom < 0){ newY += distance_bottom; } // oberflow right
        
        this.popup.style.left = `${newX}px`;
        this.popup.style.top = `${newY}px`;
    }


    this.toutch = function(event){
        let toutchPos = this.returnToutchPos(event);
        let offSetX = toutchPos.x - this.popup.offsetLeft;
        let offSetY = toutchPos.y - this.popup.offsetTop;
        let distance_horizontal = offSetX - this.popupSize/2;
        let distance_vertical = offSetY - this.popupSize/2;
        let absoluteHorizontal = Math.abs(distance_horizontal);
        let absoluteVertical = Math.abs(distance_vertical);

            if(absoluteHorizontal > 30 && absoluteHorizontal > absoluteVertical){
                if(distance_horizontal > 0){
                    this.callback({key:"ArrowRight"});
                    this.pivot.style.left = "60px";
                    this.pivot.style.top = "30px";
                } 
                else{
                    this.callback({key:"ArrowLeft"});
                    this.pivot.style.left = "0px";
                    this.pivot.style.top = "30px";
                }
            
            } 
            else if (absoluteVertical > 30 && absoluteHorizontal < absoluteVertical){

                if(distance_vertical > 0){
                    this.callback({key:"ArrowDown"});
                    this.pivot.style.left = "30px";
                    this.pivot.style.top = "60px";
                } else{
                    this.callback({key:"ArrowUp"});
                    this.pivot.style.left = "30px";
                    this.pivot.style.top = "0px";
                    
                }
                
            }
            else{
                this.pivot.style.left = "30px";
                this.pivot.style.top = "30px";
            }
    }

    this.endTotuch = function(){
        this.popup.style.visibility = "hidden";
    }

    this.movePivot = function(x,y){

    }


    this.gameWindow.addEventListener("touchstart",this.firstToutch.bind(this))
    this.gameWindow.addEventListener("touchmove",this.toutch.bind(this))
    this.gameWindow.addEventListener("touchend",this.endTotuch.bind(this))
}
