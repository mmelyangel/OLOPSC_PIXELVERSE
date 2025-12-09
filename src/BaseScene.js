
import { supabase } from './supabaseClient.js';
import DialogueWindow from './DialogueWindow.js';

// Define the asset keys for clarity
const PLAYER_KEY = 'player';
const CUSTOM_NPC_KEY_KUYAGUARD = 'kuyaguard_img'; // A simple key for the custom image asset

export default class BaseScene extends Phaser.Scene {
    constructor(key, mapKey, tileKeys) {
        super(key);
        this.mapKey = mapKey;
        this.tileKeys = tileKeys;
        this.player = null;
        this.controls = null;
        this.map = null;
        this.transitionTriggers = null;
        this.target_x = null;
        this.target_y = null;
        this.PLAYER_SPEED = 100;

        // --- NEW CENTRALIZED DIALOGUE STATE ---
        this.npcs = []; // Array to hold all individual NPC sprites
        this.npcData = {}; // Store NPC dialogue data keyed by Tiled map_id
        this.isInteracting = false;
        this.dialogueWindow = null;
        this.interactKey = null;
        this.escKey = null; // New: For emergency exit from dialogue
        this.dialogueNodeKey = 'start'; // Current node key in the dialogue tree
        this.currentNpc = null; // The NPC sprite currently talking
        this.lastDirection = 'down'; // Track last direction for idle frame
    }

    init(data) {
        if (data && data.target_x !== undefined && data.target_y !== undefined) {
            this.target_x = data.target_x;
            this.target_y = data.target_y;
            console.log(`${this.scene.key} launched. Spawning player at: (${this.target_x}, ${this.target_y})`);
        } else {
            this.target_x = 540;
            this.target_y = 690;
        }
    }

    preload() {
        // --- 🧱 ASSETS LOADED FOR ALL SCENES ---

        // 1. Player Spritesheet (REVERTED TO ORIGINAL)
        this.load.spritesheet(PLAYER_KEY, window.ASSET_PATH + 'images/player-sprite.png', {
            frameWidth: 16,
            frameHeight: 16
        });

        // 2. Custom NPC Image Load (PATH CHECK)
        const assetPath = window.ASSET_PATH + 'images/kuyaguard.png';
        this.load.image(CUSTOM_NPC_KEY_KUYAGUARD, assetPath);
        console.log(`Attempting to load custom NPC image from: ${assetPath}`);

        // Load the Tiled map JSON (e.g., entrance.json)
        this.load.tilemapTiledJSON(this.mapKey, window.ASSET_PATH + 'maps/' + this.mapKey.replace('map_', '') + '.json');
    }

