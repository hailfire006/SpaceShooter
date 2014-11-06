//constants
var invincibility = false;
var increaseDifficultyTimer = 3000;
var spawnIntervalInitial = 3000;
var runInterval = 10;
var homingTimerConstant = 0.5;  // time in seconds
var LEVEL_CHANGE_DURATION = 3000;
//globals
var displayLevelText = false;
var level = 0;
var levelChange = true;
var enemyCount = 0;
var homingTimer = 0;  // time in seconds
var score = 0
var killStreakActive = false;
var killStreak = 10;
var killCounter = 0;
var spawnInterval = spawnIntervalInitial;
var paused = false;
var keysDown = {};
var keysUp = {};
var time = Date.now();
var limit = [1,7,13,15,18,22,29,34,40,55];
var entities = [];
var player = {
    x: 400,
    y: 250,
    width: 50,
    height: 50,
    speed: 600,
    speedx: 0,
    speedy: 0,
    color: '#c00',
    friendly: true,
    imageName: "playerGalagaship.png",
};
var imageMap = []
//canvas
var canvas = document.getElementById('myCanvas');
var ctx = canvas.getContext("2d");

var scoreCanvas = document.getElementById('scoreCanvas');
var scoreCtx = scoreCanvas.getContext("2d");

//functions
function update(mod) {
    if (paused) {
        return;
    }
    if (killCounter >= killStreak) {
        killCounter = 0
        killStreak += 5
        killStreakActive = true
    }
    moveEntities(mod);
    handleKeys(mod);
    rotateSprites();
    keepPlayerInsideBounds();
    collectTrash();
    collision();
    removeCollided();
}
function run() {
    var timeElapsed = (Date.now() - time);
    update(timeElapsed / 1000);
    render();
    renderHUD();
    time = Date.now();
}
function renderHUD() {
    scoreCtx.fillStyle = '#808080';
    var scoreCanvasRect = scoreCanvas.getBoundingClientRect();
    scoreCtx.fillRect(0, 0, scoreCanvas.width, scoreCanvas.height);
    
    scoreCtx.beginPath();
    scoreCtx.fillStyle = "blue";
    scoreCtx.font = "50px Arial";
    scoreCtx.fillText("kills till next killstreak:" + (killStreak - killCounter) , 10,45);
    scoreCtx.fillText("score:" + score ,10,90);
    scoreCtx.fillText("level: " + level,10,140);
    scoreCtx.stroke();
    
    
}
function render() {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (var i = 0; i < entities.length; i++) {
        ctx.fillStyle = entities[i].color;
        if (!entities[i].image) {
            ctx.fillRect(entities[i].x, entities[i].y, entities[i].width, entities[i].height);
        } else if (entities[i].name == "laser") {
            ctx.beginPath();
            ctx.moveTo(player.x + player.width/2,player.y + player.height/2);
            var angle = Math.atan2((entities[i].speedy),(entities[i].speedx));
            var offScreenLength = canvas.width + canvas.height;
            var offscreenX = Math.cos(angle) * offScreenLength + player.x;
            var offscreenY = Math.sin(angle) * offScreenLength +player.y;
            ctx.lineTo(offscreenX,offscreenY);
            ctx.lineWidth = entities[i].width;
            ctx.strokeStyle = "blue";
            ctx.stroke();
        } else {
            var translatex = entities[i].x + entities[i].width/2;
            var translatey = entities[i].y + entities[i].height/2;
            ctx.save();
            ctx.translate(translatex,translatey);
            ctx.rotate(entities[i].imageAngle);
            ctx.translate(-translatex,-translatey);
            ctx.drawImage(entities[i].image, entities[i].x, entities[i].y, entities[i].width, entities[i].height);
            ctx.restore();
        }
    }
    if (paused) {
        ctx.beginPath();
        ctx.fillStyle = "red";
        ctx.font = "70px Arial";
        ctx.fillText("Game Over",300,200);
        ctx.stroke();
        return;
    }
    if (displayLevelText) {    
        ctx.beginPath();
        ctx.fillStyle = "red";
        ctx.font = "70px Arial";
        ctx.fillText("Level " + (level + 1),300,200);
        ctx.stroke();
    }
    
}
function moveEntities(mod) {
    homingTimer += mod;
    var shouldFindTarget = false;
    if (homingTimer >= homingTimerConstant) {
        shouldFindTarget = true;
        homingTimer = 0;
    }
    for (var i = 0; i<entities.length; i++) {
        if (entities[i].homing) {
            if (shouldFindTarget) {
                findClosestEnemy(entities[i]);
            }
            chaseTarget(entities[i]);
        }
    }
    for (var i = 0; i<entities.length; i++){
        entities[i].x += entities[i].speedx * mod
        entities[i].y += entities[i].speedy * mod
    }
}
function chaseTarget(entity) {
    if (entity.closestTarget) {    
        var angle = Math.atan2((entity.y - entity.closestTarget.y),(entity.x - entity.closestTarget.x));
        entity.speedy = Math.sin(angle) * -1000;
        entity.speedx = Math.cos(angle) * -1000;
        if (entity.closestTarget.collision) {
            entity.collision = true;
        }
    }
}
function findClosestEnemy(entity) {
    if (!closestEntity) {    
        var closestEntityDistance = Number.MAX_VALUE;
        var closestEntity;
        for (var i = 0; i<entities.length; i++) {
            if (entity != entities[i] && !entities[i].friendly && !entities[i].targeted) {
                //find distance to other entity
                var dist = distanceBetween(entity,entities[i]);
                console.log(closestEntityDistance);
                if (!closestEntityDistance || dist < closestEntityDistance) {
                    closestEntityDistance = dist;
                    closestEntity = entities[i];
                }
            }
        }
        if (closestEntity) {
            entity.closestTarget = closestEntity;
            entity.closestTarget.targeted = true;
        }
    }
}
function distanceBetween(e1,e2) {
    return Math.sqrt(Math.pow(e1.x - e2.x,2) + Math.pow(e1.y - e2.y,2)); //tentative
}
function rotateSprites() {
    for (var i = 0; i < entities.length; i++) {
        if (!entities[i].imageAngle || entities[i].speedx != 0 || entities[i].speedy != 0) {
            entities[i].imageAngle = Math.atan2(entities[i].speedy,entities[i].speedx);
        }
    }
}
function handleKeys(mod) {
    
    if (37 in keysDown || 65 in keysDown) { //left
        //player.x -= player.speed * mod; 
        player.speedx = -player.speed;
    }
    if (38 in keysDown || 87 in keysDown) { //up
        //player.y -= player.speed * mod;
        player.speedy = -player.speed;
    }
    if (39 in keysDown || 68 in keysDown) { //right
        //player.x += player.speed * mod;
        player.speedx = player.speed;
    }
    if (40 in keysDown || 83 in keysDown) { //down
        //player.y += player.speed * mod;    
        player.speedy = player.speed;
    }
    if (37 in keysUp || 65 in keysUp) { //left keyUp
        //player.x -= player.speed * mod; 
        player.speedx = 0;
    }
    if (38 in keysUp || 87 in keysUp) { //up keyUP
        //player.y -= player.speed * mod;
        player.speedy = 0;
    }
    if (39 in keysUp || 68 in keysUp) { //right keyUp
        //player.x += player.speed * mod;
        player.speedx = 0;
    }
    if (40 in keysUp || 83 in keysUp) { //down keyUp
        //player.y += player.speed * mod;    
        player.speedy = 0;
    }
    
    if (32 in keysUp)  { // space key
        if (killStreakActive) {
            shootRocket();
        }
    }
    
    
    if (187 in keysUp) { // equals sign (dev code)
        spawnInterval = spawnInterval/5;
    }
    if (189 in keysUp) { // minus sign (dev code)
        spawnInterval = spawnInterval * 2;
    } 
    if (48 in keysDown) { // 0 (dev code)
        spawnInterval = spawnIntervalInitial;
    }
    if (13 in keysDown) { // enter (dev code)
        paused = true;
    }
     if (16 in keysDown) { // shift (dev code)
        killStreak = 0;
    }
    keysUp = {};
}
function keepPlayerInsideBounds() {
    if (player.x < 0) {
        player.x = 0;
    }
    if (player.x + player.width > canvas.width) {
        player.x = canvas.width - player.width;
    }
    if (player.y < 0) {
        player.y = 0;
    }
    if (player.y + player.height > canvas.height) {
        player.y = canvas.height - player.height;
    }
}
function collectTrash() {
    for (var i = 0; i < entities.length; i++) {
        if (!isInCanvas(entities[i])) {
            entities[i].collision = true;       
        }
    }
}
function isInCanvas(entity) {
        return (entity.x < canvas.width &&
        entity.x + entity.width > 0 &&
        entity.y < canvas.height &&
        entity.height + entity.y > 0)
}
function collision() {
    for (var i = 0; i < entities.length; i++) {
        for (var j = 0; j < entities.length; j++) {
            if (i != j) {
                if (entities[i].x < entities[j].x + entities[j].width &&
                    entities[i].x + entities[i].width > entities[j].x &&
                    entities[i].y < entities[j].y + entities[j].height &&
                    entities[i].height + entities[i].y > entities[j].y) {
                    if (entities[i].friendly !== entities[j].friendly) {
                        if (!entities[i].pierce) {
                            entities[i].collision = true
                        }
                        if (!entities[j].pierce) {
                            if (entities[j].scoreAdd) {
                                score ++;
                                if (killStreakActive == false) {
                                    killCounter += 1;
                                }
                            }   
                        }    
                    }
                }
            }
        }
    }
}
function removeCollided() {
    for (var i = 0; i < entities.length; i++) {    
        if (entities[i].collision) {
            if (entities[i] == player) {
                gameOver();
            } else {
                entities.splice(i,1);
                i--;
            }
        }
    }
}
function gameOver() {
    if (invincibility) {
        return;
    }
    paused = true;
}
function makeLaser(angle) {
    var laser = makeBullet(angle,25,25);
    laser.name = "laser";
    laser.speedx = laser.speedx * 10;
    laser.speedy = laser.speedy * 10;
    laser.pierce = true;
    laser.imageName = "sarkozy.jpg";
    return laser;
}
function shoot(x,y,x2,y2) {
    var angle = Math.atan2((y-y2),(x-x2));
    var bullet = makeBullet(angle,25,7);
    var laser = makeLaser(angle);
    
    if (killStreakActive) {
        addEntity(laser);
        setTimeout(function(){killStreakActive = false}, 7000);
    } else {
        addEntity(bullet);
    }
};
function shootRocket() {
    var rocket =  makeRocket();
    addEntity(rocket);
};
function makeRocket() {
    var rocket = makeBullet(0,25,15);
    rocket.homing = true;
    rocket.imageName = "missile.png";
    findClosestEnemy(rocket);
    return rocket;
}
function makeBullet(angle,width,height) {
    var bullet = {  
        x: player.x - width/2 + player.width/2,  //bullet center at player center 
        y: player.y - height/2 + player.height/2, // same thing
        width: width,
        height: height,
        color: '#f9e',
        friendly: true,
        imageName: "bulletWithTail.png",
        speedx: Math.cos(angle) * 1400,
        speedy: Math.sin(angle) * 1400,
    };

    return bullet;
}    
function makeEnemy() {
    var enemy = {    
        y: 0,
        x: 0,
        width: 50,
        height: 50,
        speed: 200,
        speedx: 100,
        speedy: 100,
        color: '#d34',
        friendly: false,
        imageName: "galagaship.png",
        scoreAdd: true,
    }  
    return enemy;
}
function spawnEnemy() {
    if (paused) {
        return;
    }
    var enemy = makeEnemy();
    var chooseSide = Math.floor((Math.random() * 4) + 1);
    switch (chooseSide) {
        case 1:                                                         // top
            enemy.x = Math.floor((Math.random() * canvas.width));
            enemy.y = -enemy.height;
            enemy.speedx = 0;
            enemy.speedy = 400;
        break;
        case 2:                                                         // left
            enemy.x = -enemy.width;
            enemy.y = Math.floor((Math.random() * canvas.height));
            enemy.speedx = 400;
            enemy.speedy = 0;
        break;
        case 3:                                                         // right
            enemy.x = canvas.width;
            enemy.y = Math.floor((Math.random() * canvas.height));
            enemy.speedx = -400;
            enemy.speedy = 0;
        break;
        case 4:                                                         // bottom
            enemy.x = Math.floor((Math.random() * canvas.width));
            enemy.y = canvas.height;
            enemy.speedx = 0;
            enemy.speedy = -400;
        break;    
    }
    addEntity(enemy);
    enemyCount++;
    console.log(enemyCount);
    if (enemyCount >= limit[0]) {
        limit.shift();
        levelChange = true;
    }
}
function addEntity(entity) {
    makeImage(entity);
    entities.push(entity);
}
function makeImage(entity) {
    if (imageMap[entity.imageName]) {
        entity.image = imageMap[entity.imageName];
    } else {
        entity.image = new Image(entity.width, entity.height);
        entity.image.src = entity.imageName;
        imageMap[entity.imageName] = entity.image;
    }    
}
function spawnTimer() {
    if (!levelChange) {
        spawnEnemy();
        setTimeout(spawnTimer, spawnInterval);
    } else {
        displayLevelText = true;
        setTimeout(resetSpawnTimer,LEVEL_CHANGE_DURATION);        
    }   
}
function resetSpawnTimer() {
    displayLevelText = false;
    levelChange = false;
    enemyCount = 0;
    level++;
    increaseDifficulty(0.9);
    spawnTimer();
}
function increaseDifficulty(n) {
    spawnInterval = spawnInterval * n;
}
function init_() {
    console.log(canvas.width, canvas.height);
    addEntity(player);
    
    spawnTimer();
    //setInterval(increaseDifficulty,increaseDifficultyTimer);
    setInterval(run, runInterval);
    
    document.body.style.cursor = 'crosshair';
    
    canvas.addEventListener("mousedown", false);
    canvas.addEventListener('click', function(e) {
        var bodyRect = document.body.getBoundingClientRect();
        var canvasRect = canvas.getBoundingClientRect();
        var canvasOffsetY = canvasRect.top;
        var canvasOffsetX = canvasRect.left;
        console.log(canvasRect.top);
        console.log(canvasRect.left);
        var pos = {
           x : e.pageX - canvasOffsetX,
           y : e.pageY - canvasOffsetY
        };
        shoot(pos.x,pos.y,player.x + player.width/2,player.y + player.height/2)
    }, false);

    window.addEventListener('keydown', function(e) {
        keysDown[e.keyCode] = true;
    });
    window.addEventListener('keyup', function(e) {
        delete keysDown[e.keyCode];
        keysUp[e.keyCode] = true;
    });
}
init_();