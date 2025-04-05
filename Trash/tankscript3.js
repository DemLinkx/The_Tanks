var GAME = {
    w: 1900,
    h: 935,
    background: '#fc9',
    tank_size: 40,
    backgroundImg: 'background.jpg',
    isComandGame: true
}

function randomInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;

}

class Grass {
    constructor(properties) {
        this.x = properties.x;
        this.y = properties.y;
        this.size = properties.size;
        this.color = properties.color;
        this.armor = properties.armor;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 4;
        ctx.fillRect(this.x, this.y, this.size, this.size);
    }
}

class TANK {
    constructor(isActive, x, y, controls) {
        this.isActive = isActive;
        this.x = x;
        this.y = y;
        this.size = controls.size;
        this.color = controls.color;
        this.controls = controls;
        this.speed = controls.speed;
        this.rotateSpeed = controls.rotateSpeed; // rad/sec
        this.rechargeTime = controls.rechargeTime * 1000;
        this.opportunityShot = controls.opportunityShot;
        this.angle = controls.startAngle;
        this.dulo = controls.dulo;
        this.NowSpeed = 0;
        this.bullets = [];
        this.MAXHEALPH = controls.healph;
        this.healph = controls.healph;
        this.keysPressed = {};
        this.BulletV0Speed = controls.BulletV0Speed;
        this.BulletDamage = controls.BulletDamage;
        if (!this.isActive) {
            this.color = ' black'
        }
        this.EventProcessing();
    }

    EventProcessing() {
        document.addEventListener('keydown', (event) => this.AddKeyPressed(event));
        document.addEventListener('keyup', (event) => this.DelKeyPressed(event));
    }

    AddKeyPressed(event) {
        this.keysPressed[event.code] = true;
    }
    DelKeyPressed(event) {
        this.keysPressed[event.code] = false;
    }
    colissionWithGrass(grass) {
        var tankLeft = this.x - this.size / 2;
        var tankRight = this.x + this.size / 2;
        var tankTop = this.y - this.size / 2;
        var tankBottom = this.y + this.size / 2;
        var grassLeft = grass.x;
        var grassRight = grass.x + grass.size;
        var grassTop = grass.y;
        var grassBottom = grass.y + grass.size;
        var isColliding = (
            tankRight > grassLeft &&
            tankLeft < grassRight &&
            tankBottom > grassTop &&
            tankTop < grassBottom
        );

        if (isColliding) {
            var overlapLeft = tankRight - grassLeft;
            var overlapRight = grassRight - tankLeft;
            var overlapTop = tankBottom - grassTop;
            var overlapBottom = grassBottom - tankTop;
            var minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
            if (minOverlap === overlapLeft) {
                this.x = grassLeft - this.size / 2 - 1; // -1 чтобы не "залипать"
            } else if (minOverlap === overlapRight) {
                this.x = grassRight + this.size / 2 + 1;
            } else if (minOverlap === overlapTop) {
                this.y = grassTop - this.size / 2 - 1;
            } else if (minOverlap === overlapBottom) {
                this.y = grassBottom + this.size / 2 + 1;
            }
        }
    }

