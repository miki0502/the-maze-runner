let rowNum = 40
let colNum = 70
let gridSize = Math.round(innerHeight / rowNum)

let skipAudio, bgm
let personImg, exitImg
var player
let enemies = []
let life = 4
let win = false

function preload() {
    personImg = loadImage('assets/person.png')
    exitImg = loadImage('assets/exit.png')
    skipAudio = loadSound('assets/skip.mp3')
    bgm = loadSound('assets/bgm.mp3')
}

function setup() {
    createCanvas(innerWidth, innerHeight)
    noStroke()

    // add some enemies
    for (let i = 0; i < 4; i++) {
        addEnemy(1, 33 + i)
        addEnemy(23, 22 + i)
    }
    addEnemy(14, 9)
    addEnemy(14, 15)
    addEnemy(14, 49)
    addEnemy(14, 56)
    addEnemy(32, 16)

    player = new Player()
    bgm.loop()
}

function draw() {
    drawMap()
    drawEnemies()

    player.update()
    player.display()
    player.checkGameOver()

    drawRightBar()
}

function pointInPlayer(x, y, playerObj, borderCheck) {
    if (borderCheck) {
        return x >= playerObj.x && x <= playerObj.x + playerObj.w && y >= playerObj.y && y <= playerObj.y + playerObj.h
    } else {
        return x > playerObj.x && x < playerObj.x + playerObj.w && y > playerObj.y && y < playerObj.y + playerObj.h
    }
}

function intersect(playerObj, rect, borderCheck) {
    let x1 = rect.x
    let y1 = rect.y
    let x2 = x1 + rect.w
    let y2 = y1
    let x3 = x1
    let y3 = y1 + rect.h
    let x4 = x2
    let y4 = y3

    if (pointInPlayer(x1, y1, playerObj, borderCheck) || pointInPlayer(x2, y2, playerObj, borderCheck)
        || pointInPlayer(x3, y3, playerObj, borderCheck) || pointInPlayer(x4, y4, playerObj, borderCheck)) {
        return true
    } else {
        return false
    }
}

class Player {
    constructor() {
        this.speed = 2

        this.w = gridSize
        this.h = gridSize * 2

        this.initPos()

        this.skip = null // null->up->down->null
        this.skipDistance = 0
    }

    initPos() {
        this.x = getX(66)
        this.y = getY(4)
    }

    startSkip() {
        if (this.skip == null) { // to prevent double skipping
            this.skip = 'up'
            this.skipDistance = 0
        }
    }

    tryMoveLeft() {
        let nextPos = {
            x: this.x - this.speed,
            y: this.y,
            w: this.w,
            h: this.h
        }
        return this.tryMove(nextPos, false)
    }

    tryMoveRight() {
        let nextPos = {
            x: this.x + this.speed,
            y: this.y,
            w: this.w,
            h: this.h
        }
        return this.tryMove(nextPos, false)
    }

    tryMoveDown() {
        let nextPos = {
            x: this.x,
            y: this.y + 1,
            w: this.w,
            h: this.h
        }
        return this.tryMove(nextPos)
    }


    tryMoveUp(borderCheck = true) {
        let nextPos = {
            x: this.x,
            y: this.y - 1,
            w: this.w,
            h: this.h
        }
        return this.tryMove(nextPos, borderCheck)
    }

    tryMove(playerObj, borderCheck = true) {
        for (let grid of grids) {
            let rect = getGridObject(grid.row, grid.col)
            if (!grid.road && intersect(playerObj, rect, borderCheck)) {
                return false
            }
        }
        return true
    }

    checkGameOver() {
        for (let enemy of enemies) {
            if (intersect(this, enemy)) {
                this.initPos()
                life--
                return
            }
        }

        let exit = getGridObject(36, 67)
        if (this.x == exit.x && Math.abs(this.y - exit.y) < 3) {
            win = true
        }
    }



    // update player state
    update() {
        // handle skip action
        if (this.skip == 'up') {
            let maxD = int(2 * gridSize)
            if (this.skipDistance < maxD && this.tryMoveUp(false)) {
                this.skipDistance += 1
                this.y -= 1
            } else {
                this.skip = 'down'
            }
        } else if (this.skip == 'down') {
            if (this.tryMoveDown()) {
                this.y += 1
            } else {
                this.y += 1
                this.skip = null
                this.skipDistance = 0
            }
        } else {
            if (this.tryMoveDown()) {
                this.y += 1
            }
        }


        if (keyIsPressed) {
            if (keyIsDown(LEFT_ARROW)) {
                if (this.tryMoveLeft()) {
                    this.x -= this.speed
                }
            } else if (keyIsDown(RIGHT_ARROW)) {
                if (this.tryMoveRight()) {
                    this.x += this.speed
                }
            }
        }

    }

    display() {
        image(personImg, this.x, this.y, this.w, this.h)
    }
}

function drawMap() {
    grids.forEach(grid => {
        if (grid.road) {
            fill(255)
        } else {
            fill(111, 68, 58)
        }
        rect(grid.col * gridSize, grid.row * gridSize, gridSize, gridSize)
    })

    // EXIT
    image(exitImg, getX(68), getY(36), gridSize * 2, gridSize * 2)
}

function addEnemy(row, col) {
    enemies.push({
        x: getX(col),
        y: getY(row),
        w: 6,
        h: 60 + random(20),
        speed: 0.8,
    })
}

function drawRightBar() {
    let x = colNum * gridSize

    fill(255)
    rect(x, 0, width - x, 500)

    textSize(30)
    if (life == 0) {
        fill('red')
        text('You lose', x, 150)
        bgm.stop()
    } else if (win) {
        fill('green')
        text('You win', x, 150)
        bgm.stop()
    } else {
        fill(0)
        text('Life:', x, 100)

        for (let i = 0; i < life; i++) {
            image(personImg, x + 5 + i * 30, 120, gridSize, gridSize * 2)
        }
    }

    textSize(16)
    text('Control: ', x, 300)
    text('Right: ->', x, 330)
    text('Left: <-', x, 360)
    text('Skip: space bar', x, 390)
}

function drawEnemies() {
    enemies.forEach(o => {
        if (o.h > 80 || o.h < 30) {
            o.speed *= -1
        }
        o.h += o.speed
        rect(o.x, o.y, o.w, o.h, 6)
    })
}

function keyPressed() {
    if (key == ' ') { // PRESS blank space key to skip
        player.startSkip()
        skipAudio.play()
    }
    return false
}

function getX(col) {
    return col * gridSize
}

function getY(row) {
    return row * gridSize
}

function getGridObject(row, col) {
    return {
        x: getX(col),
        y: getY(row),
        w: gridSize,
        h: gridSize
    }
}


