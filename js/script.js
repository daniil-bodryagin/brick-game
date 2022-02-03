let controller = {
    interval: function(){},
    active: false,
    play(){
        controller.active = true;
        model.init();
        view.draw();
        view.drawMenu();
        controller.interval = setInterval(controller.cycle, 1000/model.speed);
    },
    cycle(){
        model.step();
        controller.check();
    },
    check(){
        if (model.collision()) {
            controller.active = false;
            clearInterval(controller.interval);
            view.drawText("lose");
        }
        else if (model.finish()) {
            controller.active = false;
            clearInterval(controller.interval);
            view.drawText("win");
        }
        else {
            view.draw();
        }
    },
    drive(key){
        if (key.code == "ArrowLeft") {
            if (model.carShift > 1 && controller.active){
                model.carShift--;
                controller.check();
            }
        }
        else if (key.code == "ArrowRight") {
            if (model.carShift < model.bufferWidth - 1 - model.car[0].length && controller.active) {
                model.carShift++;
                controller.check();
            }
        }
        else if (key.code == "Pause"){
            if (controller.active){
                clearInterval(controller.interval);
                controller.active = false;
            }
            else {
                controller.interval = setInterval(controller.cycle, 1000/(model.speed+1));
                controller.active = true;
            }
        }
        else if (key.code == "Numpad0") {
            clearInterval(controller.interval);
            controller.play();
        }
        else if (key.code == "Numpad5") {
            if (!controller.active){
                if (model.speed < 10) {
                    model.speed++;
                }
                else {
                    model.speed = 1;
                }
                view.drawMenu();
            }
        }
    },    
};

let level1 = {
    length: 100,
    //space betveen obstacles: obstacles[i1][j], obstacles[i2][j], i2-i1 >= 8; obstacles shift: obstacles[i][j], 0 >= j >= 5;
    obstacles: [[10, 3],[18,5],[26, 5],[36,2],[45,4],[55,0],[63,3],[72,2],[80,3],[90,5]]
}

let model = {
    car: [[1,0,1],[0,1,0],[1,1,1],[0,1,0]],
    levels: [level1],
    levelNum: 0,
    //speed !=0
    speed: 1,
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
            if (i % 5 !== 3 && i % 5 !==4){
                this.buffer[i][0] = 1;
                this.buffer[i][this.bufferWidth-1] = 1;
            }
        }
        //fill obstacles
        let levelObstacles = this.levels[this.levelNum].obstacles;
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
        let levelObstacles = this.levels[this.levelNum].obstacles;
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
        if (this.position % 5 !== 4 && this.position % 5 !== 0){
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
        if (this.position > this.levels[this.levelNum].length) {
            return true;
        }
        else return false;
    },
};

let view = {
    clearBackgroundHeight: 13,
    finalTextWin: [[1,1],[1,3],[1,5],[2,1],[2,3],[2,5],[3,1],[3,3],[3,5],[4,1],[4,3],[4,5],[5,2],[5,4],[7,2],[7,4],[7,7],[8,2],[8,4],[8,5],[8,7],[9,2],[9,4],[9,6],[9,7],[10,2],[10,4],[10,7],[11,2],[11,4],[11,7]],
    finalTextLose: [[1,1],[1,5],[1,6],[1,7],[2,1],[2,5],[2,7],[3,1],[3,5],[3,7],[4,1],[4,5],[4,7],[5,1],[5,2],[5,3],[5,5],[5,6],[5,7],[7,2],[7,3],[7,4],[7,6],[7,7],[7,8],[8,2],[8,6],[9,2],[9,3],[9,4],[9,6],[9,7],[10,4],[10,6],[11,2],[11,3],[11,4],[11,6],[11,7],[11,8]],
    drawBuffer: document.getElementsByTagName("td"),
    drawLevelNum: document.getElementsByClassName("levelNum"),
    drawSpeedNum: document.getElementsByClassName("speedNum"),
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
        this.drawLevelNum[0].innerHTML = model.levelNum+1;
        this.drawSpeedNum[0].innerHTML = model.speed;
    },
    drawText(finalText){
        for (let i = 0; i < this.clearBackgroundHeight * model.bufferWidth; i++){
            this.drawBuffer[i].removeAttribute("class");
        }
        if (finalText === "win"){
            for (let i = 0; i < this.finalTextWin.length; i++){
                this.drawBuffer[this.finalTextWin[i][0] * model.bufferWidth + this.finalTextWin[i][1]].setAttribute("class","brick");
            }
        }
        else if (finalText === "lose"){
            for (let i = 0; i < this.finalTextLose.length; i++){
                this.drawBuffer[this.finalTextLose[i][0] * model.bufferWidth + this.finalTextLose[i][1]].setAttribute("class","brick");
            }
        }
    },
};

window.onload = function() {window.onkeydown = controller.drive;}; 
