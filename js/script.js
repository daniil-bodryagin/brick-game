let controller = {
    interval: function(){},
    //states: gameChoice, paused, active, gameEnd
    state: "gameChoice",
    game: 1,
    maxGame: 1,
    level: 1,
    maxLevel: 15,
    //speed !=0
    speed: 1,
    maxSpeed: 15,
    deviceOn(){
        view.drawGameChoice();
        view.drawMenu();
    },
    startGame(){
        clearInterval(this.interval);
        model.init();
        view.draw();
        view.drawMenu();
        this.interval = setInterval(this.cycle, 1000/this.speed);
    },
    cycle(){
        model.step();
        controller.check();
    },
    check(){
        if (model.collision()) {
            this.state = "gameEnd";
            clearInterval(this.interval);
            view.drawText(view.finalTextLose);
        }
        else if (model.finish()) {
            this.state = "gameEnd";
            clearInterval(this.interval);
            view.drawText(view.finalTextWin);
        }
        else {
            view.draw();
        }
    },
    rotate(counter, maxCounter){
        if (counter < maxCounter) {
            counter++;
        }
        else {
            counter = 1;
        }
        return counter;
    },
    drive(key){
        //Start/Pause = Numpad1
        //Restart = Numpad2
        //Up = ArrowUp
        //Down = ArrowDown
        //Left/Level = ArrowLeft
        //Right/Speed = ArrowRight
        //Rotate/GameChoice = Numpad0
        if (this.state === "gameChoice"){
            if (key.code == "ArrowRight") {
                this.speed = this.rotate(this.speed, this.maxSpeed);
                view.drawMenu();
            }
            else if (key.code == "ArrowLeft") {
                this.level = this.rotate(this.level, this.maxLevel);
                view.drawMenu();
            }
            else if (key.code == "Numpad0") {
                this.game = this.rotate(this.game, this.maxGame);
                view.drawGameChoice();
            }
            else if (key.code == "Numpad1") {
                this.state = "active";
                this.startGame();
            }
        }
        else if (this.state === "paused"){
            if (key.code == "Numpad1") {
                this.interval = setInterval(this.cycle, 1000/this.speed);
                this.state = "active";
            }
            else if (key.code == "Numpad2") {
                this.state = "active";
                this.startGame();
            }
        }
        else if (this.state === "active"){
            if (key.code == "ArrowRight") {
                if (model.carShift < model.bufferWidth - 1 - model.car[0].length) {
                    model.carShift++;
                    this.check();
                }
            }
            else if (key.code == "ArrowLeft") {
                if (model.carShift > 1){
                    model.carShift--;
                    this.check();
                }
            }
            else if (key.code == "Numpad1") {
                clearInterval(this.interval);
                this.state = "paused";
            }
            else if (key.code == "Numpad2") {
                this.state = "active";
                this.startGame();
            }
        }
        else if (this.state === "gameEnd"){
            if (key.code == "Numpad0") {
                this.state = "gameChoice";
                this.deviceOn();
            }
            else if (key.code == "Numpad2") {
                this.state = "active";
                this.startGame();
            }
        }
    },    
};

//space betveen obstacles: obstacles[i1][j], obstacles[i2][j], i2-i1 >= 8; obstacles shift: obstacles[i][j], 0 >= j >= 5;

const levelA1 = {
    length: 100,    
    obstacles: [[10, 3],[18,5],[26, 5],[36,2],[45,4],[55,0],[63,3],[72,2],[80,3],[90,5]]
}

const levelA2 = {
    length: 100,    
    obstacles: [[11, 1],[19,1],[28, 3],[36,5],[48,0],[55,0],[63,0],[71,5],[83,0],[91,5]]
}

const levelA3 = {
    length: 100,    
    obstacles: [[11, 1],[19,1],[28, 3],[36,5],[48,0],[55,0],[63,0],[71,5],[83,0],[91,5]]
}

const levelA4 = {
    length: 100,    
    obstacles: [[11, 1],[19,1],[28, 3],[36,5],[48,0],[55,0],[63,0],[71,5],[83,0],[91,5]]
}

const levelA5 = {
    length: 100,    
    obstacles: [[11, 1],[19,1],[28, 3],[36,5],[48,0],[55,0],[63,0],[71,5],[83,0],[91,5]]
}

const levelA6 = {
    length: 100,    
    obstacles: [[11, 1],[19,1],[28, 3],[36,5],[48,0],[55,0],[63,0],[71,5],[83,0],[91,5]]
}

const levelA7 = {
    length: 100,    
    obstacles: [[11, 1],[19,1],[28, 3],[36,5],[48,0],[55,0],[63,0],[71,5],[83,0],[91,5]]
}

