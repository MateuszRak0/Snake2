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
const canvas = document.getElementById("game-scene");
let ctx = canvas.getContext("2d");
let map = countMapSurface();
let playerRespawnPoint = map.map[`2:2`];
let player = new Snake(playerRespawnPoint,snakeColors.blue);
let pointsmenager = new PointsMenager();
let gamePaused = false;


function gamePadController(){
    player.steering({key:this.value});
}
for(let button of document.getElementsByClassName("game-pad-button")){
    button.addEventListener("click",gamePadController)
}


// FIT to device functions ( mobile mode / adjust to size)
function countMapSurface(){
    let window = document.getElementById("game-window");
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
function Snake(respawn_point,colors){
    this.x = respawn_point.center.x;
    this.y = respawn_point.center.y;
    this.alive = true;
    this.length = 5;
    this.speed = .3;
    this.snakeNeck = [];
    this.snakeBody = [];
    this.firstColor = colors.firstColor;
    this.secondColor = colors.secondColor;

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
            if(cell != this.actual_cell){ //ENTRY TO NEW
                if(this.snakeBody.includes(cell)) this.alive = false;
                this.snakeBody.unshift(this.actual_cell);
                this.actual_cell = cell;
                this.smallowed++
            }

            if(this.normX == cell.center.x && this.normY == cell.center.y){ //CENTER
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

    this.checkBorders = function(){
        if(this.x < 0){ this.x = map.borders.right; } 
        else if(this.x > map.borders.right){this.x = 0;}
        else if(this.y < 0){ this.y = map.borders.bottom}
        else if(this.y > map.borders.bottom){ this.y = 0}
    }

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

    // Cosmetic's Grapics functions from snake below 

    this.renderNeck = function(){
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
            ctx.fillStyle = this.firstColor;
            if(i % 2 == 0)ctx.fillStyle = this.secondColor; 
            
            let point = this.snakeBody[i];
            if(i == this.smallowed){
                ctx.fillRect(point.realX-2,point.realY-2,map.cell_size+4,map.cell_size+4)
            } 
            else{
                ctx.fillRect(point.realX,point.realY,map.cell_size,map.cell_size)
            }
        }
        ctx.fillStyle = this.firstColor;
        for(let point of this.snakeNeck){
            let size = map.cell_size;
            ctx.fillRect(point.x-(size/1.9),point.y-(size/1.9),size*1.1,size*1.1);
            
        }
    };

    window.addEventListener("keydown",this.steering)
}


// Punkty do zjadania
function PointsMenager(){
    this.normal = false;
    this.special = false;
    this.specialColdown;

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
        if(data) player.smallow(data);
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

    this.createPoint = function(img="point_normal.png",speed=.002,length=1){
        let cell = this.randomCell();
        let image = new Image(16,16);
        image.src = img;  //"point_normal.png";
        return {
            cell:cell,
            img:image,
            speedBonus:speed,
            lengthBonus:length,
        }
    }

    this.createTimePoint = function(){
        this.special = this.createPoint("point_special.png",.004,2);
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

gameLoop();
