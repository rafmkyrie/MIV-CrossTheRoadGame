
// Paramètres de configuration 
const GAME_WIDTH = 192;
const GAME_HEIGHT = 576;
const CAMERA_WIDTH = GAME_WIDTH;
const CAMERA_HEIGHT = 192;

var config = {
    type: Phaser.AUTO,
    width: CAMERA_WIDTH,
    height: CAMERA_HEIGHT,
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },
    scale: {
        zoom: 3
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);
let player;
let ObjectLayer;
let CarsLayer;
let TrainLayer;
let cars;
let cursors;
let coins, lingots, trains;
let camera;
let text, coinScore;
let keyUp, keyDown, keyRight, keyLeft;
const CARS_SPEED = 50;
const TRAIN_SPEED = 400;
var horn = false;
var audio_background;


function preload() {
    // Image layers from Tiled can't be exported to Phaser 3 (as yet)
    // Load the tileset image file, needed for the map to know what
    // tiles to draw on the screen
    this.load.image('gameTiles', 'assets/images/tiles.png');
    this.load.image('gameTiles2', 'assets/images/tiles2.png');
    // Load the export Tiled JSON
    this.load.tilemapTiledJSON('map', 'assets/tilemaps/map1.json');
    this.load.image('pieces', 'assets/images/pieces.png');
    this.load.image('lingots', 'assets/images/lingots.png');
    this.load.image('VoitureGrise', 'assets/images/voiture_grise.png');
    this.load.image('VoitureVerte', 'assets/images/voiture_verte.png');
    this.load.image('VoitureRouge', 'assets/images/voiture_rouge.png');
    this.load.image('Train', 'assets/images/train.png');
    this.load.image('gameover', 'assets/images/gameover.png')

    // Audio
    this.load.audio("background", ["assets/audio/background.mp3"]);
    this.load.audio("ding", ["assets/audio/ding.wav"]);
    this.load.audio("hit", ["assets/audio/hit.wav"]);
    this.load.audio("train_horn", ["assets/audio/train_horn.mp3"]);

    // Load player animations from the player spritesheet and atlas JSON
    this.load.spritesheet('player', 'assets/images/GirlDarkExample.png', { frameWidth: 40, frameHeight: 40 });
    

}

function collectCoin(player, coin) {
    coin.destroy(coin.x, coin.y); // remove the tile/coin
    coinScore += 20; // increment the score
    text.setText(`Coins: ${coinScore}x`); // set the text to show the current score
    this.sound.play("ding");
    return false;
}

function collectLingot(player, lingot){

}

function gameOver(player, cars){
    //let gameOverText = this.add.text(0, player.y, 'GAME\nOVER', { fontSize: '64px', fill: '#fff' });

    audio_background.stop();
    this.sound.play("hit");
    this.scene.restart();
    //this.scene.start('GameOverScene')
    //this.scene.pause();
    //let img = this.add.image(0, 0, 'gameover');  
}

