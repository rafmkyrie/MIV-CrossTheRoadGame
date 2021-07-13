// Initialisation des dimensions
const GAME_WIDTH = 192;
const GAME_HEIGHT = 576;
const CAMERA_WIDTH = GAME_WIDTH;
const CAMERA_HEIGHT = 192;

// Création des scènes du jeu
let map1Scene = new Phaser.Scene('SceneLevel1');
let map2Scene = new Phaser.Scene('SceneLevel2');
let MenuScene = new Phaser.Scene('SceneB');

// Paramètres de configuration Phaser
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
    scene: [MenuScene, map1Scene, map2Scene]
};

// Création de l'objet du jeu
const game = new Phaser.Game(config);

// Initialisation des scores
let coinScore = 0;
let currentLevelScore = 0;



// ##############     SCENE MENU        ####################################################

let show = true;    // variable de controle d'affichage du texte
var playText;       // variable contenant l'objet texte à afficher

MenuScene.preload = function(){
    // Chargement de l'image du menu
    this.load.image('menu', 'assets/images/menu.png')
}

MenuScene.create = function(){
    this.add.image(192/2, 192/2, "menu");       //  Ajout de l'image de fond 
    this.add.text(192/4, 192/4, "Cross the\nRoad", {        // Ajout du nom du jeu
        fontFamily: 'HAMLIN',
        fontSize: '26px',
        fill: '#ffffff',
        stroke: 5,
        align: 'center'
      });

    playText = this.add.text(192/4, 1.8*192/3, "Press Enter to start\nthe game!", {   // Ajout du texte pour lancer le jeu
        fontFamily: 'Calibri',
        fontSize: '12px',
        fill: '#ffffff',
        stroke: 0.5,
        align: 'center'
    });
    
    // Variable & Fonction pour l'animation du texte (Effet disparition et réapparition du texte)
    var drawPlayInterval = setInterval(showPlay, 500);

    function showPlay(){
        show = !show;
    }
    

    
    // Ecouteur de la touche Entrer pour lancer le jeu
    addEventListener("keydown", enterPressed);  
    function enterPressed(e){
        /* Ecouteur d'événements des touches du clavier */
        if(e.keyCode == 13){
            clearInterval(drawPlayInterval);
            game.scene.start('SceneLevel1');
            removeEventListener("keydown", enterPressed);
        }
    }
}

MenuScene.update = function(){
    // Animation du texte
    playText.setVisible(show);
}






// #####    FONCTIONS DE JEU            ###############################################################


function collectCoin(player, coin) {
    /* Fonction qui s'exécute lorsque le joueur touche une pièce */

    coin.destroy(coin.x, coin.y);   // Faire disparaître la pièce
    coinScore += 20;    // Incrémenter le score
    currentLevelScore += 20;
    text.setText(`Coins: ${coinScore}x`);    // Met à jour l'affichage du score
    this.sound.play("ding");     // Joue le son de la collecte
    return false;
}

function collectLingot(){
    /* Fonction qui s'exécute lorsque le joueur touche un lingot (Fin du niveau) */

    this.game.sound.stopAll();      // Stoppe tous les sons
    coinScore += 150;   // Incrémenter le score
    this.sound.play("ding");   // Joue le son de la collecte

    if(this.scene.key == 'SceneLevel1')      // Si le niveau actuel est le niveau 1 :
        this.scene.start('SceneLevel2');     // Lancer le niveau 2
    else{
        if(this.scene.key == 'SceneLevel2')     // Si le niveau actuel est le niveau 2 :
            this.scene.start('SceneLevel1');    // Relancer le niveau 1 (une fois implémenté, c'est le niveau 3 qui se lancera ici)
    }
}

