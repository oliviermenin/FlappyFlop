import Phaser from 'phaser';

const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 900 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

let bird;
let pipes;
let enemies;
let cursors;
let score = 0;
let scoreText;
let highScoreText;
let highScore = 0;
let gameOver = false;
let startText;
let gameStarted = false;

function preload() {
    this.textures.addImage('background', document.getElementById('background'));
    this.textures.addImage('bird', document.getElementById('bird'));
    this.textures.addImage('enemies', document.getElementById('enemies'));
    this.textures.addImage('pipe', document.getElementById('pipe'));
}

function create() {
    this.add.image(400, 300, 'background');

    bird = this.physics.add.sprite(100, 300, 'bird');
    bird.setScale(0.3);
    bird.setCollideWorldBounds(true);
    bird.body.setAllowGravity(false); // Désactiver la gravité au début
    bird.setVelocityX(0); // Réinitialiser la vitesse de l'oiseau au début

    pipes = this.physics.add.group();
    enemies = this.physics.add.group(); // Groupe pour les ennemis

    // Récupérer le meilleur score depuis le localStorage
    highScore = localStorage.getItem('highScore') || 0;

    // Afficher le score et le meilleur score
    scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', fill: '#000' });
    highScoreText = this.add.text(16, 50, 'Meilleur score: ' + highScore, { fontSize: '32px', fill: '#000' });

    // Ajouter le texte "Appuyez sur espace pour commencer"
    startText = this.add.text(window.innerWidth / 2, window.innerHeight / 2, 'Appuyez sur espace pour commencer', { fontSize: '32px', fill: '#000' });
    startText.setOrigin(0.5); // Centrer le texte

    cursors = this.input.keyboard.createCursorKeys();

    // Ajouter la collision entre l'oiseau et les tuyaux
    this.physics.add.collider(bird, pipes, hitPipe, null, this);

    // Ajouter la collision entre l'oiseau et les ennemis
    this.physics.add.collider(bird, enemies, hitEnemy, null, this);
}

function update() {
    if (!gameStarted) {
        if (cursors.space.isDown) {
            startGame.call(this);
        }
        return;
    }

    if (gameOver) {
        return;
    }

    if (cursors.space.isDown) {
        bird.setVelocityY(-300);
    }

    if (bird.body.velocity.y > 0) {
        bird.setRotation(0.1);
    } else if (bird.body.velocity.y < 0) {
        bird.setRotation(-0.1);
    }

    pipes.getChildren().forEach(pipe => {
        if (pipe.getBounds().right < bird.getBounds().left && !pipe.passed) {
            pipe.passed = true;
            score += 0.5;
            scoreText.setText('Score: ' + score);
        }
    });
}

function startGame() {
    gameStarted = true;
    startText.setVisible(false); 
    bird.body.setAllowGravity(true);
    bird.setVelocityX(0.3); 

    // Ajouter un événement récurrent pour ajouter des tuyaux
    this.time.addEvent({
        delay: 1500,
        callback: addPipeRow,
        callbackScope: this,
        loop: true
    });

    // Ajouter un événement récurrent pour ajouter des ennemis
    this.time.addEvent({
        delay: 2000,
        callback: addEnemy,
        callbackScope: this,
        loop: true
    });
}

function resetGame() {
    gameOver = false;
    gameStarted = false;
    pipes.clear(true, true);
    enemies.clear(true, true);
    bird.setPosition(100, 300);
    bird.setVelocity(0, 0);
    bird.setRotation(0);
    bird.clearTint();
    score = 0;
    scoreText.setText('Score: 0');
    startText.setVisible(true);
    bird.body.setAllowGravity(false);
}

function addPipeRow() {
    if (!gameStarted) return; 

    const pipeHolePosition = Phaser.Math.Between(150, 450);
    const gapSize = 150;

    const pipeTopHeightScale = Phaser.Math.Between(2, 5);
    const pipeBottomHeightScale = Phaser.Math.Between(2, 5);

    const pipeTop = pipes.create(800, pipeHolePosition - gapSize, 'pipe').setOrigin(0, 1);
    const pipeBottom = pipes.create(800, pipeHolePosition + gapSize, 'pipe').setOrigin(0, 0);

    pipeTop.setScale(1.5, pipeTopHeightScale);
    pipeBottom.setScale(1.5, pipeBottomHeightScale);

    const pipeWidth = pipeTop.width * 0.1;
    const pipeTopHeight = pipeTop.height * pipeTopHeightScale;
    const pipeBottomHeight = pipeBottom.height * pipeBottomHeightScale;

    pipeTop.body.setSize(pipeWidth, pipeTopHeight);
    pipeBottom.body.setSize(pipeWidth, pipeBottomHeight);

    pipeTop.body.setOffset((pipeTop.width - pipeWidth) / 2, pipeTop.height * (1 - pipeTopHeightScale));
    pipeBottom.body.setOffset((pipeBottom.width - pipeWidth) / 2, 0);

    pipeTop.body.setAllowGravity(false);
    pipeBottom.body.setAllowGravity(false);

    const pipeSpeed = -400;
    pipeTop.setVelocityX(pipeSpeed);
    pipeBottom.setVelocityX(pipeSpeed);

    pipeTop.checkWorldBounds = true;
    pipeTop.outOfBoundsKill = true;
    pipeBottom.checkWorldBounds = true;
    pipeBottom.outOfBoundsKill = true;
}

function addEnemy() {
    if (!gameStarted) return;

    const enemyY = Phaser.Math.Between(50, window.innerHeight - 50);
    const enemy = enemies.create(window.innerWidth, enemyY, 'enemies');

    enemy.setScale(0.1);
    enemy.body.setAllowGravity(false);
    enemy.setVelocityX(-200);
    enemy.flipX = true;

    const collisionWidth = enemy.width * 0.5;
    const collisionHeight = enemy.height * 0.5;
    enemy.body.setSize(collisionWidth, collisionHeight);

    enemy.body.setOffset(
        (enemy.width - collisionWidth) / 2, 
        (enemy.height - collisionHeight) / 2
    );

    enemy.checkWorldBounds = true;
    enemy.outOfBoundsKill = true;
}




function hitPipe() {
    this.physics.pause();

    bird.setTint(0xff0000);
    bird.setVelocity(0, 0);
    gameOver = true;

    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
        highScoreText.setText('Meilleur score: ' + highScore);
    }

    scoreText.setText('Game Over! Ton score: ' + score);

    this.time.delayedCall(1500, function() {
        window.location.reload();
    }, [], this);
}

function hitEnemy() {
    this.physics.pause();

    bird.setTint(0xff0000);
    bird.setVelocity(0, 0);
    gameOver = true;

    if($score > $highScore)
    {
        localStorage.setItem($highScore, $score);
    }

    this.time.delayedCall(1500, function() {
        window.location.reload();
    }, [], this);
}
