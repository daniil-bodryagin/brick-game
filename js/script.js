let controller = {
    interval: function(){},
    //states: gameChoice, paused, active, gameEnd
    state: "gameChoice",
    currentScore: 0,
    maxScore: 0,
    game: 0,
    maxGame: 0,
    level: 0,
    speed: 0,
    maxSpeed: 15,
    deviceOn(){
        this.currentScore = 0;
        view.drawGameChoice();
        view.drawMenu();
    },
    startGame(){
        clearInterval(this.interval);
        model.init();
        this.currentScore = 0;
        view.draw();
        view.drawMenu();
        this.startLoop();
    },
    startLoop(){
        this.state = "active";
        this.interval = setInterval(function(){
            model.step();
            controller.countScore();
            controller.check();
        }, 400 - 25 * this.speed);
    },
    countScore(){
        if (model.position % model.roadChangeStep === 0) this.currentScore += 100;
        if (model.position % model.roadSpeedStep === 0) {
            this.currentScore += 1000;
            this.speed = this.spin(this.speed, this.maxSpeed);
            clearInterval(this.interval);
            this.startLoop();
        }
        view.drawMenu();
    },
    check(){
        if (model.collision()) {
            this.state = "gameEnd";
            clearInterval(this.interval);
            view.drawText(view.finalTextLose);
            view.drawMenu();
        }
        else {
            view.draw();
            view.drawMenu();
        }
    },
    spin(counter, maxCounter){
        if (counter < maxCounter) {
            counter++;
        }
        else {
            counter = 0;
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
                this.speed = this.spin(this.speed, this.maxSpeed);
                view.drawMenu();
            }
            else if (key.code == "ArrowLeft") {
                this.level = this.spin(this.level, model.maxLevel);
                view.drawMenu();
            }
            else if (key.code == "Numpad0") {
                this.game = this.spin(this.game, this.maxGame);
                view.drawGameChoice();
                view.drawMenu();
            }
            else if (key.code == "Numpad1") {
                this.startGame();
            }
        }
        else if (this.state === "paused"){
            if (key.code == "Numpad1") {
                this.startLoop();
            }
            else if (key.code == "Numpad2") {
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
                this.state = "paused";                
                clearInterval(this.interval);
            }
            else if (key.code == "Numpad2") {
                this.startGame();
            }
        }
        else if (this.state === "gameEnd"){
            if (key.code == "Numpad0") {
                if (this.currentScore > this.maxScore) this.maxScore = this.currentScore;
                this.state = "gameChoice";
                this.deviceOn();
            }
            else if (key.code == "Numpad2") {
                this.startGame();
            }
        }
    },    
};

let model = {
    car: [[1,0,1],[0,1,0],[1,1,1],[0,1,0]],
    maxLevel: 0,
    position: 0,
    //car shift > 0 and < bufferWidth - 1 
    carShift: 3,
    buffer: [],
    bufferWidth: 10,
    bufferHeight: 20,
    levelLength: 100,
    roadStart: 1,
    roadWidth: 5,
    roadChangeStep: 5,
    roadSpeedStep: 125,
    init(){
        this.position = 0;
        this.carShift = 3;
        this.roadStart = 1;
        this.buffer = [];
        //fill buffer by zeroes
        for (let i = 0; i < this.bufferHeight; i++){
            this.buffer[i] = [];
            for (let j = 0; j < this.bufferWidth; j++){
                this.buffer[i][j] = 0;
            }
        }
        //fill road
        for (let i = 0; i < this.bufferHeight; i++){
            for (let j = 0; j < this.bufferWidth; j++){
                if (j < this.roadStart || j >= this.roadStart + this.roadWidth){
                    this.buffer[i][j] = 1;
                }
            }
        }                
    },
    step(){
        this.buffer.shift();   
        let pushRow = [];
        let roadShift;        
        if (this.position % this.roadChangeStep === 0){
            do {
                roadShift = Math.floor(Math.random() * 5) - 2;
            } while (this.roadStart + roadShift <= 0 || this.roadStart + this.roadWidth + roadShift >= this.bufferWidth)
            this.roadStart += roadShift;
        }
        for (let j = 0; j < this.bufferWidth; j++){
            if (j < this.roadStart || j >= this.roadStart + this.roadWidth){
                pushRow[j] = 1;
            }
            else {
                pushRow[j] = 0;
            }
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
    drawMenuLines: document.getElementsByClassName("menuItem"),
    drawGameChoice(){
        for (let i = 0; i < model.bufferHeight; i++){
            if (i > this.gameChoiceLetterTop - 1 && i < this.gameChoiceLetterBottom) {
                for (let j = 0; j < model.bufferWidth; j++){
                    this.drawBuffer[i * model.bufferWidth + j].classList.add("brick");
                }
            }
            else {
                for (let j = 0; j < model.bufferWidth; j++){
                    this.drawBuffer[i * model.bufferWidth + j].classList.remove("brick");
                }
            }
        }
        let letter = this.gameChoiceLetters[controller.game];
        for (let i = 0; i < letter.length; i++){
            this.drawBuffer[letter[i][0] * model.bufferWidth + letter[i][1]].classList.remove("brick");
        }
        if (model.maxLevel === 0) {
            this.drawMenuLines[2].classList.add("hidden");
            this.drawMenuLines[3].classList.add("hidden");
        }
        else {
            this.drawMenuLines[2].classList.remove("hidden");
            this.drawMenuLines[3].classList.remove("hidden");
        }
    },
    draw(){
        //road draw
        for (let i = 0; i < model.bufferHeight; i++){
            for (let j = 0; j < model.bufferWidth; j++) {
                if (model.buffer[i][j] === 1) {
                    this.drawBuffer[(model.bufferHeight - i -1) * model.bufferWidth + j].classList.add("brick");
                }
                else {
                    this.drawBuffer[(model.bufferHeight - i -1) * model.bufferWidth + j].classList.remove("brick");
                }
            }
        }
        //car draw
        for (let i = 0; i < model.car.length; i++){
            for (let j = 0; j < model.car[i].length; j++) {
                if (model.car[i][j] === 1) {
                    this.drawBuffer[(model.bufferHeight - i -1) * model.bufferWidth + j + model.carShift].classList.add("brick");
                }
            }
        }
    },
    drawMenu(){
        if (controller.state === "active") {
            this.drawMenuLines[0].innerHTML = "score";
            this.drawMenuLines[1].innerHTML = controller.currentScore;
        }
        else if (controller.state === "gameChoice") {
            this.drawMenuLines[0].innerHTML = "hiscore";
            this.drawMenuLines[1].innerHTML = controller.maxScore;
        }
        this.drawMenuLines[3].innerHTML = controller.level;
        this.drawMenuLines[5].innerHTML = controller.speed;
    },
    drawText(finalText){
        for (let i = 0; i < this.clearBackgroundHeight * model.bufferWidth; i++){
            this.drawBuffer[i].removeAttribute("class");
        }
        for (let i = 0; i < finalText.length; i++){
            this.drawBuffer[finalText[i][0] * model.bufferWidth + finalText[i][1]].classList.add("brick");
        }
    },
};

window.onload = function() { 
    controller.deviceOn();
    window.onkeydown = function(key) { controller.drive(key); }; 
}; 