function hitPlayerVehicle(){
    /* Fonction qui s'exécute lorsqu'il y a collision entre le joueur et un véhicule */
    this.game.sound.stopAll();  // Stoppe tous les sons
    this.sound.play("hit");     // Joue le son de la collision
    coinScore = coinScore - currentLevelScore;      // Réajuster le score
    currentLevelScore = 0;
    
    // Effet de tremblement
    this.cameras.main.shake(500);
 
    // Effet de fondu
    this.time.delayedCall(250, function() {
        this.cameras.main.fade(250);
    }, [], this);
 
    // Relance la scène
    this.time.delayedCall(500, function() {
        this.scene.restart();
    }, [], this); 
}
  

function randomInt(min, max) { 
    /* Fonction qui retourne un entier aléatoire en min et max, utilisée pour générer la vitesse des voitures */
    return Math.floor(Math.random() * (max - min + 1) + min)
  }
  


// Variable des scènes de jeu
let player;
let ObjectLayer;
let CarsLayer;
let TrainLayer;
let cars;
let cursors;
let coins, lingots, trains;
let camera;
let text;
let keyUp, keyDown, keyRight, keyLeft;
var horn = false;


/* #######   SCENE NIVEAU 1    ###############################################################################  */

var audio_background;

// Vitesse des véhicules
var CARS_SPEED;
var TRAIN_SPEED = 400;


map1Scene.preload = function() {
    
    // Chargement des Tilesets
    this.load.image('gameTiles', 'assets/images/tiles.png');
    this.load.image('gameTiles2', 'assets/images/tiles2.png');

    // Chargement de la map Tiled JSON
    this.load.tilemapTiledJSON('map', 'assets/tilemaps/map1.json');

    // Chargement des ressources Images
    this.load.image('pieces', 'assets/images/pieces.png');
    this.load.image('lingots', 'assets/images/lingots.png');
    this.load.image('VoitureGrise', 'assets/images/voiture_grise.png');
    this.load.image('VoitureVerte', 'assets/images/voiture_verte.png');
    this.load.image('VoitureRouge', 'assets/images/voiture_rouge.png');
    this.load.image('Train', 'assets/images/train.png');

    // Chargement des ressources Audio
    this.load.audio("background", ["assets/audio/background.mp3"]);
    this.load.audio("ding", ["assets/audio/ding.wav"]);
    this.load.audio("hit", ["assets/audio/hit.wav"]);
    this.load.audio("train_horn", ["assets/audio/train_horn.mp3"]);

    // Chargement de la spritesheet du Joueur
    this.load.spritesheet('player', 'assets/images/george.png', { frameWidth: 40, frameHeight: 40 });
}

map1Scene.create = function(){

    // Création de la map
    const map = this.make.tilemap({key: 'map'});
    const tileset = map.addTilesetImage('tilesetsheet', 'gameTiles', 16, 16, 0, 1);
    const tileset2 = map.addTilesetImage('tiles2', 'gameTiles2', 16, 16, 0, 1);

    // Ajout des couches de la map
    const FondLayer = map.createLayer("Fond", tileset);
    const FondLayer2 = map.createLayer("Fond2", tileset);
    const RoutesLayer = map.createLayer("Routes", tileset2);
    const CollisionLayer = map.createLayer("Collision", tileset);

    // Ajout de la propriété de collision aux objets de la couche Collision
    CollisionLayer.setCollisionByProperty({ collides: true });   
    map.setCollisionBetween(1, 2000, true, 'Collision');

    // Chargement des couches Objets
    ObjectLayer = map.getObjectLayer('Objets')['objects'];
    CarsLayer = map.getObjectLayer('Voitures')['objects'];
    TrainLayer = map.getObjectLayer('Train')['objects'];
    
     
    
    // Récupérer la position de départ du joueur
    var result = map.findObject("Objets", obj => obj.type === "playerStart");

    // Création du joueur à la position de départ
    player = this.physics.add.sprite(result.x, result.y - 2/3*40, 'player');
    player.setScale(1/2, 1/2);  

    // Création des touches de Contrôle du joueur
    cursors = this.input.keyboard.createCursorKeys();

    // Création de la Caméra
    camera = this.cameras.main;
    camera.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);
    

    // Affichage des objets pièces et lingots
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

    // Affichage + Ajout de la physique des voitures
    CARS_SPEED = randomInt(40, 75);   // Vitesse des voitures aléatoire 

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

    // Affichage + Ajout de la physique des trains
    trains = [];
    TrainLayer.forEach(object => {
        var train = this.physics.add.sprite(object.x, object.y-10, "Train");
        trains.push(train);
        train.body.velocity.x = TRAIN_SPEED;
    });

    currentLevelScore = 0;   // Initialisation du score du niveau actuel

    // Ajout du texte du score
    text = this.add.text(7, 7, `Coins: ${coinScore}`, {
        fontFamily: 'HAMLIN',
        fontSize: '100px',
        fill: '#ffffff',
        stroke: 5
      });
    text.setScale(0.14);
    text.setScrollFactor(0);


    
    // Ajout de la physique du jeu 
    this.physics.add.overlap(player, coins, collectCoin, null, this);    // Ajout de la physique du recouvrement Joueur - Pièces
    this.physics.add.overlap(player, lingots, collectLingot, null, this);  // Ajout de la physique du recouvrement Joueur - Lingots
    this.physics.add.collider(player, cars, hitPlayerVehicle, null, this);      // Ajout de la physique de collision Joueur - Voitures
    this.physics.add.collider(player, trains, hitPlayerVehicle, null, this);    // Ajout de la physique de collision Joueur - Trains
    this.physics.add.collider(player, CollisionLayer);                  // Ajout de la physique de collision Joueur - couche Collision

    
    // Création des animations de déplacement du joueur
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