    update(enemyBullets, grases) {
        if (!this.isActive) {
            this.bullets.forEach((bullet, index, bullets) => {
                var in_xs = (0 <= bullet.x) && (bullet.x <= GAME.w);
                var in_ys = (0 <= bullet.y) && (bullet.y <= GAME.h);
                if (!(in_xs && in_ys)) {
                    bullets.splice(index, 1);
                    return;
                }
                bullet.update();
            });

        }
        if (this.isActive) {
            this.bullets.forEach((bullet, index, bullets) => {
                var in_xs = (0 <= bullet.x) && (bullet.x <= GAME.w);
                var in_ys = (0 <= bullet.y) && (bullet.y <= GAME.h);
                if (!(in_xs && in_ys)) {
                    bullets.splice(index, 1);
                    return;
                }
                bullet.update();
            });
            if (this.x <= 0) {
                this.x = 0;
            }
            if (this.y <= 0) {
                this.y = 0;
            }
            if (this.x >= GAME.w) {
                this.x = GAME.w;
            }
            if (this.y >= GAME.h) {
                this.y = GAME.h;
            }

            if (this.keysPressed[this.controls.up]) {
                this.y += Math.floor(Math.sin(this.angle) * this.speed);
                this.x += Math.floor(Math.cos(this.angle) * this.speed);
                this.NowSpeed = this.speed;
            }

            if (this.keysPressed[this.controls.down]) {
                this.y -= Math.floor(Math.sin(this.angle) * this.speed);
                this.x -= Math.floor(Math.cos(this.angle) * this.speed);
                this.NowSpeed = -this.speed;
            }

            if (this.keysPressed[this.controls.right]) {
                this.angle += this.rotateSpeed * Math.PI / 180;
            }

            if (this.keysPressed[this.controls.left]) {
                this.angle -= this.rotateSpeed * Math.PI / 180;
            }

            if (this.keysPressed[this.controls.fire]) {
                this.shoot(this.NowSpeed);
            }
            else {
                this.NowSpeed = 0
            }

            for (let i = 0; i < enemyBullets.length; i++) {
                var EnemyObject = enemyBullets[i];
                var InTankx = (this.x - this.size / 2 <= EnemyObject.x) && (EnemyObject.x <= this.x + this.size / 2);
                var InTanky = (this.y + this.size / 2 >= EnemyObject.y) && (EnemyObject.y >= this.y - this.size / 2);
                if (InTankx && InTanky) {
                    this.healph -= EnemyObject.damage;
                    this.x += Math.floor(Math.cos(EnemyObject.angle) * EnemyObject.speed * 0.1);
                    this.y -= Math.floor(Math.sin(EnemyObject.angle) * EnemyObject.speed * 0.1);
                    if (this.healph <= 0) {
                        this.color = 'black';
                        this.isActive = false;
                    }
                }

            }
            for (let i = 0; i < grases.length; i++) {
                var grass = grases[i];
                this.colissionWithGrass(grass);
            }
        }
    }
    shoot(BullSpeed) {
        if (this.opportunityShot) {
            this.opportunityShot = false;
            setTimeout(() => { this.opportunityShot = true; }, this.rechargeTime);
            var BulShotCoordx = this.x + Math.cos(this.angle) * (this.dulo + this.size - 2);
            var BulShotCoordy = this.y - (this.dulo + this.size - 2) * Math.sin(-this.angle);
            var BulShot = new BULLET(BulShotCoordx, BulShotCoordy, 5, {
                color: 'black',
                speed: BullSpeed + this.BulletV0Speed,
                angle: this.angle,
                damage: this.BulletDamage,
            })
            this.bullets.push(BulShot);
        }
    }
    updateHP() {
        ctx.save(); // !!!
        ctx.beginPath();
        var healphAngle = (this.healph / this.MAXHEALPH) * 2 * Math.PI;
        ctx.fillStyle = this.color;
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'black';
        ctx.arc(0, 0, this.size / 4, 0, healphAngle);
        ctx.stroke();
        ctx.closePath();
        ctx.restore(); // !!!!!
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 4;
        ctx.save(); // !!!
        ctx.beginPath();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.rect(-this.size / 2, -this.size / 2, this.size, this.size); // restore сначала отменяет rotate потом  save
        ctx.moveTo(this.size + this.dulo, 0);
        ctx.lineTo(0, 0);
        ctx.stroke();
        ctx.fill();
        ctx.closePath();
        this.updateHP();
        ctx.restore(); // !!!!!
        for (let i = 0; i < this.bullets.length; i++) {
            var bullet = this.bullets[i];
            bullet.draw(ctx);
        }
    }
}

class BULLET {
    constructor(x, y, r, properties) {
        this.x = x;
        this.y = y;
        this.r = r;
        this.color = properties.color;
        this.speed = properties.speed;
        this.angle = properties.angle;
        this.damage = properties.damage;
    }
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.fill();
    }

    update() {
        this.y += Math.sin(this.angle) * this.speed;
        this.x += Math.cos(this.angle) * this.speed;
    }
}

var canvas = document.getElementById('canvas1');
canvas.width = GAME.w;
canvas.height = GAME.h;
var ctx = canvas.getContext('2d');
var GrassList = [];
var GrassCount = randomInteger(10, 25);
for (let i = 0; i <= GrassCount; i++) {
    var chastyx = Math.floor(GAME.w / GrassCount);
    var coordx = randomInteger(i * chastyx, (i + 10) * chastyx);
    var coordy = randomInteger((i + 1) * chastyx, (i + 2) * chastyx);
    var grs = new Grass(
        {
            x: coordx,
            y: coordy,
            size: (1 + Math.random()) * GAME.tank_size,
            color: '#00bfff ',
            armor: randomInteger(10, 100)
        }
    );
    GrassList.push(grs);

}

