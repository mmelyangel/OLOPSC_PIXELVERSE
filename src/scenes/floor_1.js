// src/scenes/Floor1Scene.js
// Scene for Floor 1, featuring 5 unique NPCs.

import BaseScene from '../BaseScene.js';

export default class Floor1Scene extends BaseScene {
    constructor() {
        // Scene Key, Map Key (e.g., floor_1.json), Tileset Keys
        super('Floor1Scene', 'map_floor_1', ['main_tileset', '2nd_main_tileset', 'furnitures']);
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
        // BaseScene.create() will automatically fetch the 5 NPCs for this scene 
        // using the 'Floor1Scene' key in its Supabase query.
        super.create();
        console.log("Exploring Floor 1 (5 NPCs).");
    }
}