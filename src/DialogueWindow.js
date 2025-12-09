/**
 * DialogueWindow Class - Visual Novel Style
 * Features: Character portrait on left, centered dialogue box, choice buttons
 */
class DialogueWindow extends Phaser.GameObjects.Container {
    constructor(scene) {
        super(scene, 0, 0);
        this.scene = scene;
        this.isVisible = false;

        // 🎨 CUSTOMIZE DIALOGUE BOX SIZE & POSITION
        const screenWidth = scene.sys.game.config.width;
        const screenHeight = scene.sys.game.config.height;
        
        const BOX_WIDTH = 450;           // ⬅️ Width of dialogue box
        const BOX_HEIGHT = 150;          // ⬅️ Height of dialogue box
        const BOX_BOTTOM_MARGIN = 40;    // ⬅️ Space from bottom of screen
        
        // Center the dialogue box horizontally, position at bottom
        const boxX = screenWidth / 2;
        const boxY = screenHeight - BOX_BOTTOM_MARGIN - (BOX_HEIGHT / 2);

        // Store dimensions
        this.BOX_WIDTH = BOX_WIDTH;
        this.BOX_HEIGHT = BOX_HEIGHT;
        this.boxX = boxX;
        this.boxY = boxY;

        // --- 1. DIALOGUE BOX BACKGROUND ---
        // 🎨 CUSTOMIZE BOX STYLE HERE
        this.dialogueBoxBg = scene.add.graphics()
            .fillStyle(0x1e3a5f, 1)        // ⬅️ Box color (dark blue)
            .lineStyle(4, 0xffffff, 1)     // ⬅️ Border (4px white)
            .fillRoundedRect(
                boxX - BOX_WIDTH / 2,
                boxY - BOX_HEIGHT / 2,
                BOX_WIDTH,
                BOX_HEIGHT,
                8                           // ⬅️ Corner roundness
            )
            .strokeRoundedRect(
                boxX - BOX_WIDTH / 2,
                boxY - BOX_HEIGHT / 2,
                BOX_WIDTH,
                BOX_HEIGHT,
                8
            )
            .setDepth(100);

        this.add(this.dialogueBoxBg);

        // --- 2. CHARACTER PORTRAIT (LEFT SIDE) ---
        // 🎨 CUSTOMIZE PORTRAIT POSITION & SIZE
        const PORTRAIT_SIZE = 120;        // ⬅️ Size of portrait box
        const PORTRAIT_LEFT_MARGIN = 500;  // ⬅️ Distance from left edge
        
        this.portraitX = PORTRAIT_LEFT_MARGIN + PORTRAIT_SIZE / 1;
        this.portraitY = boxY;

        // Portrait background box
        this.portraitBg = scene.add.graphics()
            .fillStyle(0x1e3a5f, 1)
            .lineStyle(4, 0xffffff, 1)
            .fillRoundedRect(
                this.portraitX - PORTRAIT_SIZE / 2,
                this.portraitY - PORTRAIT_SIZE / 2,
                PORTRAIT_SIZE,
                PORTRAIT_SIZE,
                8
            )
            .strokeRoundedRect(
                this.portraitX - PORTRAIT_SIZE / 2,
                this.portraitY - PORTRAIT_SIZE / 2,
                PORTRAIT_SIZE,
                PORTRAIT_SIZE,
                8
            )
            .setDepth(100);

        this.add(this.portraitBg);

        // Portrait image (will be set dynamically)
        this.portraitImage = scene.add.sprite(
            this.portraitX,
            this.portraitY,
            'player', // Default sprite
            0
        ).setDepth(101).setVisible(false);
        
        this.add(this.portraitImage);

        // --- 3. NPC NAME BOX (ABOVE PORTRAIT) ---
        // 🎨 CUSTOMIZE NAME BOX
        const NAME_BOX_WIDTH = PORTRAIT_SIZE;
        const NAME_BOX_HEIGHT = 35;
        
        this.nameBoxY = this.portraitY - PORTRAIT_SIZE / 2 - NAME_BOX_HEIGHT / 2 - 5;

        this.nameBoxBg = scene.add.graphics()
            .fillStyle(0x2c5f8d, 1)        // ⬅️ Name box color
            .lineStyle(3, 0xffffff, 1)
            .fillRoundedRect(
                this.portraitX - NAME_BOX_WIDTH / 2,
                this.nameBoxY - NAME_BOX_HEIGHT / 2,
                NAME_BOX_WIDTH,
                NAME_BOX_HEIGHT,
                5
            )
            .strokeRoundedRect(
                this.portraitX - NAME_BOX_WIDTH / 2,
                this.nameBoxY - NAME_BOX_HEIGHT / 2,
                NAME_BOX_WIDTH,
                NAME_BOX_HEIGHT,
                5
            )
            .setDepth(100);

        this.add(this.nameBoxBg);

        // 🎨 CUSTOMIZE NAME TEXT
        this.nameText = scene.add.text(
            this.portraitX,
            this.nameBoxY,
            'NPC Name',
            {
                fontFamily: 'Arial, sans-serif',
                fontSize: '18px',          // ⬅️ Name font size
                color: '#ffffff',          // ⬅️ Name color
                fontStyle: 'bold'
            }
        ).setOrigin(0.5, 0.5).setDepth(101);

        this.add(this.nameText);

        // --- 4. DIALOGUE TEXT ---
        // 🎨 CUSTOMIZE DIALOGUE TEXT
        const TEXT_PADDING = 20;
        
        this.dialogueText = scene.add.text(
            boxX - BOX_WIDTH / 2 + TEXT_PADDING,
            boxY - BOX_HEIGHT / 2 + TEXT_PADDING,
            '',
            {
                fontFamily: 'Arial, sans-serif',
                fontSize: '16px',          // ⬅️ Dialogue font size
                color: '#ffffff',          // ⬅️ Text color
                wordWrap: { 
                    width: BOX_WIDTH - (TEXT_PADDING * 2),
                    useAdvancedWrap: true 
                }
            }
        ).setDepth(101);

        this.add(this.dialogueText);

        // --- 5. CONTINUE INDICATOR ---
        this.continueIndicator = scene.add.text(
            boxX + BOX_WIDTH / 2 - 20,
            boxY + BOX_HEIGHT / 2 - 15,
            '▼',
            {
                fontFamily: 'Arial, sans-serif',
                fontSize: '20px',
                color: '#f1c40f'
            }
        ).setOrigin(1, 1).setDepth(102);
        
        // Blinking animation
        scene.tweens.add({
            targets: this.continueIndicator,
            alpha: 0.2,
            duration: 500,
            yoyo: true,
            repeat: -1
        });

        this.add(this.continueIndicator);

        // Array to store choice buttons
        this.choiceButtons = [];

        // Initial state is hidden
        this.setVisible(false);
        this.setDepth(100);

        scene.add.existing(this);
    }