const levelA8 = {
    length: 100,    
    obstacles: [[11, 1],[19,1],[28, 3],[36,5],[48,0],[55,0],[63,0],[71,5],[83,0],[91,5]]
}

const levelA9 = {
    length: 100,    
    obstacles: [[11, 1],[19,1],[28, 3],[36,5],[48,0],[55,0],[63,0],[71,5],[83,0],[91,5]]
}

const levelA10 = {
    length: 100,    
    obstacles: [[11, 1],[19,1],[28, 3],[36,5],[48,0],[55,0],[63,0],[71,5],[83,0],[91,5]]
}

const levelA11 = {
    length: 100,    
    obstacles: [[11, 1],[19,1],[28, 3],[36,5],[48,0],[55,0],[63,0],[71,5],[83,0],[91,5]]
}

const levelA12 = {
    length: 100,    
    obstacles: [[11, 1],[19,1],[28, 3],[36,5],[48,0],[55,0],[63,0],[71,5],[83,0],[91,5]]
}

const levelA13 = {
    length: 100,    
    obstacles: [[11, 1],[19,1],[28, 3],[36,5],[48,0],[55,0],[63,0],[71,5],[83,0],[91,5]]
}

const levelA14 = {
    length: 100,    
    obstacles: [[11, 1],[19,1],[28, 3],[36,5],[48,0],[55,0],[63,0],[71,5],[83,0],[91,5]]
}

const levelA15 = {
    length: 100,    
    obstacles: [[11, 1],[19,1],[28, 3],[36,5],[48,0],[55,0],[63,0],[71,5],[83,0],[91,5]]
}

let model = {
    car: [[1,0,1],[0,1,0],[1,1,1],[0,1,0]],
    levels: [levelA1, levelA2, levelA3, levelA4, levelA5, levelA6, levelA7, levelA8, levelA9, levelA10, levelA11, levelA12, levelA13, levelA14, levelA15,],
    //first step starts from index 1
    position: 1,
    //car shift > 0 and < bufferWidth - 1 
    carShift: 3,
    buffer: [],
    bufferWidth: 10,
    bufferHeight: 20,
    obstacleWidth: 3,
    obstacleHeight: 3,
    currentObstacle: 0,
    init(){
        this.position = 1;
        this.carShift = 3;
        this.buffer = [];
        this.currentObstacle = 0;
        //fill buffer by zeroes
        for (let i = 0; i < this.bufferHeight; i++){
            this.buffer[i] = [];
            for (let j = 0; j < this.bufferWidth; j++){
                this.buffer[i][j] = 0;
            }
        }
        //fill borders
        for (let i = 0; i < this.bufferHeight; i++){
            if (i % 3 !== 2){
                this.buffer[i][0] = 1;
                this.buffer[i][this.bufferWidth-1] = 1;
            }
        }
        //fill obstacles
        let levelObstacles = this.levels[controller.level - 1].obstacles;
        let currentObstacleStart = levelObstacles[this.currentObstacle][0];
        let currentObstacleEnd = currentObstacleStart + this.obstacleHeight;
        while (this.currentObstacle < levelObstacles.length && currentObstacleStart < this.bufferHeight){
            let i = 0;
            while (i < this.obstacleHeight && i + currentObstacleStart < this.bufferHeight){
                for (let j = 1; j < this.bufferWidth - 1; j++){
                    if (j < levelObstacles[this.currentObstacle][1] + 1 || j > levelObstacles[this.currentObstacle][1] + this.obstacleWidth){
                        this.buffer[i + currentObstacleStart][j] = 1;
                    }
                }
                i++;
            }
            this.currentObstacle++;
            currentObstacleStart = levelObstacles[this.currentObstacle][0];
            currentObstacleEnd = currentObstacleStart + this.obstacleHeight;
        }
        this.currentObstacle--;
    },
    step(){
        this.buffer.shift();   
        let pushRow = [];        
        let levelObstacles = this.levels[controller.level - 1].obstacles;
        if (this.currentObstacle < levelObstacles.length){
            let currentObstacleStart = levelObstacles[this.currentObstacle][0] - this.position;
            let currentObstacleEnd = currentObstacleStart + this.obstacleHeight;
            if (currentObstacleStart < this.bufferHeight){
                if (currentObstacleEnd > this.bufferHeight - 1){
                    for (let j = 1; j < this.bufferWidth - 1; j++){
                        if (j < levelObstacles[this.currentObstacle][1] + 1 || j > levelObstacles[this.currentObstacle][1] + this.obstacleWidth){
                            pushRow[j] = 1;
                        }
                    }
                }
                else {
                    for (let j = 1; j < this.bufferWidth - 1; j++){
                        pushRow[j] = 0;
                    }
                    this.currentObstacle++;
                }
            }
            else {
                for (let j = 1; j < this.bufferWidth - 1; j++){
                    pushRow[j] = 0;
                }
            }
        }
        if (this.position % 3 !== 1){
            pushRow[0] = 1;
            pushRow[this.bufferWidth-1] = 1;
        }
        else {
            pushRow[0] = 0;
            pushRow[this.bufferWidth-1] = 0;
        }
        this.buffer.push(pushRow);
        this.position++;
    },
    collision(){
        for (let i = 0; i < this.car.length; i++){
            for (let j = 0; j < this.car[i].length; j++){
                if (this.car[i][j] === 1 && this.buffer[i][j + this.carShift] === 1){
                    return true;
                }
            }
        }
        return false;
    },
    finish(){
        if (this.position > this.levels[controller.level - 1].length) {
            return true;
        }
        else return false;
    },
};

