import EntranceScene from './scenes/entrance.js';
import Floor1Scene from './scenes/floor_1.js';
import Floor2Scene from './scenes/floor_2.js';
import Floor3Scene from './scenes/floor_3.js';
import Floor4Scene from './scenes/floor_4.js';

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 0 },
    debug: true,
    debugShowStaticBody: true }
    },
    // Registering scenes in order. EntranceScene is the first one that runs.
    scene: [
        EntranceScene,
        Floor1Scene,
        Floor2Scene,
        Floor3Scene,
        Floor4Scene
    ]
};

const game = new Phaser.Game(config);