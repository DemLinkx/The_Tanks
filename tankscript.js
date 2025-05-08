class GameClass {
    constructor(properties) {
        this.w = properties.w;
        this.h = properties.h;
        this.background = properties.background;
        this.tank_size = properties.tank_size;
        this.isComandGame = properties.isComandGame;
    }
}

class Grass {
    constructor(properties) {
        this.x = properties.x;
        this.y = properties.y;
        this.r = properties.r;
        this.color = properties.color;
    }
    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, 2 * Math.PI);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
}

class Wall {
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
    colissionWithBullets(enemyBullets) {
        for (let i = 0; i < enemyBullets.length; i++) {
            var EnemyObject = enemyBullets[i];
            var InWallx = ((EnemyObject.x + EnemyObject.r) <= (this.x + this.size)) && ((EnemyObject.x + EnemyObject.r) >= this.x);
            var InWally = ((EnemyObject.y + EnemyObject.r) <= (this.y + this.size)) && ((EnemyObject.y + EnemyObject.r) >= this.y);
            if (InWallx && InWally) {
                EnemyObject.owner.bullets = EnemyObject.owner.bullets.filter(b => b.id !== EnemyObject.id);
            };

        }
    }
}

class TANK {
    constructor(id, isActive, x, y, controls) {
        this.id = id
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
        this.bullets_count = 0
        if (!this.isActive) {
            this.color = ' black'
        }
        this.EventProcessing();
    }

    applyBonus(property, value, duration = 0) {
        if (this.hasOwnProperty(property)) {
            const originalValue = this[property];
            this[property] = value;

            if (duration > 0) {
                setTimeout(() => {
                    if (this.isActive) { this[property] = originalValue; }
                }, duration);
            }
        } else {
            console.error(`Свойство "${property}" не найдено`);
        }
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
    colissionWithWall(wall) {
        var tankLeft = this.x - this.size / 2;
        var tankRight = this.x + this.size / 2;
        var tankTop = this.y - this.size / 2;
        var tankBottom = this.y + this.size / 2;
        var wallLeft = wall.x;
        var wallRight = wall.x + wall.size;
        var wallTop = wall.y;
        var wallBottom = wall.y + wall.size;
        var isColliding = (
            tankRight > wallLeft &&
            tankLeft < wallRight &&
            tankBottom > wallTop &&
            tankTop < wallBottom
        );

        if (isColliding) {
            var overlapLeft = tankRight - wallLeft;
            var overlapRight = wallRight - tankLeft;
            var overlapTop = tankBottom - wallTop;
            var overlapBottom = wallBottom - tankTop;
            var minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
            if (minOverlap === overlapLeft) {
                this.x = wallLeft - this.size / 2 - 1; // -1 чтобы не "залипать"
            } else if (minOverlap === overlapRight) {
                this.x = wallRight + this.size / 2 + 1;
            } else if (minOverlap === overlapTop) {
                this.y = wallTop - this.size / 2 - 1;
            } else if (minOverlap === overlapBottom) {
                this.y = wallBottom + this.size / 2 + 1;
            }
        }
    }

    update(enemyBullets, walls) {
        if (!this.isActive) {
            this.bullets.forEach(bullet => bullet.update());
            this.bullets = this.bullets.filter((bullet) => {
                return !this.removeBullet(bullet);
            });

        }
        if (this.isActive) {
            this.bullets.forEach(bullet => bullet.update());
            this.bullets = this.bullets.filter((bullet) => {
                return !this.removeBullet(bullet);
            });

            if (this.x <= 0) {
                this.x = GAME.w - 1;
            }
            if (this.y <= 0) {
                this.y = GAME.h - 1;
            }
            if (this.x >= GAME.w) {
                this.x = 0;
            }
            if (this.y >= GAME.h) {
                this.y = 0;
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
                    EnemyObject.owner.bullets = EnemyObject.owner.bullets.filter(b => b.id !== EnemyObject.id);
                }

            }
            for (let i = 0; i < walls.length; i++) {
                var wall = walls[i];
                this.colissionWithWall(wall);
            }
        }
    }

