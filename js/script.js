//should I use separate js-files for every object and constants?
let controller = {
    interval: function(){},
    //states: deviceOn, gameChoice, paused, active, avimation - is it nessesary to make a constant object for them?
    state: "deviceOn",
    score: 0,
    maxScore: 0,
    //(two dummy values - array with different games is in production)
    game: 0,
    maxGame: 0,
    //maxLevel variable changes from game to game, so it's a model property - should I make here a variable to put maxLevel value from the model in it?
    level: 0,
    speed: 0,
    maxSpeed: 15,
    scoreReward: 1,
    speedGrowReward: 10,
    lives: 0,
    deviceOn(message){
        //---console.log("deviceOn started from " + message);
        this.state = "deviceOn";
        view.drawMenu("deviceOn");
        view.drawSpiral("deviceOn");
        //---console.log("deviceOn ended");
    },
    chooseGame(message){
        //---console.log("chooseGame started from " + message);
        this.state = "gameChoice";
        view.drawMenu("chooseGame");
        view.drawGameChoice("chooseGame");
        //---console.log("chooseGame ended");
    },
    startGame(message){
        //---console.log("startGame started from " + message);
        this.score = 0;
        this.lives = 5;
        this.startRound("startGame");
        //---console.log("startGame ended");
    },
    startRound(message){
        //---console.log("startRound started from " + message);
        model.init("startRound");
        view.drawMenu("startRound");
        view.drawField("startRound");
        this.startLoop("startRound");
        //---console.log("startRound ended");
    },
    //the function where context doesn't allow use "this" - is it better to use "that" or to call controller methods literally (e.g. controller.spin())?
    startLoop(message){
        //---console.log("startLoop started from " + message);
        clearInterval(this.interval);
        this.state = "active";
        let that = this;
        //is it better to use intervals or timeouts here?
        this.interval = setInterval(function(){
            model.step("startLoop");
            if (model.scoreGrow) {
                that.score += that.scoreReward;
            }
            if (model.speedGrow) {
                that.score += that.speedGrowReward;
                that.speed = that.spin(that.speed, that.maxSpeed);
                clearInterval(that.interval);
                that.startLoop("startLoop");
            }
            that.check("startLoop");
        }, 400 - 25 * this.speed);
        //---console.log("startLoop ended");
    },
    check(message){
        //---console.log("check started from " + message);
        let checkResult = model.collision("check");
        if (checkResult) {
            clearInterval(this.interval);
            this.state = "animation";
            view.drawMenu("check");
            view.drawExplode(checkResult, "check");            
        }
        else {
            view.drawMenu("check");
            view.drawField("check");            
        }
        //---console.log("check ended");
    },
    endRound(message){
        //---console.log("endRound started from " + message);
        this.lives--;
        if (this.lives > 0) {
            this.startRound("endRound");
        }
        else {
            if (this.score > this.maxScore) {
                this.maxScore = this.score;
            }
            view.drawMenu("endRound");
            //this function is visual effect but interrupts normal controller's work and forces to create additional function endRound(), which starts after animation finish - what architecture could solve this? Should I use promises instead?
            view.drawUpDown("endRound");
        }
        //---console.log("endRound ended");
    },
    //function just to spin counters like speed, level etc.
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
        //---console.log("drive started");
        //Start/Pause = Numpad1
        //Restart = Numpad2
        //Up = ArrowUp
        //Down = ArrowDown
        //Left/Level = ArrowLeft
        //Right/Speed = ArrowRight
        //Rotate/GameChoice = Numpad0
        if (this.state === "deviceOn"){
            if (key.code == "Numpad1" || key.code == "Numpad2" || key.code == "Numpad0" || key.code == "ArrowLeft" || key.code == "ArrowRight" || key.code == "ArrowUp" || key.code == "ArrowDown") {
                clearInterval(view.intervalAnimation);
                this.chooseGame("drive");
            }
        }        
        else if (this.state === "gameChoice"){
            if (key.code == "ArrowRight") {
                this.speed = this.spin(this.speed, this.maxSpeed);
                view.drawMenu("drive");
            }
            else if (key.code == "ArrowLeft") {
                this.level = this.spin(this.level, model.maxLevel);
                view.drawMenu("drive");
            }
            else if (key.code == "Numpad0") {
                this.game = this.spin(this.game, this.maxGame);
                view.drawGameChoice("drive");
                view.drawMenu("drive");
            }
            else if (key.code == "Numpad1") {
                this.startGame("drive");
            }
        }
        else if (this.state === "paused"){
            if (key.code == "Numpad1") {
                this.startLoop("drive");
            }
            else if (key.code == "Numpad2") {
                this.startGame("drive");
            }
        }
        else if (this.state === "active"){
            if (key.code == "ArrowRight") {
                model.right("drive");
                this.check("drive");
            }
            else if (key.code == "ArrowLeft") {
                model.left("drive");
                this.check("drive");
            }
            else if (key.code == "Numpad1") {
                this.state = "paused"; 
                view.drawMenu("drive");
                clearInterval(this.interval);
            }
            else if (key.code == "Numpad2") {
                this.startGame("drive");
            }
        }
        //---console.log("drive ended");
    },    
};