    /**
     * Shows the dialogue window with NPC info and text
     * @param {string} text - Dialogue text
     * @param {Array} choices - Choice buttons
     * @param {string} npcName - Name of NPC
     * @param {string} portraitKey - Sprite key for portrait
     * @param {number} portraitFrame - Frame index for portrait
     */
    show(text, choices = [], npcName = 'NPC', portraitKey = 'player', portraitFrame = 0) {
        // Set NPC name
        this.nameText.setText(npcName);

        // Set portrait
        this.portraitImage.setTexture(portraitKey, portraitFrame);
        this.portraitImage.setVisible(true);
        this.portraitImage.setScale(3); // ⬅️ Adjust portrait scale

        // Set dialogue text
        this.dialogueText.setText(text);

        // Show everything
        this.setVisible(true);
        this.isVisible = true;

        // Clear any existing choice buttons
        this.clearChoices();

        if (choices.length > 0) {
            this.continueIndicator.setVisible(false);
            this.createChoiceButtons(choices);
        } else {
            this.continueIndicator.setVisible(true);
        }
    }

    /**
     * Creates choice buttons (CENTERED below dialogue box)
     */
    createChoiceButtons(choices) {
        // 🎨 CUSTOMIZE CHOICE BUTTON STYLE
        const BUTTON_WIDTH = 300;         // ⬅️ Button width
        const BUTTON_HEIGHT = 20;         // ⬅️ Button height
        const BUTTON_SPACING = 15;        // ⬅️ Space between buttons
        const BUTTON_START_Y = this.boxY + this.BOX_HEIGHT / 2 + 20; // Below dialogue box

        choices.forEach((choice, index) => {
            const buttonX = this.scene.sys.game.config.width / 2;
            const buttonY = BUTTON_START_Y + (index * (BUTTON_HEIGHT + BUTTON_SPACING));
            
            // Button background
            const buttonBg = this.scene.add.graphics()
                .fillStyle(0x2c5f8d, 1)    // ⬅️ Button color
                .lineStyle(3, 0xffffff, 1) // ⬅️ Button border
                .fillRoundedRect(
                    buttonX - BUTTON_WIDTH / 2,
                    buttonY - BUTTON_HEIGHT / 2,
                    BUTTON_WIDTH,
                    BUTTON_HEIGHT,
                    5
                )
                .strokeRoundedRect(
                    buttonX - BUTTON_WIDTH / 2,
                    buttonY - BUTTON_HEIGHT / 2,
                    BUTTON_WIDTH,
                    BUTTON_HEIGHT,
                    5
                )
                .setDepth(101)
                .setInteractive(
                    new Phaser.Geom.Rectangle(
                        buttonX - BUTTON_WIDTH / 2,
                        buttonY - BUTTON_HEIGHT / 2,
                        BUTTON_WIDTH,
                        BUTTON_HEIGHT
                    ),
                    Phaser.Geom.Rectangle.Contains
                );

            // Button text
            const buttonText = this.scene.add.text(
                buttonX,
                buttonY,
                `${choice.index}. ${choice.text}`,
                {
                    fontFamily: 'Arial, sans-serif',
                    fontSize: '16px',      // ⬅️ Button text size
                    color: '#ffffff'
                }
            ).setOrigin(0.5, 0.5).setDepth(102);

            // Hover effects
            buttonBg.on('pointerover', () => {
                buttonBg.clear();
                buttonBg.fillStyle(0x3a7ca5, 1);  // ⬅️ Hover color (lighter)
                buttonBg.lineStyle(3, 0xf1c40f, 1); // ⬅️ Hover border (yellow)
                buttonBg.fillRoundedRect(
                    buttonX - BUTTON_WIDTH / 2,
                    buttonY - BUTTON_HEIGHT / 2,
                    BUTTON_WIDTH,
                    BUTTON_HEIGHT,
                    5
                );
                buttonBg.strokeRoundedRect(
                    buttonX - BUTTON_WIDTH / 2,
                    buttonY - BUTTON_HEIGHT / 2,
                    BUTTON_WIDTH,
                    BUTTON_HEIGHT,
                    5
                );
            });

            buttonBg.on('pointerout', () => {
                buttonBg.clear();
                buttonBg.fillStyle(0x2c5f8d, 1);
                buttonBg.lineStyle(3, 0xffffff, 1);
                buttonBg.fillRoundedRect(
                    buttonX - BUTTON_WIDTH / 2,
                    buttonY - BUTTON_HEIGHT / 2,
                    BUTTON_WIDTH,
                    BUTTON_HEIGHT,
                    5
                );
                buttonBg.strokeRoundedRect(
                    buttonX - BUTTON_WIDTH / 2,
                    buttonY - BUTTON_HEIGHT / 2,
                    BUTTON_WIDTH,
                    BUTTON_HEIGHT,
                    5
                );
            });

            // Click handler
            buttonBg.on('pointerdown', () => {
                if (choice.callback) {
                    choice.callback();
                }
            });

            this.add([buttonBg, buttonText]);
            this.choiceButtons.push({ bg: buttonBg, text: buttonText });
        });
    }

    /**
     * Removes all choice buttons
     */
    clearChoices() {
        this.choiceButtons.forEach(button => {
            button.bg.destroy();
            button.text.destroy();
        });
        this.choiceButtons = [];
    }

    /**
     * Hides the dialogue window
     */
    hide() {
        this.setVisible(false);
        this.isVisible = false;
        this.dialogueText.setText('');
        this.portraitImage.setVisible(false);
        this.continueIndicator.setVisible(false);
        this.clearChoices();
    }
}

export default DialogueWindow;