    removeBullet(bullet, bullet_id = null) {
        const in_xs = (0 <= bullet.x) && (bullet.x <= GAME.w);
        const in_ys = (0 <= bullet.y) && (bullet.y <= GAME.h);
        if (!(in_xs && in_ys) || (bullet_id && bullet.id === bullet_id)) {
            return true;
        }
        return false;
    }

    shoot(BullSpeed) {
        if (this.opportunityShot) {
            this.opportunityShot = false;
            setTimeout(() => { this.opportunityShot = true; }, this.rechargeTime);
            var BulShotCoordx = this.x + Math.cos(this.angle) * (this.dulo + this.size - 2);
            var BulShotCoordy = this.y - (this.dulo + this.size - 2) * Math.sin(-this.angle);
            this.bullets_count = this.bullets_count + 1;
            var _id_ = String(this.id) + "#" + String(this.bullets_count);
            var BulShot = new BULLET(_id_, BulShotCoordx, BulShotCoordy, 5, {
                color: 'black',
                speed: BullSpeed + this.BulletV0Speed,
                angle: this.angle,
                damage: this.BulletDamage,
                owner: this,
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
    constructor(id, x, y, r, properties) {
        this.id = id,
            this.x = x;
        this.y = y;
        this.r = r;
        this.color = properties.color;
        this.speed = properties.speed;
        this.angle = properties.angle;
        this.damage = properties.damage;
        this.owner = properties.owner;
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

var GAME = new GameClass({
    w: window.innerWidth,
    h: innerHeight,
    background: '#fc9',
    tank_size: 40,
    isComandGame: false
});

function GameSettings() {
    const urlParams = new URLSearchParams(window.location.search);
    const gameMode = urlParams.get("gamemode");
    if (gameMode == 'KingButtle') {
        GAME.isComandGame = false;
    }
    else if (gameMode == 'TeamGame') {
        GAME.isComandGame = true;
    }
}
GameSettings();

function randomInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;

}

let lastBonusTime = Date.now();
const bonusInterval = 10000; // длительность бонуса в мс

function applyRandomBonus() {
    const activeTanks = [player1, player2, player3, player4].filter(tank => tank.isActive);
    const _bonuses_ = ['healph', 'speed', 'BulletDamage']
    if (activeTanks.length === 0) return;
    const randomTank = activeTanks[Math.floor(Math.random() * activeTanks.length)];
    const randomBonus = _bonuses_[Math.floor(Math.random() * _bonuses_.length)];
    randomTank.applyBonus(randomBonus, randomTank[randomBonus] * 1.35, 10000);
    randomTank.applyBonus('color', 'gold', 1000);
    console.log(`Бонус ${randomBonus} применён к танку ${randomTank.id}`);
}
var canvas = document.getElementById('canvas');
canvas.width = GAME.w;
canvas.height = GAME.h;
var ctx = canvas.getContext('2d');

var WallList = [];
var GrassList = [];
var WallCount = randomInteger(15, 25);
var GrassCount = randomInteger(15, 25);
for (let i = 0; i <= WallCount; i++) {
    var chastyx = Math.floor(GAME.w / WallCount);
    var coordx = randomInteger(i * chastyx, (i + 10) * chastyx);
    var coordy = randomInteger((i + 1) * chastyx, (i + 2) * chastyx);
    var grs = new Wall(
        {
            x: coordx,
            y: coordy,
            size: (1 + Math.random()) * GAME.tank_size,
            color: '#a3a7a5',
            armor: randomInteger(10, 100)
        }
    );
    WallList.push(grs);

}

for (let i = 0; i <= GrassCount; i++) {
    var Chastyx = Math.floor(GAME.w / GrassCount);
    var Coordx = randomInteger(i * Chastyx, (i + 10) * Chastyx);
    var Coordy = randomInteger((i + 1) * Chastyx, (i + 2) * Chastyx);
    var grs = new Grass(
        {
            x: Coordx,
            y: Coordy,
            r: (0.5 + Math.random()) * GAME.tank_size,
            color: '#53704d',
        }
    );
    GrassList.push(grs);

}

var player1 = new TANK(1, true, 100, 800, {
    up: 'ArrowUp',
    down: 'ArrowDown',
    left: 'ArrowLeft',
    right: 'ArrowRight',
    fire: 'KeyL',
    color: 'pink',
    size: 40,
    speed: 5,
    rotateSpeed: 2,
    rechargeTime: 0.35,
    opportunityShot: true,
    startAngle: 0,
    dulo: 30,
    BulletV0Speed: 10,
    healph: 10000,
    BulletDamage: 100
});

var player2 = new TANK(2, true, 1800, 120, {
    up: 'KeyW',
    down: 'KeyS',
    left: 'KeyA',
    right: 'KeyD',
    fire: 'Space',
    color: 'green',
    size: 40,
    speed: 5,
    rotateSpeed: 2,
    rechargeTime: 0.1,
    opportunityShot: true,
    startAngle: 0,
    dulo: 30,
    BulletV0Speed: 10,
    healph: 10000,
    BulletDamage: 100
});

var player3 = new TANK(3, true, 100, 180, {
    up: 'KeyU',
    down: 'KeyJ',
    left: 'KeyH',
    right: 'KeyK',
    fire: 'KeyM',
    color: 'white',
    size: 40,
    speed: 5,
    rotateSpeed: 2,
    rechargeTime: 0.35,
    opportunityShot: true,
    startAngle: 0,
    dulo: 30,
    BulletV0Speed: 10,
    healph: 10000,
    BulletDamage: 100
});

var player4 = new TANK(4, true, 1800, 800, {
    up: 'Numpad8',
    down: 'Numpad5',
    left: 'Numpad4',
    right: 'Numpad6',
    fire: 'Numpad0',
    color: 'orange',
    size: 40,
    speed: 5,
    rotateSpeed: 2,
    rechargeTime: 0.35,
    opportunityShot: true,
    startAngle: 0,
    dulo: 30,
    BulletV0Speed: 10,
    healph: 10000,
    BulletDamage: 100
});

// const Bonuses = {
//     heal: (tank) => tank.applyBonus('healph', tank.healph + 1000, 5000),
//     speedBoost: (tank) => tank.applyBonus('speed', tank.speed * 2, 5000),
//     damageBoost: (tank) => tank.applyBonus('BulletDamage', tank.BulletDamage * 3, 5000)
// };

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
        var bullets = bullets_1.concat(bullets_2)

        for (let i = 0; i <= WallList.length - 1; i++) {
            var wall = WallList[i];
            wall.draw(ctx);
            wall.colissionWithBullets(bullets);
        }
        grs.draw(ctx)
        player1.update(bullets_1, WallList);
        player1.draw(ctx);
        player2.update(bullets_2, WallList);
        player2.draw(ctx);
        player3.update(bullets_1, WallList);
        player3.draw(ctx);
        player4.update(bullets_2, WallList);
        player4.draw(ctx);
        for (let i = 0; i <= GrassList.length - 1; i++) {
            var grass = GrassList[i];
            grass.draw(ctx);
        }
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
        for (let i = 0; i <= WallList.length - 1; i++) {
            var wall = WallList[i];
            wall.draw(ctx);
            wall.colissionWithBullets(bullets);
        }
        player1.update(bullets, WallList);
        player1.draw(ctx);
        player2.update(bullets, WallList);
        player2.draw(ctx);
        player3.update(bullets, WallList);
        player3.draw(ctx);
        player4.update(bullets, WallList);
        player4.draw(ctx);
        for (let i = 0; i <= GrassList.length - 1; i++) {
            var grass = GrassList[i];
            grass.draw(ctx);
        }
    }
}

function drawBackground(ctx) {
    ctx.fillStyle = GAME.background;
    ctx.fillRect(0, 0, GAME.w, GAME.h);
}

function Game() {
    UpdateFrame(ctx);
    const currentTime = Date.now();
    if (currentTime - lastBonusTime >= bonusInterval) {
        applyRandomBonus();
        lastBonusTime = currentTime;
    }
    requestAnimationFrame(Game);
}
Game();