let model = {
    car: [[1,0,1],
          [0,1,0],
          [1,1,1],
          [0,1,0]],
    maxLevel: 0,
    position: 0,
    //car left offset > 0 and < bufferWidth - 1 
    carLeftOffset: 3,
    roadsides: [],
    //buffer of the game field with objects
    backBuffer:[],
    bufferWidth: 10,
    bufferHeight: 20,
    roadLeftOffset: 1,
    roadWidth: 5,
    roadChangeStep: 5,
    roadSpeedStep: 125,
    scoreGrow: false,
    speedGrow: false,
    init(message){
        //---console.log("model.init started from " + message);
        this.position = 0;
        this.carLeftOffset = 3;
        this.roadLeftOffset = 1;
        this.roadsides = [];
        this.backBuffer = [];
        //fill buffer with zeroes
        for (let i = 0; i < this.bufferHeight; i++){
            this.backBuffer[i] = [];
            for (let j = 0; j < this.bufferWidth; j++){
                this.backBuffer[i][j] = 0;
            }
        }        
        //fill roadsides on the start
        for (let i = 0; i < this.bufferHeight; i++){
            this.roadsides[i] = [];
            for (let j = 0; j < this.bufferWidth; j++){
                if (j < this.roadLeftOffset || j >= this.roadLeftOffset + this.roadWidth){
                    this.roadsides[i][j] = 1;
                }
                else {
                    this.roadsides[i][j] = 0;
                }
            }
        }  
        this.fillBackBuffer("model.init");
        //---console.log("model.init ended");
    },
    step(message){
        //---console.log("step started from " + message);
        //every step shifts a road towards the car, the first row vanishes, than new row appears after the last
        this.roadsides.shift();   
        let pushRow = [];
        let roadShift;
        //every few steps randomly shift the road track to left or to right (but not beyond the borders of game field)
        if (this.position % this.roadChangeStep === 0){
            do {
                roadShift = Math.floor(Math.random() * 5) - 2;
            } while (this.roadLeftOffset + roadShift <= 0 || this.roadLeftOffset + this.roadWidth + roadShift >= this.bufferWidth)
            this.roadLeftOffset += roadShift;
        }
        //fill new row with roadsides
        for (let j = 0; j < this.bufferWidth; j++){
            if (j < this.roadLeftOffset || j >= this.roadLeftOffset + this.roadWidth){
                pushRow[j] = 1;
            }
            else {
                pushRow[j] = 0;
            }
        }
        this.roadsides.push(pushRow);
        this.position++;
        //since the score giving condition depends on every specific game this checkout is performed in a model
        this.scoreGrow = (this.position % this.roadChangeStep === 0);
        this.speedGrow = (this.position % this.roadSpeedStep === 0);
        this.fillBackBuffer("step");
        //---console.log("step ended");
    },
    fillBackBuffer(message){
        //---console.log("fillBackBuffer started from " + message);
        //preparing roadsides for drawing
        for (let i = 0; i < this.bufferHeight; i++){
            for (let j = 0; j < this.bufferWidth; j++){
                this.backBuffer[i][j] = this.roadsides[i][j];
            }
        }
        //preparing car for drawing
        for (let i = 0; i < this.car.length; i++){
            for (let j = 0; j < this.car[i].length; j++){
                if (this.car[i][j] === 1) {
                    this.backBuffer[i][j + this.carLeftOffset] = this.car[i][j];
                }
            }
        }
        //---console.log("fillBackBuffer ended");
    },
    left(message) {
        //---console.log("left started from " + message);
        if (this.carLeftOffset > 1){
            this.carLeftOffset--;
            this.fillBackBuffer("left");
        }
        //---console.log("left ended");
    },
    right(message) {
        //---console.log("right started from " + message);
        if (this.carLeftOffset < this.bufferWidth - 1 - this.car[0].length) {
            this.carLeftOffset++;
            this.fillBackBuffer("right");
        }
        //---console.log("right ended");
    },
    collision(message){
        //---console.log("collision started from " + message);
        for (let i = 0; i < this.car.length; i++){
            for (let j = 0; j < this.car[i].length; j++){
                if (this.car[i][j] === 1 && this.roadsides[i][j + this.carLeftOffset] === 1){
                    //---console.log("collision ended");
                    return {
                        y: 0,
                        x: this.carLeftOffset,
                    }
                }
            }
        }
        //---console.log("collision ended");
        return false;
    },
};