const letterA = [[7,3],[7,4],[7,5],[8,2],[8,6],[9,2],[9,3],[9,4],[9,5],[9,6],[10,2],[10,6],[11,2],[11,6]];

let view = {
    gameChoiceLetterTop: 6,
    gameChoiceLetterBottom: 13,
    gameChoiceLetters: [letterA],
    clearBackgroundHeight: 13,
    finalTextWin: [[1,1],[1,3],[1,5],[2,1],[2,3],[2,5],[3,1],[3,3],[3,5],[4,1],[4,3],[4,5],[5,2],[5,4],[7,2],[7,4],[7,7],[8,2],[8,4],[8,5],[8,7],[9,2],[9,4],[9,6],[9,7],[10,2],[10,4],[10,7],[11,2],[11,4],[11,7]],
    finalTextLose: [[1,1],[1,5],[1,6],[1,7],[2,1],[2,5],[2,7],[3,1],[3,5],[3,7],[4,1],[4,5],[4,7],[5,1],[5,2],[5,3],[5,5],[5,6],[5,7],[7,2],[7,3],[7,4],[7,6],[7,7],[7,8],[8,2],[8,6],[9,2],[9,3],[9,4],[9,6],[9,7],[10,4],[10,6],[11,2],[11,3],[11,4],[11,6],[11,7],[11,8]],
    drawBuffer: document.getElementsByTagName("td"),
    drawLevelNum: document.getElementsByClassName("levelNum"),
    drawSpeedNum: document.getElementsByClassName("speedNum"),
    drawGameChoice(){
        for (let i = 0; i < model.bufferHeight; i++){
            if (i > this.gameChoiceLetterTop - 1 && i < this.gameChoiceLetterBottom) {
                for (let j = 0; j < model.bufferWidth; j++){
                    this.drawBuffer[i * model.bufferWidth + j].setAttribute("class","brick");
                }
            }
            else {
                for (let j = 0; j < model.bufferWidth; j++){
                    this.drawBuffer[i * model.bufferWidth + j].removeAttribute("class");
                }
            }
        }
        let letter = this.gameChoiceLetters[controller.game - 1];
        for (let i = 0; i < letter.length; i++){
            this.drawBuffer[letter[i][0] * model.bufferWidth + letter[i][1]].removeAttribute("class");
        }
    },
    draw(){
        //road draw
        for (let i = 0; i < model.bufferHeight; i++){
            for (let j = 0; j < model.bufferWidth; j++) {
                if (model.buffer[i][j] === 1) {
                    this.drawBuffer[(model.bufferHeight - i -1) * model.bufferWidth + j].setAttribute("class","brick");
                }
                else {
                    this.drawBuffer[(model.bufferHeight - i -1) * model.bufferWidth + j].removeAttribute("class");
                }
            }
        }
        //car draw
        for (let i = 0; i < model.car.length; i++){
            for (let j = 0; j < model.car[i].length; j++) {
                if (model.car[i][j] === 1) {
                    this.drawBuffer[(model.bufferHeight - i -1) * model.bufferWidth + j + model.carShift].setAttribute("class","brick");
                }
            }
        }
    },
    drawMenu(){    
        this.drawLevelNum[0].innerHTML = controller.level;
        this.drawSpeedNum[0].innerHTML = controller.speed;
    },
    drawText(finalText){
        for (let i = 0; i < this.clearBackgroundHeight * model.bufferWidth; i++){
            this.drawBuffer[i].removeAttribute("class");
        }
        for (let i = 0; i < finalText.length; i++){
            this.drawBuffer[finalText[i][0] * model.bufferWidth + finalText[i][1]].setAttribute("class","brick");
        }
    },
};

window.onload = function() { 
    controller.deviceOn();
    window.onkeydown = function(key) { controller.drive(key); }; 
}; 
