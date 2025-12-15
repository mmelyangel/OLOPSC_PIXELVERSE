// src/scenes/EntranceScene.js

import BaseScene from '../BaseScene.js';

export default class EntranceScene extends BaseScene {
    constructor() {
        // Only set the unique map properties
        super('EntranceScene', 'map_entrance', ['main_tileset', '2nd_main_tileset', 'furnitures']);
    }

    preload() {
        super.preload(); // Loads player sprite and map JSON - THIS ALREADY LOADS THE PLAYER!
        
        // ---  TILESHEET IMAGES (Loading assets specific to this scene) ---
        this.load.image('main_tileset', 'assets/images/main_tileset.png'); 
        this.load.image('2nd_main_tileset', 'assets/images/2nd_main_tileset.png'); 
        this.load.image('furnitures', 'assets/images/furnitures.png'); 

        
    }

    create() {
        super.create();
        console.log("Welcome to the Entrance!");
        

    
        
        // 🏢 FLOOR INDICATOR
        this.createFloorIndicator('Ground Floor - Entrance');
    }

}
