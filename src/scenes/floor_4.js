// src/scenes/Floor4Scene.js
// Scene for Floor 4, featuring 1 unique NPC.

import BaseScene from '../BaseScene.js';

export default class Floor4Scene extends BaseScene {
    constructor() {
        // Scene Key, Map Key (e.g., floor_4.json), Tileset Keys
        super('Floor4Scene', 'map_floor_4', ['main_tileset', '2nd_main_tileset', 'furnitures']);
    }

    preload() {
        super.preload(); // Loads player sprite and map JSON
        
        // --- 🧱 TILESHEET IMAGES (Must be loaded here) ---
        this.load.image('main_tileset', 'assets/images/main_tileset.png'); 
        this.load.image('2nd_main_tileset', 'assets/images/2nd_main_tileset.png'); 
        this.load.image('furnitures', 'assets/images/furnitures.png'); 
        // Add any other floor-specific assets here
    }

    create() {
        // BaseScene.create() will automatically fetch the 1 NPC for this scene.
        super.create();
        console.log("Exploring Floor 4 (1 NPC).");
    }
}