const figures = {
    logo: [[1,1,1,1,1,1,1,1,1,1],
           [1,1,1,1,1,1,1,1,1,1],
           [1,1,1,1,1,1,1,1,1,1],
           [1,1,1,1,1,1,1,1,1,1],
           [1,1,1,0,0,0,0,1,1,1],
           [1,1,0,0,0,0,0,0,1,1],
           [1,0,0,1,0,0,1,0,0,1],
           [1,0,0,0,0,0,0,0,0,1],
           [1,0,0,1,0,0,1,0,0,1],
           [1,1,0,0,1,1,0,0,1,1],
           [0,1,1,0,0,0,0,1,1,0],
           [0,0,1,1,1,1,1,1,0,0],
           [0,0,0,0,1,1,0,0,0,0],
           [1,0,0,1,1,1,1,0,0,1],
           [1,1,1,1,1,1,1,1,1,1],
           [1,1,1,1,1,1,1,1,1,1],
           [1,1,1,1,1,1,1,1,1,1],
           [1,1,1,1,1,1,1,1,1,1],
           [1,1,1,1,1,1,1,1,1,1],
           [1,1,1,1,1,1,1,1,1,1]],
    A: [[0,1,1,1,0],
        [1,0,0,0,1],
        [1,1,1,1,1],
        [1,0,0,0,1],
        [1,0,0,0,1]],
    B: [[1,1,1,1,0],
        [1,0,0,0,1],
        [1,1,1,1,0],
        [1,0,0,0,1],
        [1,1,1,1,0]],
    C: [[0,1,1,1,0],
        [1,0,0,0,1],
        [1,0,0,0,0],
        [1,0,0,0,1],
        [0,1,1,1,0]],
    D: [[1,1,1,1,0],
        [0,1,0,0,1],
        [0,1,0,0,1],
        [0,1,0,0,1],
        [1,1,1,1,0]],
    E: [[1,1,1,1,1],
        [0,1,0,0,0],
        [0,1,1,1,0],
        [0,1,0,0,0],
        [1,1,1,1,1]],
    F: [[1,1,1,1,1],
        [0,1,0,0,0],
        [0,1,1,1,0],
        [0,1,0,0,0],
        [0,1,0,0,0]],
    G: [[0,1,1,1,0],
        [1,0,0,0,0],
        [1,0,1,1,1],
        [1,0,0,0,1],
        [0,1,1,1,0]],
    H: [[0,1,1,1,0],
        [1,0,0,0,1],
        [1,1,1,1,1],
        [1,0,0,0,1],
        [1,0,0,0,1]],
    I: [[1,0,0,0,1],
        [1,0,0,0,1],
        [1,1,1,1,1],
        [1,0,0,0,1],
        [1,0,0,0,1]],
    J: [[0,1,1,1,0],
        [0,0,1,0,0],
        [0,0,1,0,0],
        [1,0,1,0,0],
        [1,1,0,0,0]],
    K: [[1,0,0,1,0],
        [1,0,1,0,0],
        [1,1,0,0,0],
        [1,0,1,0,0],
        [1,0,0,1,0]],
    L: [[1,0,0,0,0],
        [1,0,0,0,0],
        [1,0,0,0,0],
        [1,0,0,0,0],
        [1,1,1,1,1]],
    M: [[1,0,0,0,1],
        [1,1,0,1,1],
        [1,0,1,0,1],
        [1,0,0,0,1],
        [1,0,0,0,1]],
    N: [[1,0,0,0,1],
        [1,1,0,0,1],
        [1,0,1,0,1],
        [1,0,0,1,1],
        [1,0,0,0,1]],
    d0: [[1,1,1],
         [1,0,1],
         [1,0,1],
         [1,0,1],
         [1,1,1]],
    d1: [[0,1,0],
         [1,1,0],
         [0,1,0],
         [0,1,0],
         [0,1,0]],
    d2: [[1,1,1],
         [0,0,1],
         [1,1,1],
         [1,0,0],
         [1,1,1]],
    d3: [[1,1,1],
         [0,0,1],
         [1,1,1],
         [0,0,1],
         [1,1,1]],
    d4: [[1,0,1],
         [1,0,1],
         [1,0,1],
         [1,1,1],
         [1,0,1]],
    d5: [[1,1,1],
         [1,0,0],
         [1,1,1],
         [0,0,1],
         [1,1,1]],
    d6: [[1,1,1],
         [1,0,0],
         [1,1,1],
         [1,0,1],
         [1,1,1]],
    d7: [[1,1,1],
         [1,0,1],
         [0,0,1],
         [0,0,1],
         [0,0,1]],
    d8: [[1,1,1],
         [1,0,1],
         [1,1,1],
         [1,0,1],
         [1,1,1]],
    d9: [[1,1,1],
         [1,0,1],
         [1,1,1],
         [0,0,1],
         [1,1,1]],
}

