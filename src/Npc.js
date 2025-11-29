// src/Npc.js

/**
 * Represents a single Non-Player Character (NPC) in the game.
 * NPCs are stationary sprites that can be interacted with.
 */
export default class Npc extends Phaser.Physics.Arcade.Sprite {
    /**
     * @param {Phaser.Scene} scene The scene the NPC belongs to.
     * @param {number} x The x position in the map.
     * @param {number} y The y position in the map.
     * @param {string} texture The key for the sprite texture (e.g., 'player_atlas').
     * @param {string} frame The initial frame for the sprite.
     * @param {object} dialogueData The full NPC object containing dialogue, name, etc., fetched from the database.
     */
    constructor(scene, x, y, texture, frame, dialogueData) {
        super(scene, x, y, texture, frame);

        // Save the dialogue data fetched from the database
        this.dialogueData = dialogueData;

        // Add the NPC to the scene's display list and update list
        scene.add.existing(this);

        // Add the NPC to the scene's physics system
        scene.physics.world.enable(this);

        // Make the NPC stationary (no gravity, can't move)
        this.body.setImmovable(true);
        this.body.setCollideWorldBounds(true);
    }

    // You can add more specific NPC behavior here later, like:
    // - Simple idle animations (e.g., this.play('npc-idle'))
    // - Logic for having the NPC face the player during dialogue
    // - Pathfinding or movement logic (if they weren't stationary)
}