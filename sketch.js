var population, target, maxFitness, fitnessSum, stats;
var generation = 1;
var avgFitness = 0;
var count = 0;
var popsize = 60;
var lifeSpan = 400;
var mutationRate = 0.01;
var blocks = [];

function setup(){
    createCanvas(600,600);
    target = createVector(187, 30);
    population = new Population();
    stats = new Stats();
    
    blockParams = [
        { x: 0, y: 0, w: 150, h: 150 },
        { x: 0, y: 225, w: 150, h: 150 },
        { x: 0, y: height-150, w: 150, h: 150 },
        { x: 225, y: 0, w: 150, h: 150 },
        { x: 225, y: 225, w: 150, h: 150 },
        { x: 225, y: height-150, w: 150, h: 150 },
        { x: width-150, y: 0, w: 150, h: 150 },
        { x: width-150, y: 225, w: 150, h: 150},
        { x: width-150, y: height-150, w: 150, h: 150}
      ]
    for(var i = 0; i < blockParams.length; i++) {
        blocks.push(new Block(blockParams[i]))
    }
}

function draw(){
    background(50);
    population.run();
    if(count===lifeSpan || population.allCollided()){
        population.genEvaluation();
        count = 0;
        population.selection();
        generation++;
    }
    push();
    fill(230)
    ellipse(target.x, target.y, 20, 20);
    pop();
    blocks.forEach(function(block) {
        block.draw()
      })
    count++;
    stats.setGeneration(generation);
    stats.setMaxFitness(maxFitness);
    stats.setCarsCount(population.Rocketsleft());
    stats.setSteps(count);
    stats.setAvgFitness(population.calcAvgFitness());
}


function Rocket(dna){
     if(dna){   
        this.dna = dna;
     }else{
        this.dna = new DNA();
     }
    this.collided;
    this.missionAccomplished = false;
    this.fitness = 0;
    this.prob = 0;
    this.pos = createVector(width-187, height-187);
    this.vel = createVector();
    this.accl = createVector();
    this.applyForce = function(force){
        this.accl.add(force);
    }
    this.draw = function(){
        push();
        noStroke();
        if(!this.missionAccomplished && !this.collided){
            fill(230,70,8);
        }
        else{
            fill(0,255,0);
        }
        rectMode(CENTER);
        translate(this.pos.x, this.pos.y);
        rotate(this.vel.heading());
        rect(0,0, 20, 5);
        pop();
    }
    this.update = function(){
        if(dist(this.pos.x,this.pos.y, target.x, target.y)<15) this.missionAccomplished = true;
        this.collition(blocks);
        if(!this.missionAccomplished && !this.collided){
            this.applyForce(this.dna.genes[count]);
            this.pos.add(this.vel);
            this.vel.add(this.accl);
            this.accl.mult(0);
        }
        else if(this.missionAccomplished){
            this.pos.x = target.x;
            this.pos.y = target.y;
            this.fitness*=2
        }
        else if(this.collided){
            
        }
    }
    this.calculateFitness = function(){
        let distance = dist(this.pos.x, this.pos.y, target.x, target.y);
        this.fitness = pow(1/distance, 10);
        if(this.fitness>maxFitness) maxFitness = this.fitness;
    }

    this.collition = function(blocks){
        for(var i = 0; i < blocks.length; i++) {
            if(this.pos.x > blocks[i].x &&
                this.pos.x < blocks[i].x + blocks[i].width &&
                this.pos.y > blocks[i].y &&
                this.pos.y < blocks[i].y + blocks[i].height) {
                this.collided = true;
            }
            if(this.pos.x>width || this.pos.x<0 || this.pos.y>height || this.pos.y<0) this.collided = true;
        }
    }
}

function Population(){
    this.population = [];
    for(var i = 0; i<popsize; i++){
        this.population[i] = new Rocket();
    }

    this.Rocketsleft = function(){
        var c = 0;
        for(var i = 0; i<popsize; i++){
            if(!this.population[i].collided) c+=1;
        }
        return c;
    }

    this.allCollided = function(){
        for(var i = 0; i<popsize; i++){
            if(!this.population[i].collided){
                return false;
            }
        }
        return true;
    }

    this.run = function(){
        for(var i = 0; i<this.population.length; i++){
            this.population[i].update();
            this.population[i].draw();
        }
    }

    this.calcAvgFitness = function(){
        return fitnessSum/popsize;
    }
    this.genEvaluation = function(){
        maxFitness=0;
        fitnessSum = 0;
        for(var i = 0; i<this.population.length; i++){
            this.population[i].calculateFitness();
            fitnessSum+=this.population[i].fitness;
        }
        for(var i = 0; i<this.population.length; i++){
            this.population[i].prob = (this.population[i].fitness/fitnessSum); //probability of passing genes
        }
    }

    this.pickOne = function(){ //picks one mate from population based on fitness
        var index = 0;
        var rand = random(1);
        while(rand > 0){
            rand = rand - this.population[index].prob;
            index++;
        }
        index--;
        return this.population[index];
    }
    
    this.selection = function(){
        var newpop = [];
        for(var i = 0; i<this.population.length; i++){
            var parentA = this.pickOne().dna;
            var parentB = this.pickOne().dna;
            var childDNA = parentA.crossover(parentB);
            childDNA.mutate();
            newpop[i] = new Rocket(childDNA);
        }
        this.population = newpop;
    }
}

function DNA(genes){
    if(!genes){
        this.genes = [];
        for(var i = 0; i<lifeSpan; i++){
            this.genes.push(p5.Vector.random2D());
            this.genes[i].setMag(0.2);
        }
    }else{
        this.genes = genes;
    }
    this.crossover = function(parentB){
        let cutIndex = floor(random(this.genes.length));
        var newGenes = [];
        for(var i = 0; i<this.genes.length; i++){
            if(i<cutIndex){
                newGenes[i] = this.genes[i];
            }
            else{
                newGenes[i] = parentB.genes[i];
            }
        }
        return new DNA(newGenes);
    }
    this.mutate = function(){
        for(var i = 0; i<this.genes.length; i++){
            let randNum = random();
            if(randNum<=mutationRate){
                var newGene = p5.Vector.random2D();
                this.genes[i] = newGene;
            }
        }
    }
}


function Block(p){
    this.x = p.x;
    this.y = p.y;
    this.width = p.w;
    this.height = p.h;
    this.draw = function(){
        push();
        fill(27,27,27);
        strokeWeight(3);
        stroke(150, 135, 135);
        rect(this.x, this.y, this.width, this.height);
        pop();
    }
}



function Stats() {
    this.populationSizeText = createP()
    this.maxFitnessText = createP()
    this.avgFitnessText = createP()
    this.generationText = createP()
    this.stepsText = createP()
    this.carsCountText = createP()
    
    this.populationSizeText.html('population size: ' + popsize)
    this.maxFitnessText.html('max fitness: 0')
    this.avgFitnessText.html('avg fitness: 0')
    this.generationText.html('generation: 1')
    this.stepsText.html('steps: 0')
    this.carsCountText.html('cars left: ' + population.Rocketsleft())
    
    this.setMaxFitness = function(value) {
      this.maxFitnessText.html('max fitness: ' + value)
    }
    
    this.setAvgFitness = function(value) {
      this.avgFitnessText.html('avg fitness: ' + value)
    }
    
    this.setGeneration = function(value) {
      this.generationText.html('generation: ' + value)
    }
    
    this.setSteps = function(value) {
      this.stepsText.html('steps: ' + value)
    }
    
    this.setCarsCount = function(value) {
      this.carsCountText.html('vehicles left: ' + value)
    }
  }