const explodePattern = [[[1, 0, 0, 1],
                         [0, 1, 1, 0],
                         [0, 1, 1, 0],
                         [1, 0, 0, 1]],
                        [[0, 1, 1, 0],
                         [1, 0, 0, 1],
                         [1, 0, 0, 1],
                         [0, 1, 1, 0]]];

let view = {
    intervalAnimation: function(){},
    //gameChoiceLetterTop: 6,
    //gameChoiceLetterBottom: 13,
    gameChoiceLetters: [figures.A],
    liveGrid: [14,12,9,6,4],
    menuBackBuffer: [],
    drawBuffer: [],
    drawMenuItems: {},
    init(message){
        //---console.log("view.init started from " + message);
        this.drawBuffer = document.querySelectorAll(".field-cell");
        //would it be better to create object for menu fith named fields for every meny item?
        this.drawMenuItems = {
            firstNumbers: document.querySelector(".first-numbers"),
            lastNumbers: document.querySelector(".last-numbers"),
            hi: document.querySelector(".hi"),
            score: document.querySelector(".score"),
            melody: document.querySelector(".melody"),
            lines: document.querySelector(".lines"),
            gameover: document.querySelectorAll(".gameover"),
            next: document.querySelector(".next"),
            menuBuffer: document.querySelectorAll(".next-figure-cell"),
            speed: document.querySelector(".speed"),
            speedValue: document.querySelector(".speed-value"),
            levelValue: document.querySelector(".level-value"),
            level: document.querySelector(".level"),
            gameA: document.querySelector(".game-a"),
            gameB: document.querySelector(".game-b"),
            rotate: document.querySelector(".rotate"),
            arrows: document.querySelector(".arrows"),
            pause: document.querySelector(".pause"),
            cup: document.querySelector(".cup"),
            };
        for (let i = 0; i < model.bufferHeight; i++){
            this.menuBackBuffer[i] = [];
            for (let j = 0; j < model.bufferWidth; j++){
                this.menuBackBuffer[i][j] = 0;
            }
        }
        //---console.log("view.init ended");
    },
    clearBuffer (message) {
        //---console.log("clearBuffer started from " + message);
        for (let i = 0; i < model.bufferHeight; i++){
            for (let j = 0; j < model.bufferWidth; j++){
                this.menuBackBuffer[i][j] = 0;
            }
        }
        //---console.log("clearBuffer ended");
    },
    placeFigure (figure, coords, message) {
        //---console.log("placeFigure started from " + message);
        for (let i = 0; i < figure.length; i++){
            for (let j = 0; j < figure[i].length; j++){
                this.menuBackBuffer[i + coords.Y][j + coords.X] = figure[i][j];
            }
        }
        //---console.log("placeFigure ended");
    },
    drawGameChoiceBuffer(message){
        //---console.log("drawGameChoiseBuffer started from " + message);
        for (let i = 0; i < model.bufferHeight; i++){
            for (let j = 0; j < model.bufferWidth; j++){
                if (this.menuBackBuffer[i][j] === 1){
                    this.drawBuffer[i * model.bufferWidth + j].classList.add("brick");
                }
                else {
                    this.drawBuffer[i * model.bufferWidth + j].classList.remove("brick");
                }
            }
        }
        //---console.log("drawGameChoiseBuffer ended");
    },
    //another functions with context problem
    //monster function; algorithms in this function are used only here and are executed only once, that's why I didn't see ways to make it more simple
    drawSpiral(message){
        //---console.log("drawSpiral started from " + message);
        this.placeFigure(figures.d1, {Y: 1, X: 2}, "drawSpiral");
        this.placeFigure(figures.d2, {Y: 1, X: 5}, "drawSpiral");
        this.placeFigure(figures.I, {Y: 7, X: 0}, "drawSpiral");
        this.placeFigure(figures.N, {Y: 7, X: 5}, "drawSpiral");
        this.placeFigure(figures.d1, {Y: 13, X: 4}, "drawSpiral");
        this.drawGameChoiceBuffer("drawSpiral");
        let leftWall = 0;
        let rightWall = 9;
        let topWall = 0;
        let bottomWall = 19; 
        let i = 0;
        let j = 0;
        let that = this;
        let round = 1;
        let steps = 0;
        this.intervalAnimation = setInterval(function(){
            if (i === topWall){
                that.drawSpiralCell(round, i ,j);
                if (j < rightWall) {
                    j++;
                }
                else {
                    i++;
                }
            }
            else if (i === bottomWall) {
                that.drawSpiralCell(round, i ,j);
                if (j > leftWall) {
                    j--;
                }
                else {
                    i--;
                }
            }
            else if (j === rightWall) {
                that.drawSpiralCell(round, i ,j);
                if (i < bottomWall){
                    i++;
                }
                else{
                    j--;
                }
            }
            else {
                that.drawSpiralCell(round, i ,j);
                if (i > topWall + 1){
                    i--;
                }
                else{
                    j++;
                    leftWall++;
                    rightWall--;
                    topWall++;
                    bottomWall--;
                    if (leftWall > rightWall){
                        if (round === 1) {
                            leftWall = 0;
                            rightWall = 9;
                            topWall = 0;
                            bottomWall = 19; 
                            i = 0;
                            j = 0;
                            round = 2;
                        }
                        else {
                            clearInterval(that.intervalAnimation);
                            that.intervalAnimation = setInterval(function(){
                                if (steps < 6) {
                                    if (steps % 2 === 0){
                                        that.placeFigure(figures.logo, {Y: 0, X: 0,}, "drawSpiral logo");
                                    }
                                    else {
                                        that.clearBuffer("drawSpiral logo");
                                    }
                                    that.drawGameChoiceBuffer("drawSpiral logo");
                                    steps++;
                                }
                                else {
                                    clearInterval(that.intervalAnimation);
                                    controller.chooseGame();
                                
                                }
                            }, 500);
                        }
                    }
                }
            }
        }, 25);
        //---console.log("drawSpiral ended");
    },
    drawSpiralCell(round, i, j){
        if (round === 1){
            this.drawBuffer[i * model.bufferWidth + j].classList.add("brick");
        }
        else {
            if (this.menuBackBuffer[i][j] === 1){
                this.drawBuffer[i * model.bufferWidth + j].classList.add("brick");
            }
            else {
                this.drawBuffer[i * model.bufferWidth + j].classList.remove("brick");
            }
        }
    },
    drawGameChoice(message){  
        //---console.log("drawGameChoice started from " + message);
        this.clearBuffer("drawGameChoice");
        this.placeFigure(figures.A, {Y: 7, X: 2,}, "drawGameChoice")
        this.drawGameChoiceBuffer("drawGameChoice");
        //---console.log("drawGameChoice ended");
    },    
    drawUpDown(message){
        //---console.log("drawUpDown started from " + message); 
        let i = 0;
        let steps = 0;
        let that = this;
        this.intervalAnimation = setInterval(function(){
            if (steps < model.bufferHeight){
                for (let j = 0; j < model.bufferWidth; j++){
                    that.drawBuffer[(model.bufferHeight - i - 1) * model.bufferWidth + j].classList.add("brick");
                }
                i++;
                steps++;
            }
            else if (steps >= model.bufferHeight && steps < model.bufferHeight * 2) {
                i--;                
                for (let j = 0; j < model.bufferWidth; j++){
                    that.drawBuffer[(model.bufferHeight - i - 1) * model.bufferWidth + j].classList.remove("brick");
                }
                steps++;
            }
            else if (steps === model.bufferHeight * 2) {
                clearInterval(that.intervalAnimation);
                controller.chooseGame("drawUpDown");
            }
        }, 50);
        //---console.log("drawUpDown ended");
    },
    //function is in production
    drawExplode(coords, message){
        //---console.log("drawExplode started from " + message);
        let i = 0;
        let that = this;
        that.intervalAnimation = setInterval(function(){
            if (i < 10){
                for (let j = 0; j < explodePattern[i % 2].length; j++){
                    for (let k = 0; k < explodePattern[i % 2][j].length; k++){
                        if (explodePattern[i % 2][j][k] === 1) {
                            //numeration of table cells in html begins from the top, but game field is more useful to see from bottom to top, so here top and bottom reversed by " - j - 1"; also the drawBuffer is one-dimension node-list and model coords transform from two-dimensional by "y * width + x"
                            that.drawBuffer[(model.bufferHeight - coords.y - j - 1) * model.bufferWidth + coords.x + k - 1].classList.add("brick");
                        }
                        else {
                            that.drawBuffer[(model.bufferHeight - coords.y - j - 1) * model.bufferWidth + coords.x + k - 1].classList.remove("brick");
                        }
                    }
                }
                i++;                
            }
            else {
                clearInterval(that.intervalAnimation);
                controller.endRound("drawExplode");
            }
        }, 100);
        //---console.log("drawExplode ended");
    },
    drawField(message){
        //---console.log("drawField started from " + message);
        for (let i = 0; i < model.bufferHeight; i++){
            for (let j = 0; j < model.bufferWidth; j++) {
                if (model.backBuffer[i][j] === 1) {
                    //the same reverse as in drawExplode
                    this.drawBuffer[(model.bufferHeight - i -1) * model.bufferWidth + j].classList.add("brick");
                }
                else {
                    this.drawBuffer[(model.bufferHeight - i -1) * model.bufferWidth + j].classList.remove("brick");
                }
            }
        }
        //---console.log("drawField ended");
    },
    drawMenu(message){
        //---console.log("drawMenu started from " + message);
        if (controller.state === "active") {
            //this.drawMenuItems[1].innerHTML = String(controller.score).padStart(4, '0');
            this.drawMenuItems.firstNumbers.innerHTML = ("000000" + controller.score).slice(-4);
            this.drawMenuItems.hi.classList.add("hidden");
            
            this.drawMenuItems.pause.classList.add("hidden");
            this.drawMenuItems.cup.classList.add("hidden");
        }
        
        else if (controller.state === "gameChoice") {
            //this.drawMenuItems[1].innerHTML = String(controller.maxScore).padStart(4, '0');
            this.drawMenuItems.firstNumbers.innerHTML = ("000000" + controller.maxScore).slice(-4);
            this.drawMenuItems.hi.classList.remove("hidden");
        }   

        else if (controller.state === "paused"){
            this.drawMenuItems.pause.classList.remove("hidden");
            this.drawMenuItems.cup.classList.remove("hidden");
        }
        
        for (let i = 0; i < this.liveGrid.length; i++) { //lives
            if (controller.lives > i) {
                this.drawMenuItems.menuBuffer[this.liveGrid[i]].classList.add("next-figure-brick");
            }
            else {
                this.drawMenuItems.menuBuffer[this.liveGrid[i]].classList.remove("next-figure-brick");
            }
        }
        
        this.drawMenuItems.speedValue.innerHTML = controller.speed;
        
        if (model.maxLevel === 0) {
            this.drawMenuItems.levelValue.classList.add("hidden");
            this.drawMenuItems.level.classList.add("hidden");
        }
        else {
            this.drawMenuItems.levelValue.innerHTML = controller.level;
            this.drawMenuItems.levelValue.classList.remove("hidden");
            this.drawMenuItems.level.classList.remove("hidden");
        }
    //---console.log("drawMenu ended");        
    },
};

window.onload = function() {
    view.init("window.onload");
    controller.deviceOn("window.onload");
    window.onkeydown = function(key) { controller.drive(key); }; 
    //something beyond the object model of app
    let hintButton = document.querySelector(".hint");
    let keyboardMap = document.querySelector(".keyboardmap");
    hintButton.onclick = function (){
        if (controller.state != "active"){
            keyboardMap.classList.toggle("open");
        }
    }
}; 