function create(){

    // creating map
    const map = this.make.tilemap({key: 'map'});
    const tileset = map.addTilesetImage('tilesetsheet', 'gameTiles', 16, 16, 0, 1);
    const tileset2 = map.addTilesetImage('tiles2', 'gameTiles2', 16, 16, 0, 1);

    // add layers
    const FondLayer = map.createLayer("Fond", tileset);
    const FondLayer2 = map.createLayer("Fond2", tileset);
    const RoutesLayer = map.createLayer("Routes", tileset2);
    const CollisionLayer = map.createLayer("Collision", tileset);
    CollisionLayer.setCollisionByProperty({ collides: true });
    map.setCollisionBetween(1, 2000, true, 'Collision');

    ObjectLayer = map.getObjectLayer('Objets')['objects'];
    CarsLayer = map.getObjectLayer('Voitures')['objects'];
    TrainLayer = map.getObjectLayer('Train')['objects'];
    
     //create player
    
    // placer le player à la position de départ
    var result = map.findObject("Objets", obj => obj.type === "playerStart");
    player = this.physics.add.sprite(result.x, result.y - 2/3*40, 'player');
    player.setScale(1/2, 1/2);  
    cursors = this.input.keyboard.createCursorKeys();

    // Caméra
    camera = this.cameras.main;
    camera.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);
    

    // Affichage des objets
    coins = this.physics.add.staticGroup();
    lingots = this.physics.add.staticGroup();
    ObjectLayer.forEach(object => {
        switch(object.type){
            case "pieces": 
                coins.create(object.x + 8, object.y - 8, "pieces");
                break;
            case "lingot":
                lingots.create(object.x + 8, object.y - 8, "lingots");
                break;
        }
    });

    cars = [];
    CarsLayer.forEach(object => {
        cars.push(this.physics.add.sprite(object.x, object.y - 18, object.type));
    });

    cars.forEach(object =>{
        switch(object.texture.key){
            case "VoitureGrise":
                object.body.velocity.x = CARS_SPEED; break;
            case "VoitureVerte":
                object.body.velocity.x = -CARS_SPEED; break;
            case "VoitureRouge":
                object.body.velocity.x = -CARS_SPEED; break;
        }
    })

    trains = [];
    TrainLayer.forEach(object => {
        var train = this.physics.add.sprite(object.x, object.y-10, "Train");
        trains.push(train);
        train.body.velocity.x = TRAIN_SPEED;
    });

    coinScore = 0;
    // text score
    text = this.add.text(7, 7, `Coins: ${coinScore}`, {
        fontFamily: 'HAMLIN',
        fontSize: '12px',
        fill: '#ffffff',
        stroke: 5
      });
      text.setScrollFactor(0);






    //player.setCollideWorldBounds(true);
    this.physics.add.overlap(player, coins, collectCoin, null, this);
    this.physics.add.overlap(player, lingots, collectLingot, null, this);
    this.physics.add.collider(player, cars, gameOver, null, this);
    this.physics.add.collider(player, trains, gameOver, null, this);
    this.physics.add.collider(player, CollisionLayer);

    /*
    // Turn on physics debugging to show player's hitbox
    this.physics.world.createDebugGraphic();

    // Create collision graphic above the player, but below the help text
    const graphics = this.add
      .graphics()
      .setAlpha(0.75)
      .setDepth(20);
      CollisionLayer.renderDebug(graphics, {
      tileColor: null, // Color of non-colliding tiles
      collidingTileColor: new Phaser.Display.Color(243, 134, 48, 255), // Color of colliding tiles
      faceColor: new Phaser.Display.Color(40, 39, 37, 255) // Color of colliding face edges
    });*/
    
    // Animation Player

    this.anims.create({
        key: "runUp",
        frameRate: 7,
        frames: this.anims.generateFrameNumbers("player", { start: 6, end: 8 }),
        repeat: 0
    });

    this.anims.create({
        key: "runDown",
        frameRate: 7,
        frames: this.anims.generateFrameNumbers("player", { start: 0, end: 2 }),
        repeat: 0
    });

    this.anims.create({
        key: "runRight",
        frameRate: 7,
        frames: this.anims.generateFrameNumbers("player", { start: 3, end: 5 }),
        repeat: 0
    });

    this.anims.create({
        key: "runLeft",
        frameRate: 7,
        frames: this.anims.generateFrameNumbers("player", { start: 9, end: 11 }),
        repeat: 0
    });

    // Son du jeu
    audio_background = this.sound.add("background");
    audio_background.setLoop(true);
    audio_background.play();
    
}

function update(time, delta){
    //player movement
    
    
    
    player.body.velocity.y = 0;
    player.body.velocity.x = 0;
 
    if(cursors.up.isDown && player.y - 9 > 0) {
      player.body.velocity.y -= 50;
      player.anims.play("runUp", true);
    }
    else if(cursors.down.isDown && player.y + 9 < GAME_HEIGHT ) {
      player.body.velocity.y += 50;
      player.anims.play("runDown", true);
    }
    if(cursors.left.isDown && player.x - 9 > 0) {
      player.body.velocity.x -= 50;
      player.anims.play("runLeft", true);
    }
    else if(cursors.right.isDown && player.x + 9 < GAME_WIDTH) {
      player.body.velocity.x += 50;
      player.anims.play("runRight", true);
    }




    // repositionnement des Voitures 
    cars.forEach(object =>{
        switch(object.texture.key){
            case "VoitureGrise":
                if(object.x >= GAME_WIDTH + 50){
                    object.x = -50;
                }
                break;
            case "VoitureVerte":
                if(object.x <= -50){
                    object.x = GAME_WIDTH + 50;
                }
                break;
            case "VoitureRouge":
                if(object.x <= -50){
                    object.x = GAME_WIDTH + 50;
                }
                break;
        }
    })

    if(trains[0].x > GAME_WIDTH * 2){
        trains[0].x = -2500;
        trains[1].x = trains[0].x - trains[0].width + 20;
        horn = true;
    }
    else{
        if(horn && trains[0].x > -500){
            horn = false;
            this.sound.play("train_horn");
        }
    }

    camera.centerOn(player.x, player.y);     // Centrage de la caméra sur le player
}








/*
NOTE POUR FUTUR TOI :
- Crée un deuxième niveau et connecte les entre eux dans les deux sens
- Crée un petit menu, bon courage pour te rappeller de toutes les fonctions
*/