var player1 = new TANK(true, 100, 800, {
    up: 'ArrowUp',
    down: 'ArrowDown',
    left: 'ArrowLeft',
    right: 'ArrowRight',
    fire: 'KeyL',
    color: 'pink',
    size: 40,
    speed: 5,
    rotateSpeed: 2,
    rechargeTime: 0.7,
    opportunityShot: true,
    startAngle: 0,
    dulo: 30,
    BulletV0Speed: 10,
    healph: 10000,
    BulletDamage: 100
});

var player2 = new TANK(true, 1800, 120, {
    up: 'KeyW',
    down: 'KeyS',
    left: 'KeyA',
    right: 'KeyD',
    fire: 'Space',
    color: 'green',
    size: 40,
    speed: 7,
    rotateSpeed: 2,
    rechargeTime: 0.7,
    opportunityShot: true,
    startAngle: Math.PI,
    dulo: 30,
    BulletV0Speed: 10,
    healph: 10000,
    BulletDamage: 100
});

var player3 = new TANK(true, 100, 180, {
    up: 'KeyU',
    down: 'KeyJ',
    left: 'KeyH',
    right: 'KeyK',
    fire: 'KeyM',
    color: 'white',
    size: 40,
    speed: 7,
    rotateSpeed: 2,
    rechargeTime: 0.8,
    opportunityShot: true,
    startAngle: 0,
    dulo: 30,
    BulletV0Speed: 10,
    healph: 10000,
    BulletDamage: 100
});

var player4 = new TANK(true, 1800, 800, {
    up: 'Numpad8',
    down: 'Numpad5',
    left: 'Numpad4',
    right: 'Numpad6',
    fire: 'Numpad0',
    color: 'orange',
    size: 40,
    speed: 5,
    rotateSpeed: 2,
    rechargeTime: 0.7,
    opportunityShot: true,
    startAngle: Math.PI,
    dulo: 30,
    BulletV0Speed: 10,
    healph: 10000,
    BulletDamage: 100
});

if (GAME.isComandGame) {
    function UpdateFrame(ctx) {
        ctx.clearRect(0, 0, GAME.w, GAME.h);
        drawBackground(ctx);
        var bullets_1 = [];
        var bullets_2 = [];

        bullets_1 = bullets_1.concat(player2.bullets);
        bullets_1 = bullets_1.concat(player4.bullets);
        bullets_2 = bullets_2.concat(player1.bullets);
        bullets_2 = bullets_2.concat(player3.bullets);

        for (let i = 0; i <= GrassList.length - 1; i++) {
            var grass = GrassList[i];
            grass.draw(ctx);
        }
        player1.update(bullets_1, GrassList);
        player1.draw(ctx);
        player2.update(bullets_2, GrassList);
        player2.draw(ctx);
        player3.update(bullets_1, GrassList);
        player3.draw(ctx);
        player4.update(bullets_2, GrassList);
        player4.draw(ctx);
    }
}
else {
    function UpdateFrame(ctx) {
        ctx.clearRect(0, 0, GAME.w, GAME.h);
        drawBackground(ctx);
        var bullets = [];
        bullets = bullets.concat(player1.bullets);
        bullets = bullets.concat(player2.bullets);
        bullets = bullets.concat(player3.bullets);
        bullets = bullets.concat(player4.bullets);

        for (let i = 0; i <= GrassList.length - 1; i++) {
            var grass = GrassList[i];
            grass.draw(ctx);
        }
        player1.update(bullets, GrassList);
        player1.draw(ctx);
        player2.update(bullets, GrassList);
        player2.draw(ctx);
        player3.update(bullets, GrassList);
        player3.draw(ctx);
        player4.update(bullets, GrassList);
        player4.draw(ctx);
    }
}

function drawBackground(ctx) {
    ctx.fillStyle = GAME.background;
    ctx.fillRect(0, 0, GAME.w, GAME.h);
}

function Game() {
    UpdateFrame(ctx)
    requestAnimationFrame(Game);
}
Game();