map1Scene.update = function(){
    
    // Mise à jour du mouvement du joueur
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

    // repositionnement des Trains
    if(trains[0].x > GAME_WIDTH * 2){
        trains[0].x = -2500;
        trains[1].x = trains[0].x - trains[0].width + 20;
        horn = true;
    }
    else{
        if(horn && trains[0].x > -500){
            horn = false;
            this.sound.play("train_horn");    // Lancer le son du train lorsqu'il approche
        }
    }

    camera.centerOn(player.x, player.y);     // Centrage de la caméra sur le joueur
}







//         MAP 2        ##########################################################################


map2Scene.preload = function() {

    // Chargement des Tilesets
    this.load.image('gameTiles', 'assets/images/tiles.png');
    this.load.image('gameTiles2', 'assets/images/tiles2.png');

    // Chargement de la map Tiled JSON
    this.load.tilemapTiledJSON('map2', 'assets/tilemaps/map2.json');

    // Chargement des ressources Images
    this.load.image('pieces', 'assets/images/pieces.png');
    this.load.image('lingots', 'assets/images/lingots.png');
    this.load.image('VoitureGrise', 'assets/images/voiture_grise.png');
    this.load.image('VoitureVerte', 'assets/images/voiture_verte.png');
    this.load.image('VoitureRouge', 'assets/images/voiture_rouge.png');
    this.load.image('Train', 'assets/images/train.png');

    // Chargement des ressources Audio
    this.load.audio("background", ["assets/audio/background.mp3"]);
    this.load.audio("ding", ["assets/audio/ding.wav"]);
    this.load.audio("hit", ["assets/audio/hit.wav"]);
    this.load.audio("train_horn", ["assets/audio/train_horn.mp3"]);

    // Chargement de la spritesheet du Joueur
    this.load.spritesheet('player', 'assets/images/george.png', { frameWidth: 40, frameHeight: 40 });
}