    create() {
        // Check Supabase before continuing
        if (!supabase) {
            console.error("Supabase client is not initialized. Check src/supabaseClient.js and ensure credentials is set.");
        }

        this.map = this.make.tilemap({ key: this.mapKey });

        // --- TILESET LOADING ---
        const tilesets = [];

        this.tileKeys.forEach(preloadKey => {
            const tileset = this.map.tilesets.find(t => t.name.toLowerCase() === preloadKey.toLowerCase());
            if (tileset) {
                const addedTileset = this.map.addTilesetImage(tileset.name, preloadKey);
                tilesets.push(addedTileset);
                console.log(`Successfully added tileset: ${tileset.name} using key ${preloadKey}`);
            } else {
                console.error(`ERROR: Tilemap is missing tileset named: "${preloadKey}". Check your Tiled export.`);
            }
        });

        if (tilesets.length === 0) {
            console.error("CRITICAL: No tilesets were loaded. Map rendering will fail.");
            return;
        }

        // --- LAYER CREATION ---
        // Layers should exist in the map JSON. Use the exact layer name from Tiled.
        this.map.createLayer('floor', tilesets);
        const wallsLayer = this.map.createLayer('walls', tilesets);
        const decorCollisionLayer = this.map.createLayer('decorwithcollision', tilesets);
        this.map.createLayer('decors', tilesets);

        // --- PLAYER SETUP ---
        this.player = this.physics.add.sprite(this.target_x, this.target_y, PLAYER_KEY, 0); // Using frame 0 for idle
        this.player.setCollideWorldBounds(true);
        this.player.setScale(2);
        this.player.body.setSize(12, 6);
        this.player.body.setOffset(2, 10);
        this.player.setDepth(10);
        // Player state for dialogue control
        this.player.isTalking = false;

        console.log(`Player sprite created at: (${this.player.x}, ${this.player.y}). All map layers should be underneath the player.`);

        // --- CAMERA and World Setup ---
        this.cameras.main.setZoom(2);
        this.cameras.main.roundPixels = true;
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

        this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

        // --- INPUTS & ANIMATIONS ---
        this.controls = this.input.keyboard.createCursorKeys();
        this.interactKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        this.createPlayerAnimations();

        // --- COLLISION ---
        this.setupCollisions(wallsLayer, decorCollisionLayer);

        // --- ASYNC DATA LOADING ---
        this.loadNpcData(); // Fetch dialogue data from Supabase, then spawn NPCs

        // --- TRANSITION SETUP ---
        this.createTransitionTriggers();
        this.physics.add.overlap(
            this.player,
            this.transitionTriggers,
            this.handleTransitionTrigger,
            null,
            this
        );

        // --- UI SETUP ---
        this.dialogueWindow = new DialogueWindow(this);
        
        // 🏢 FLOOR INDICATOR - Override this in child scenes!
        this.createFloorIndicator('1st Floor');
    }
    
    // 🏢 FLOOR INDICATOR METHOD
   createFloorIndicator(floorName) {
    // Make it HUGE and RED so you can see it!
    this.add.text(
        100, 50,  // Middle of screen
        floorName,
        {
            fontFamily: 'Arial, sans-serif',
            fontSize: '20px',    // HUGE
            color: '#ffffff',
            backgroundColor: '#ff0000',  // BRIGHT RED
            padding: { x: 15, y: 10 }
        }
    ).setOrigin(0.5, 0.5).setDepth(1000).setScrollFactor(0);
}

