const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

ctx.lineCap = "round";
ctx.lineJoin = "round";
/*
brush class
-image for shape
-colour 
-size
-eraase mode
*/
/*
can use for transparent/translucent brushes
ctx.fillStyle = "rgb(0 0 200 / 50%)";
ctx.strokeStyle = "rgb(whatever)"
ctx.fillRect(30, 30, 50, 50);
*/
let erarserMode = false
let penDown = false
let allPaths = []
let currentPath
let mousePos = []
let pressedKeys = {}
let brushType = 0
function toggleEraserMode() {
    erarserMode = !erarserMode
    eraserButton.classList.toggle("toggled")
    if (erarserMode) {
        ctx.globalCompositeOperation = 'destination-out';
    }
    else {
        ctx.globalCompositeOperation = 'source-over';
    }
}

function toggleMode() {
    document.body.classList.toggle("darkMode");
    const isDarkMode = document.body.classList.contains("darkMode");
    const allIcons = document.querySelectorAll(".iconButton img");

    for (let i = 0; i < allIcons.length; i++) {
        let currentIcon = allIcons[i]; 
        if (isDarkMode === true) {
            currentIcon.src = currentIcon.src.replace("Icons/Light/", "Icons/Dark/");
        } else {
            currentIcon.src = currentIcon.src.replace("Icons/Dark/", "Icons/Light/");
        }
    }
}
function redraw()
{
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
    mouseX = event.clientX - canvasRect.left;
    mouseY = event.clientY - canvasRect.top;
    mousePos = [mouseX, mouseY];
    update();
}

function clearToggles()
{
    penButton.classList.remove("toggled");
    brushButton.classList.remove("toggled");
}
function penButtonPressed()
{
    brushType = 0;
    clearToggles();
    penButton.classList.toggle("toggled");
}

function brushButtonPressed()
{
    brushType = 1;
    clearToggles();
    brushButton.classList.toggle("toggled");
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
    currentPath.moveTo(mousePos[0], mousePos[1]);
    penDown = true
}

function updateCurrentPath() {
    if (!penDown) {
        return;
    }
    currentPath.lineTo(mousePos[0], mousePos[1]);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    redraw();
    draw();
}
function endPath() {
    allPaths.push([currentPath, ctx.lineWidth, ctx.strokeStyle, ctx.globalAlpha]);
    penDown = false
}

function draw() {
    ctx.stroke(currentPath);
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

const penButton = document.getElementById("penButton");
penButton.addEventListener("click", penButtonPressed);
penButton.classList.toggle("toggled");

const brushButton = document.getElementById("brushButton");
brushButton.addEventListener("click", brushButtonPressed);

const eraserButton = document.getElementById("eraserButton");
eraserButton.addEventListener("click", toggleEraserMode);

const modeButton = document.getElementById("modeButton");
modeButton.addEventListener("click", toggleMode);