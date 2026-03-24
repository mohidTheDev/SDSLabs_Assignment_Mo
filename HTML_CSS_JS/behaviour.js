const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

ctx.lineCap = "round";
ctx.lineJoin = "round";

let erarserMode = false
let penDown = false
let allPaths = []
let currentPath
let mousePos = [0, 0]
let lastMousePos = [0, 0]
let pressedKeys = {}

//0: pen 1: brush 2: eraser
let brushType = 0;

function toggleEraserMode() {
    erarserMode = !erarserMode
    if (erarserMode) {
        ctx.globalCompositeOperation = 'destination-out';
    }
    else {
        ctx.globalCompositeOperation = 'source-over';
    }
}

function redraw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < allPaths.length; i++) {
        ctx.strokeStyle = colourPicker.value;
        ctx.lineWidth = allPaths[i][1]
        ctx.strokeStyle = allPaths[i][2]
        ctx.globalAlpha = allPaths[i][3]
        ctx.stroke(allPaths[i][0]);
    }
    ctx.lineWidth = sizeSlider.value;
    ctx.globalAlpha = opacitySlider.value;
    ctx.strokeStyle = colourPicker.value;
}

function updateBrushSize(event) {
    ctx.lineWidth = event.target.value;
}

function updateColour(event) {
    console.log(event.target.value);
    ctx.strokeStyle = event.target.value;
}

function updateOpacity(event) {
    ctx.globalAlpha = event.target.value;
}

/* INPUT CHECKS */

function setMousePos(event) {
    const canvasRect = canvas.getBoundingClientRect();
    lastMousePos = [mousePos[0], mousePos[1]]
    mouseX = event.clientX - canvasRect.left;
    mouseY = event.clientY - canvasRect.top;
    mousePos = [mouseX, mouseY];
    update();
}

function keyDown(event) {
    pressedKeys[event.key] = true
    if (event.key === "e") {
        toggleEraserMode();
    }
    if (event.key === "p") {
        console.log(allPaths)
        console.log(ctx.globalAlpha);
        console.log(opacitySlider.value);
    }
    if (pressedKeys["Control"] === true && pressedKeys["z"] === true) {
        undo();
    }
}
function keyUp(event) {
    pressedKeys[event.key] = false
}

function mouseDown(event) {
    /* check if mouse is in canvas*/
    startPath()
}

function mouseUp(event) {
    endPath()
}

function startPath() {
    currentPath = new Path2D();
    lastMousePos = [mousePos[0], mousePos[1]];
    if (brushType === 0) {
        currentPath.moveTo(mousePos[0], mousePos[1]);
    }
    penDown = true;
}

function updateCurrentPath() {
    if (!penDown) {
        return;
    }
    if (brushType === 0) {
        currentPath.lineTo(mousePos[0], mousePos[1]);

    } else if (brushType === 1) {
        const lineCount = Math.max(5, 0.5 * sizeSlider.value);
        const spread = sizeSlider.value;

        for (let i = 0; i < lineCount; i++) {
            const offset = (i - (lineCount - 1) / 2) * (spread / lineCount);
            currentPath.moveTo(lastMousePos[0] + offset, lastMousePos[1] + offset);
            currentPath.lineTo(mousePos[0] + offset, mousePos[1] + offset);
        }
    }

    redraw();
    draw();
}

function endPath() {
    let savedThickness;

    if (brushType === 1) {
        savedThickness = sizeSlider.value / 6;
    } 
    else {
        savedThickness = ctx.lineWidth;
    }


    allPaths.push([currentPath, savedThickness, ctx.strokeStyle, ctx.globalAlpha]);
    penDown = false;
}

function draw() {
    if (brushType === 1) {
        ctx.lineWidth = sizeSlider.value / 6;
    }
    else {
        ctx.lineWidth = sizeSlider.value;
    }

    ctx.stroke(currentPath);
    ctx.lineWidth = sizeSlider.value;
}


function undo() {
    allPaths.pop();
    redraw();
}

function update() {
    updateCurrentPath();
}


document.addEventListener("keydown", keyDown);
document.addEventListener("keyup", keyUp);

window.addEventListener('mousemove', setMousePos);

document.addEventListener('mousedown', mouseDown);

document.addEventListener('mouseup', mouseUp);

const sizeSlider = document.getElementById("sizeSlider");
sizeSlider.addEventListener("input", updateBrushSize);

const opacitySlider = document.getElementById("opacitySlider");
opacitySlider.addEventListener("input", updateOpacity);

const colourPicker = document.getElementById("colourSelect");
colourPicker.addEventListener("input", updateColour);