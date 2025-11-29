// src/scenes/Floor2Scene.js
// Scene for Floor 2, featuring 2 unique NPCs.

import BaseScene from '../BaseScene.js';

export default class Floor2Scene extends BaseScene {
    constructor() {
        // Scene Key, Map Key (e.g., floor_2.json), Tileset Keys
        super('Floor2Scene', 'map_floor_2', ['main_tileset', '2nd_main_tileset', 'furnitures']);
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
        // BaseScene.create() will automatically fetch the 2 NPCs for this scene.
        super.create();
        console.log("Exploring Floor 2 (2 NPCs).");
    }
}