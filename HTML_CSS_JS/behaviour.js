const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

ctx.lineCap = "round";
ctx.lineJoin = "round";

let eraserMode = false
let penDown = false
let allPaths = []
let currentPath
let mousePos = [0, 0]
let lastMousePos = [0, 0]
let pressedKeys = {}
//0: pen 1: brush
let brushType = 0;
let savedCanvasImage = null;

function toggleEraserMode() {
    eraserMode = !eraserMode
    eraserButton.classList.toggle("toggled")
    if (eraserMode) {
        ctx.globalCompositeOperation = 'destination-out';
    }
    else {
        ctx.globalCompositeOperation = 'source-over';
    }
    saveState();
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
    saveState();
}

function saveState() {
    localStorage.setItem("brushSize", sizeSlider.value);
    localStorage.setItem("brushOpacity", opacitySlider.value);
    localStorage.setItem("brushColor", colourPicker.value);
    localStorage.setItem("brushType", brushType);
    localStorage.setItem("eraserMode", eraserMode);
    localStorage.setItem("isDarkMode", document.body.classList.contains("darkMode"));
    localStorage.setItem("canvasDrawing", canvas.toDataURL());
}

function loadState() {
    if (localStorage.getItem("brushSize") !== null) {
        sizeSlider.value = localStorage.getItem("brushSize");
        ctx.lineWidth = sizeSlider.value;
    }

    if (localStorage.getItem("brushOpacity") !== null) {
        opacitySlider.value = localStorage.getItem("brushOpacity");
        ctx.globalAlpha = opacitySlider.value;
    }

    if (localStorage.getItem("brushColor") !== null) {
        colourPicker.value = localStorage.getItem("brushColor");
        ctx.strokeStyle = colourPicker.value;
    }

    if (localStorage.getItem("brushType") !== null) {
        brushType = parseInt(localStorage.getItem("brushType"));
        clearToggles();
        if (brushType === 0) penButton.classList.add("toggled");
        if (brushType === 1) brushButton.classList.add("toggled");
    }

    if (localStorage.getItem("eraserMode") !== null) {
        eraserMode = localStorage.getItem("eraserMode") === "true";
        if (eraserMode) {
            eraserButton.classList.add("toggled");
            ctx.globalCompositeOperation = 'destination-out';
        }
    }

    if (localStorage.getItem("isDarkMode") === "true") {
        document.body.classList.add("darkMode");
        const allIcons = document.querySelectorAll(".iconButton img");
        for (let i = 0; i < allIcons.length; i++) {
            let currentIcon = allIcons[i];
            currentIcon.src = currentIcon.src.replace("Icons/Light/", "Icons/Dark/");
        }
    }

    const savedImage = localStorage.getItem("canvasDrawing");
    if (savedImage) {
        let img = new Image();
        img.onload = function () {
            savedCanvasImage = img;
            ctx.drawImage(img, 0, 0);
        };
        img.src = savedImage;
    }
}

function redraw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (savedCanvasImage !== null) {
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1.0;
        ctx.drawImage(savedCanvasImage, 0, 0);
    }

    for (let i = 0; i < allPaths.length; i++) {
        ctx.strokeStyle = colourPicker.value;
        ctx.lineWidth = allPaths[i].lineWidth
        ctx.strokeStyle = allPaths[i].strokeStyle
        ctx.globalAlpha = allPaths[i].alpha
        ctx.globalCompositeOperation = allPaths[i].composite
        ctx.stroke(allPaths[i].path);
    }
    ctx.lineWidth = sizeSlider.value;
    ctx.globalAlpha = opacitySlider.value;
    ctx.strokeStyle = colourPicker.value;
    if (eraserMode) {
        ctx.globalCompositeOperation = 'destination-out';
    }
    else {
        ctx.globalCompositeOperation = 'source-over';
    }
}

function updateBrushSize(event) {
    ctx.lineWidth = event.target.value;
    saveState();
}

function updateColour(event) {
    console.log(event.target.value);
    ctx.strokeStyle = event.target.value;
    saveState();
}

function updateOpacity(event) {
    ctx.globalAlpha = event.target.value;
    saveState();
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

function clearToggles() {
    penButton.classList.remove("toggled");
    brushButton.classList.remove("toggled");
}
function penButtonPressed() {
    brushType = 0;
    clearToggles();
    penButton.classList.toggle("toggled");
    saveState();
}

function brushButtonPressed() {
    brushType = 1;
    clearToggles();
    brushButton.classList.toggle("toggled");
    saveState();
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


    allPaths.push({
        type: "path",
        path: currentPath,
        lineWidth: savedThickness,
        strokeStyle: ctx.strokeStyle,
        alpha: ctx.globalAlpha,
        composite: ctx.globalCompositeOperation
    });
    penDown = false;

    saveState();
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
    saveState();
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

loadState();