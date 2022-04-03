//should I use separate js-files for every object and constants?
let controller = {
    interval: function(){},
    //states: gameChoice, paused, active, avimation - is it nessesary to make a constant object for them?
    state: "gameChoice",
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
    chooseGame(){
        this.state = "gameChoice";
        view.drawMenu();
        view.drawGameChoice();        
    },
    startGame(){
        this.score = 0;
        this.lives = 5;
        this.startRound();
    },
    startRound(){
        model.init();
        view.drawMenu();
        view.drawField();
        this.startLoop();
    },
    //the function where context doesn't allow use "this" - is it better to use "that" or to call controller methods literally (e.g. controller.spin())?
    startLoop(){
        clearInterval(this.interval);
        this.state = "active";
        let that = this;
        //is it better to use intervals or timeouts here?
        this.interval = setInterval(function(){
            model.step();
            if (model.scoreGrow) {
                that.score += that.scoreReward;
            }
            if (model.speedGrow) {
                that.score += that.speedGrowReward;
                that.speed = that.spin(that.speed, that.maxSpeed);
                clearInterval(that.interval);
                that.startLoop();
            }
            that.check();
        }, 400 - 25 * this.speed);
    },
    check(){
        if (model.collision()) {
            clearInterval(this.interval);
            this.state = "animation";
            view.drawMenu();
            view.drawExplode();            
        }
        else {
            view.drawMenu();
            view.drawField();            
        }
        console.log(this.lives);
    },
    endRound(){
        this.lives--;
        if (this.lives > 0) {
            this.startRound();
        }
        else {
            if (this.score > this.maxScore) {
                this.maxScore = this.score;
            }
            //this function is visual effect but interrupts normal controller's work and forces to create additional function endRound(), which starts after animation finish - what architecture could solve this? Should I use promises instead?
            view.drawUpDown();
        }
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
                model.right();
                this.check();
            }
            else if (key.code == "ArrowLeft") {
                model.left();
                this.check();
            }
            else if (key.code == "Numpad1") {
                this.state = "paused"; 
                view.drawMenu();
                clearInterval(this.interval);
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
    init(){
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
        this.fillBackBuffer();        
    },
    step(){
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
        if (this.position % this.roadChangeStep === 0) {
            this.scoreGrow = true;
        }
        else {
            this.scoreGrow = false;
        }
        if (this.position % this.roadSpeedStep === 0) {
            this.speedGrow = true;
        }
        else {
            this.speedGrow = false;
        }
        this.fillBackBuffer();
    },
    fillBackBuffer(){
        //preparing roadsides for drawing
        for (let i = 0; i < this.bufferHeight; i++){
            for (let j = 0; j < this.bufferWidth; j++){
                this.backBuffer[i][j] = this.roadsides[i][j];
            }
        }
        //preparing car for drawing
        for (let i = 0; i < this.car.length; i++){
            for (let j = 0; j < this.car[i].length; j++){
                this.backBuffer[i][j + this.carLeftOffset] = this.car[i][j];
            }
        }
    },
    left() {
        if (this.carLeftOffset > 1){
            this.carLeftOffset--;
            this.fillBackBuffer();
        }
    },
    right() {
        if (this.carLeftOffset < this.bufferWidth - 1 - this.car[0].length) {
            this.carLeftOffset++;
            this.fillBackBuffer();
        }
    },
    collision(){
        for (let i = 0; i < this.car.length; i++){
            for (let j = 0; j < this.car[i].length; j++){
                if (this.car[i][j] === 1 && this.roadsides[i][j + this.carLeftOffset] === 1){
                    return true;
                }
            }
        }
        return false;
    },
};

const letterA = [[7,3],[7,4],[7,5],[8,2],[8,6],[9,2],[9,3],[9,4],[9,5],[9,6],[10,2],[10,6],[11,2],[11,6]];

let view = {
    intervalAnimation: function(){},
    gameChoiceLetterTop: 6,
    gameChoiceLetterBottom: 13,
    gameChoiceLetters: [letterA],
    liveGrid: [14,12,9,6,4],
    drawBuffer: [],
    drawMenuItems: [],
    drawMenuBuffer: [],
    init(){
        this.drawBuffer = document.querySelectorAll(".field-cell");
        //would it be better to create object for menu fith named fields for every meny item?
        this.drawMenuItems = document.querySelectorAll(".menu *");
        this.drawMenuBuffer = document.querySelectorAll(".next-figure-cell");
    },
    drawGameChoice(){
        console.log(this.drawMenuItems);        
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
    },
    //another functions with context problem
    drawUpDown(){
        let i = 0;
        let steps = 0;
        that = this;
        this.intervalAnimation = setInterval(function(){
            if (steps < model.bufferHeight){
                for (let j = 0; j < model.bufferWidth; j++){
                    model.backBuffer[i][j] = 1;
                }
                i++;
                steps++;
                that.drawField();
            }
            else if (steps >= model.bufferHeight && steps < model.bufferHeight * 2) {
                i--;                
                for (let j = 0; j < model.bufferWidth; j++){
                    model.backBuffer[i][j] = 0;
                }
                steps++;
                that.drawField();
            }
            else if (steps === model.bufferHeight * 2) {
                clearInterval(that.intervalAnimation);
                controller.chooseGame();
            }
        }, 50);
    },
    //function is in production
    drawExplode(){
        controller.endRound();
    },
    drawField(){
        for (let i = 0; i < model.bufferHeight; i++){
            for (let j = 0; j < model.bufferWidth; j++) {
                if (model.backBuffer[i][j] === 1) {
                    this.drawBuffer[(model.bufferHeight - i -1) * model.bufferWidth + j].classList.add("brick");
                }
                else {
                    this.drawBuffer[(model.bufferHeight - i -1) * model.bufferWidth + j].classList.remove("brick");
                }
            }
        }
    },
    drawMenu(){
        console.log(controller.lives + " view " + controller.state);
        
        if (controller.state === "active") {
            this.drawMenuItems[1].innerHTML = String(controller.score).padStart(4, '0');
            this.drawMenuItems[4].classList.add("hidden");
            for (let i = 0; i < this.liveGrid.length; i++) {
                if (controller.lives > i) {
                    this.drawMenuBuffer[this.liveGrid[i]].classList.add("next-figure-brick");
                }
                else {
                    this.drawMenuBuffer[this.liveGrid[i]].classList.remove("next-figure-brick");
                }
                console.log(controller.lives > i);
            }
            
            this.drawMenuItems[44].classList.add("hidden");
            this.drawMenuItems[45].classList.add("hidden");
        }
        
        else if (controller.state === "gameChoice") {
            this.drawMenuItems[1].innerHTML = String(controller.maxScore).padStart(4, '0');
            this.drawMenuItems[4].classList.remove("hidden");
        }   

        else if (controller.state === "paused"){
            this.drawMenuItems[44].classList.remove("hidden");
            this.drawMenuItems[45].classList.remove("hidden");
        }
        
        this.drawMenuItems[36].innerHTML = controller.speed;
        
        if (model.maxLevel === 0) {
            this.drawMenuItems[37].classList.add("hidden");
            this.drawMenuItems[38].classList.add("hidden");
        }
        else {
            this.drawMenuItems[37].innerHTML = controller.level;
            this.drawMenuItems[37].classList.remove("hidden");
            this.drawMenuItems[38].classList.remove("hidden");
        }        
    },
};

window.onload = function() {
    view.init();
    controller.chooseGame();
    window.onkeydown = function(key) { controller.drive(key); }; 
}; 