    createPlayerAnimations() {
        // Frame Index: Down (0-2), Up (3-5), Left (6-8), Right (9-11)
        if (this.anims.exists('walk-down')) return;

        this.anims.create({
            key: 'walk-down',
            frames: this.anims.generateFrameNumbers(PLAYER_KEY, { start: 0, end: 2 }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'walk-up',
            frames: this.anims.generateFrameNumbers(PLAYER_KEY, { start: 3, end: 5 }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'walk-left',
            frames: this.anims.generateFrameNumbers(PLAYER_KEY, { start: 6, end: 8 }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'walk-right',
            frames: this.anims.generateFrameNumbers(PLAYER_KEY, { start: 9, end: 11 }),
            frameRate: 10,
            repeat: -1
        });
    }

    // --- UTILITY FUNCTIONS ---

    setupCollisions(wallsLayer, decorCollisionLayer) {
        if (wallsLayer) {
            wallsLayer.setCollisionBetween(1, 9999);
            this.physics.add.collider(this.player, wallsLayer);
        }

        if (decorCollisionLayer) {
            decorCollisionLayer.setCollisionBetween(1, 9999);
            this.physics.add.collider(this.player, decorCollisionLayer);
        }
    }

    // ✅ FIXED METHOD - Using correct Phaser API
    createTransitionTriggers() {
        // Correct way to get object layer in Phaser
        const triggerLayer = this.map.getObjectLayer('teleports');

        if (!triggerLayer || !triggerLayer.objects) {
            console.log("No 'teleports' object layer found or layer is empty.");
            this.transitionTriggers = this.physics.add.staticGroup();
            return;
        }

        this.transitionTriggers = this.physics.add.staticGroup();

        triggerLayer.objects.forEach(obj => {
            const transitionTrigger = this.transitionTriggers.create(
                obj.x + obj.width * 0.5,
                obj.y + obj.height * 0.5
            );
            transitionTrigger.body.setSize(obj.width, obj.height);
            transitionTrigger.body.setOffset(-obj.width * 0.5, -obj.height * 0.5);

            if (obj.properties && obj.properties.length > 0) {
                obj.properties.forEach(prop => {
                    transitionTrigger.setData(prop.name, prop.value);
                });
            }

            transitionTrigger.body.updateFromGameObject();
        });
    }

    handleTransitionTrigger(player, trigger) {
        if (trigger.getData('target_scene')) {
            const nextSceneKey = trigger.getData('target_scene');

            const targetX = parseFloat(trigger.getData('target_x'));
            const targetY = parseFloat(trigger.getData('target_y'));

            this.scene.start(nextSceneKey, { target_x: targetX, target_y: targetY });
            console.log(`Transitioning to ${nextSceneKey} at (${targetX}, ${targetY})`);
        }
    }

    // --- NPC/DIALOGUE LOGIC ---

    
    async loadNpcData() {
        if (!supabase) return;

        // IMPORTANT: Ensure 'sprite_frame' is selected here to be available when creating sprites
        const { data, error } = await supabase
            .from('npcs')
            .select('map_id, name, dialogue, sprite_frame')
            .eq('scene_key', this.scene.key);

        if (error) {
            console.error('Error fetching NPC data:', error);
            return;
        }

        if (data && data.length > 0) {
            // Convert data array into an object keyed by Tiled map_id
            this.npcData = data.reduce((acc, npc) => {
                // Use Tiled Object ID (map_id) as the key. Convert to string for consistent lookup.
                acc[String(npc.map_id)] = {
                    name: npc.name,
                    dialogue: npc.dialogue,
                    sprite_frame: npc.sprite_frame // Store the frame name/number
                };
                return acc;
            }, {});
            console.log(`Loaded ${data.length} NPCs for ${this.scene.key}.`, this.npcData);

            this.createNpcSprites();
        } else {
            console.warn(`No NPC data found in Supabase for scene: ${this.scene.key}`);
        }
    }

    /**
     * ✅ FIXED METHOD - Spawns NPC sprites based on Tiled Object Layer data and fetched Supabase data.
     */
    createNpcSprites() {
        // Correct way to get object layer in Phaser
        const npcLayer = this.map.getObjectLayer('npcs');

        if (!npcLayer || !npcLayer.objects) {
            console.warn("Tiled map is missing 'NPCs' object layer or it's empty. No NPCs will spawn.");
            return;
        }

        const npcObjects = npcLayer.objects;

        // Clear previous NPCs array (important for scene restarts)
        this.npcs.forEach(npc => npc.destroy());
        this.npcs = [];

        // Create a separate group for collision only
        const npcCollisionGroup = this.physics.add.staticGroup();

        npcObjects.forEach(obj => {
            // Find the NPC data using the Tiled Object's ID, converted to string for reliable key lookup
            const dbNpc = this.npcData[String(obj.id)];

            if (dbNpc) {
                const spriteFrameValue = dbNpc.sprite_frame;

                let textureKey = PLAYER_KEY; // Default to player spritesheet
                let frameValue = 0; // Default to player idle frame

                // Check if the sprite_frame is our custom image file name
                if (spriteFrameValue === 'kuyaguard.png') {
                    textureKey = CUSTOM_NPC_KEY_KUYAGUARD; // 'kuyaguard_img'
                    frameValue = undefined; // Single image doesn't use a frame number
                } else {
                    // Otherwise, treat it as a frame index from the default player spritesheet
                    frameValue = parseInt(spriteFrameValue) || 0; // Ensures it's a number or defaults to 0
                    textureKey = PLAYER_KEY;
                }

                // Create the NPC sprite using the determined asset and frame
                const npc = this.physics.add.sprite(
                    obj.x + obj.width / 2,
                    obj.y + obj.height / 2,
                    textureKey,
                    frameValue
                );

                npc.setDepth(9);
                npc.setOrigin(0.5, 0.5);

                // Set scale based on whether it's a custom image or spritesheet
                if (textureKey === CUSTOM_NPC_KEY_KUYAGUARD) {
                    npc.setScale(0.2); // Adjust this for custom images (smaller)
                } else {
                    npc.setScale(2); // Match player scale for spritesheet NPCs
                }

                // Link data to sprite
                npc.setData('map_id', obj.id);
                npc.setData('name', dbNpc.name);
                // Renamed to 'dialogueTree' for clarity, as it holds the structured object
                npc.setData('dialogueTree', dbNpc.dialogue);

                // Setup collision body
                npc.body.setImmovable(true);
                // Adjust body size to better fit a person, even if the Tiled object is larger
                npc.body.setSize(20, 10).setOffset(-10, 30);

                // Add to both the physics group and the interaction array
                npcCollisionGroup.add(npc);
                this.npcs.push(npc);

                console.log(`Spawned NPC: ${npc.getData('name')} (ID: ${obj.id}) using asset: ${textureKey}`);
            } else {
                // This warning should now only happen if the Tiled ID is missing in the Supabase data
                console.warn(`Tiled Object ID: ${obj.id} found in map but missing in Supabase. NPC not spawned.`);
            }
        });

        // Add collision between player and NPC group
        this.physics.add.collider(this.player, npcCollisionGroup);
    }

    /**
     * Called by BaseScene.js's update() loop to handle NPC interaction.
     */
    handleInteraction() {
        // Only proceed if the interaction key was just pressed
        if (Phaser.Input.Keyboard.JustDown(this.interactKey)) {
            if (this.dialogueWindow.isVisible) {
                // 1. If dialogue is visible, handle input (e.g., choice selection or advancing text)
                this.handleDialogueInput();
                return;
            }

            // 2. If no dialogue is active, check proximity to NPCs
            const interactionDistance = 100; // Max distance for interaction
            const interactingNpc = this.npcs.find(npc => {
                return Phaser.Math.Distance.Between(this.player.x, this.player.y, npc.x, npc.y) < interactionDistance;
            });

            if (interactingNpc) {
                this.startDialogue(interactingNpc);
            }
        }
    }

    /**
     * Initializes the dialogue with an NPC.
     * @param {Phaser.Physics.Arcade.Sprite} npc - The NPC sprite the player is interacting with.
     */
    startDialogue(npc) {
        this.currentNpc = npc;
        this.player.isTalking = true; // Prevent player movement
        this.isInteracting = true; // Set interaction state

        // Start at the 'start' node of the dialogue tree
        this.dialogueNodeKey = 'start';

        // Stop player animation/movement instantly
        this.player.setVelocity(0);
        this.player.anims.stop();

        this.showDialogueNode(this.dialogueNodeKey);
    }

    /**
     * Handles key press when dialogue is visible. Advances text or processes choices.
     */
    handleDialogueInput() {
        const dialogueTree = this.currentNpc.getData('dialogueTree');
        if (!dialogueTree) return this.endDialogue();

        const currentNode = dialogueTree[this.dialogueNodeKey];

        if (!currentNode) {
            console.error(`Missing dialogue node: ${this.dialogueNodeKey}`);
            return this.endDialogue();
        }

        // --- Handle End Node ---
        if (this.dialogueNodeKey === 'end') {
            return this.endDialogue();
        }

        // --- Handle Single-Line Text / Next Button Press ---
        // If there is text, and a simple 'next' pointer, but NO choices, advance the node.
        if (currentNode.text && currentNode.next && !currentNode.choices) {
            this.dialogueNodeKey = currentNode.next;
            this.showDialogueNode(this.dialogueNodeKey);
            return;
        }

        // If the node has choices, we ignore the 'E' key press; the player must click a button.
        // If the node has text but no 'next' or 'choices', it's a dead end, so end dialogue.
        if (currentNode.text && !currentNode.next && !currentNode.choices) {
            return this.endDialogue();
        }
    }

    /**
     * Displays the content of the current dialogue node (text and choices).
     * @param {string} nodeKey - The key of the node to display.
     */
    showDialogueNode(nodeKey) {
        const dialogueTree = this.currentNpc.getData('dialogueTree');
        const npcName = this.currentNpc.getData('name');

        const node = dialogueTree[nodeKey];

        if (!node) {
            console.error(`Dialogue node key "${nodeKey}" not found for ${npcName}.`);
            return this.endDialogue();
        }

        this.dialogueNodeKey = nodeKey; // Update current node

        // 1. Set the main text
        let text = node.text || '(No text defined for this node.)';

        // 2. Set choices (if any)
        const choices = node.choices ? node.choices.map((choice, index) => ({
            text: choice.text,
            callback: () => this.handleChoice(choice.next),
            index: index + 1
        })) : [];

        // If this is the end node, display the text and force no choices/next button.
        if (nodeKey === 'end') {
            text = node.text || 'Goodbye!';
        }

        // 🎨 GET NPC PORTRAIT INFO
        // Get the texture and frame from the NPC sprite
        const portraitKey = this.currentNpc.texture.key;
        const portraitFrame = this.currentNpc.frame.name;

        // 🎨 CALL show() WITH PORTRAIT INFO
        this.dialogueWindow.show(text, choices, npcName, portraitKey, portraitFrame);
    }

    /**
     * Handles the player selecting a choice and advances the dialogue.
     * @param {string} nextNodeKey - The key of the next node to transition to.
     */
    handleChoice(nextNodeKey) {
        this.dialogueWindow.clearChoices(); // Remove buttons immediately
        this.dialogueNodeKey = nextNodeKey;
        this.showDialogueNode(nextNodeKey);
    }

    /**
     * Ends the interaction and closes the dialogue window.
     */
    endDialogue() {
        this.dialogueWindow.hide();
        this.player.isTalking = false; // Allow movement again
        this.isInteracting = false;
        this.currentNpc = null;
        this.dialogueNodeKey = 'start'; // Reset for next time
    }

    update() {
        // --- EMERGENCY EXIT: If the player presses ESC while interacting, force end dialogue ---
        if (this.isInteracting && this.escKey.isDown) {
            this.endDialogue();
            return;
        }

        // --- Input Handling ---
        // We handle interaction key press here, even when frozen, to allow advancing dialogue.
        this.handleInteraction();

        if (this.isInteracting) { // Guard clause: Stop movement if talking
            this.player.setVelocity(0);
            this.player.anims.stop();
            return;
        }

        // --- Movement Logic ---
        this.player.setVelocity(0);
        let isMoving = false;
        const speed = this.PLAYER_SPEED;
        let currentAnimKey = 'walk-down'; // Default animation

        if (this.controls.left.isDown) {
            this.player.setVelocityX(-speed);
            currentAnimKey = 'walk-left';
            this.lastDirection = 'left';
            isMoving = true;
        } else if (this.controls.right.isDown) {
            this.player.setVelocityX(speed);
            currentAnimKey = 'walk-right';
            this.lastDirection = 'right';
            isMoving = true;
        }

        if (this.controls.up.isDown) {
            this.player.setVelocityY(-speed);
            currentAnimKey = 'walk-up';
            this.lastDirection = 'up';
            isMoving = true;
        } else if (this.controls.down.isDown) {
            this.player.setVelocityY(speed);
            currentAnimKey = 'walk-down';
            this.lastDirection = 'down';
            isMoving = true;
        }

        // Diagonal speed correction
        if (this.player.body.velocity.x !== 0 && this.player.body.velocity.y !== 0) {
            this.player.body.velocity.normalize().scale(speed);
        }

        // Play animation if moving
        if (isMoving) {
            this.player.anims.play(currentAnimKey, true);
        } else {
            // Stop animation and set idle frame
            this.player.anims.stop();
            // Set the frame based on the last direction of movement
            switch (this.lastDirection) {
                case 'down': this.player.setFrame(0); break;
                case 'up': this.player.setFrame(3); break;
                case 'left': this.player.setFrame(6); break;
                case 'right': this.player.setFrame(9); break;
            }
        }
    }
}