map2Scene.create = function(){
    
    // Création de la map
    const map = this.make.tilemap({key: 'map2'});
    const tileset = map.addTilesetImage('tiles', 'gameTiles', 16, 16, 0, 1);
    const tileset2 = map.addTilesetImage('tiles2', 'gameTiles2', 16, 16, 0, 1);

    // Ajout des couches de la map
    const FondLayer = map.createLayer("Fond", tileset);
    const FondLayer2 = map.createLayer("Fond2", tileset);
    const RoutesLayer = map.createLayer("Routes", tileset2);
    const CollisionLayer = map.createLayer("Collisions", tileset);
    const CollisionLayer2 = map.createLayer("Collisions2", tileset2);

    // Ajout de la propriété de collision aux objets des couches Collision
    CollisionLayer.setCollisionByProperty({ collides: true });
    CollisionLayer2.setCollisionByProperty({ collides: true });
    map.setCollisionBetween(1, 2000, true, 'Collisions');
    map.setCollisionBetween(1, 2000, true, 'Collisions2');

    // Chargement des couches Objets
    ObjectLayer = map.getObjectLayer('Objets')['objects'];
    CarsLayer = map.getObjectLayer('Voitures')['objects'];
    TrainLayer = map.getObjectLayer('Train')['objects'];


    // Récupérer la position de départ du joueur
    var result = map.findObject("Objets", obj => obj.type === "playerStart");
    
    // Création du joueur à la position de départ
    player = this.physics.add.sprite(result.x, result.y - 2/3*40, 'player');
    player.setScale(1/2, 1/2);  

    // Création des touches de Contrôle du joueur
    cursors = this.input.keyboard.createCursorKeys();

    // Création de la Caméra
    camera = this.cameras.main;
    camera.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);


    // Affichage des objets pièces et lingots
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

    // Affichage + Ajout de la physique des voitures
    CARS_SPEED = randomInt(40, 75);   // Vitesse des voitures aléatoire 

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

    // Affichage + Ajout de la physique des trains
    trains = [];
    TrainLayer.forEach(object => {
        var train = this.physics.add.sprite(object.x, object.y-10, "Train");
        train["typeTrain"] = object.type;
        trains.push(train);
    });

    trains.forEach(object =>{
        switch(object.typeTrain){
            case "Train1":
                object.body.velocity.x = TRAIN_SPEED; break;
            case "Train2":
                object.body.velocity.x = -TRAIN_SPEED; break;
        }
    });

    currentLevelScore = 0;   // Initialisation du score du niveau actuel

    // Ajout du texte du score
    text = this.add.text(7, 7, `Coins: ${coinScore}`, {
        fontFamily: 'HAMLIN',
        fontSize: '100px',
        fill: '#ffffff',
        stroke: 5
      });
    text.setScale(0.14);
    text.setScrollFactor(0);

    // Ajout de la physique du jeu 
    this.physics.add.overlap(player, coins, collectCoin, null, this);   // Ajout de la physique du recouvrement Joueur - Pièces
    this.physics.add.overlap(player, lingots, collectLingot, null, this);   // Ajout de la physique du recouvrement Joueur - Lingots
    this.physics.add.collider(player, cars, hitPlayerVehicle, null, this);          // Ajout de la physique de collision Joueur - Voitures
    this.physics.add.collider(player, trains, hitPlayerVehicle, null, this);        // Ajout de la physique de collision Joueur - Trains
    this.physics.add.collider(player, CollisionLayer);                      // Ajout de la physique de collision Joueur - couche Collision
    this.physics.add.collider(player, CollisionLayer2);                     // Ajout de la physique de collision Joueur - couche Collision2


    // Création des animations de déplacement du joueur
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

    console.log(trains);
    console.log(cars);  
}



map2Scene.update = function(){

    // Mise à jour du mouvement du joueur
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

    // repositionnement des Trains
    if(trains[0].x > GAME_WIDTH * 3){
        trains[0].x = -2500;
        trains[1].x = trains[0].x - trains[0].width + 20;
        horn = true;
    }
    else{
        if(horn && trains[0].x > -700){
            horn = false;
            this.sound.play("train_horn");      // Lancer le son du train lorsqu'il approche
        }
    }

    if(trains[2].x < -GAME_WIDTH * 3){
        trains[2].x = 2500 + trains[2].width;
        trains[3].x = trains[2].x - trains[2].width + 20;
        horn = true;
    }

    camera.centerOn(player.x, player.y);     // Centrage de la caméra sur le player
}
