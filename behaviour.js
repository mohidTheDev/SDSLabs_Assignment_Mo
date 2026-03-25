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
let selectMode = false;
let textBoxMode = false;
let imageMode = false;
let shapeMode = false;
let shapeTopLeft = [0, 0]
//rect, circle, triangle
let currentShape = "rect";

let drawingShape = false;

function toggleEraserMode() {
    eraserMode = !eraserMode;
    eraserButton.classList.toggle("toggled");
    if (eraserMode) {
        ctx.globalCompositeOperation = 'destination-out';
    }
    else {
        ctx.globalCompositeOperation = 'source-over';
    }
    saveState();
}

function toggleSelectMode() {
    selectMode = !selectMode;
    clearToggles();
    clearSpecialToggles();
    clearShapeToggles();
    if (!selectMode) {
        if (brushType === 0) {
            penButtonPressed();
        }
        else {
            brushButtonPressed();
        }
        return
    }

    if (eraserMode) {
        toggleEraserMode();
    }
    selectButton.classList.toggle("toggled");
}

function toggleTextBoxMode() {
    textBoxMode = !textBoxMode
    clearToggles();
    clearSpecialToggles();
    clearShapeToggles();
    if (!textBoxMode) {
        if (brushType === 0) {
            penButtonPressed();
        }
        else {
            brushButtonPressed();
        }
        return
    }

    if (eraserMode) {
        toggleEraserMode();
    }
    textButton.classList.toggle("toggled");

}

function toggleImageMode() {
    imageMode = !imageMode
    clearToggles();
    clearSpecialToggles();
    clearShapeToggles();
    if (!imageMode) {
        if (brushType === 0) {
            penButtonPressed();
        }
        else {
            brushButtonPressed();
        }
        return
    }

    if (eraserMode) {
        toggleEraserMode();
    }
    imageButton.classList.toggle("toggled");
}

function toggleShapeMode(shape, button) {
    clearSpecialToggles();
    clearShapeToggles();
    if (shapeMode && currentShape === shape) {
        shapeMode = false;
    }
    else {
        shapeMode = true;
        button.classList.toggle("toggled");
    }
    currentShape = shape;
}

function rectMode() {
    toggleShapeMode("rect", rectButton);
}

function circleMode() {
    toggleShapeMode("circle", circleButton);
}

function triangleMode() {
    toggleShapeMode("triangle", triangleButton);
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

function insertImage(mouseX, mouseY) {
    const url = prompt("Enter the image URL:");
    if (url) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = function () {
            const width = img.width / 2;
            const height = img.height / 2;
            const x = mouseX - width / 2;
            const y = mouseY - height / 2;

            allPaths.push({
                type: 'image',
                data: img,
                x: x,
                y: y,
                w: width,
                h: height,
                alpha: ctx.globalAlpha,
                composite: ctx.globalCompositeOperation
            });

            redraw();
            saveState();
        };
        img.onerror = () => alert("Failed to load image. Check the URL.");
        img.src = url;
    }
}

function insertText(mouseX, mouseY) {
    const text = prompt("Enter your text:");
    if (text) {
        const x = mousePos[0];
        const y = mousePos[1];

        const fontSize = Math.max(12, sizeSlider.value * 2);

        allPaths.push({
            type: 'text',
            text: text,
            x: x,
            y: y,
            size: fontSize,
            color: colourPicker.value,
            alpha: opacitySlider.value,
            composite: 'source-over'
        });

        redraw();
        saveState();
    }
}

function insertRect(x1, y1, x2, y2) {
    allPaths.push({
        type: "rect",
        a1: x1,
        b1: y1,
        a2: x2,
        b2: y2,
        lineWidth: ctx.lineWidth,
        strokeStyle: ctx.strokeStyle,
        alpha: ctx.globalAlpha,
        composite: ctx.globalCompositeOperation
    });
    redraw();
    saveState();
}

function insertCircle(x1, y1, x2, y2) {
    const r = 0.5 * Math.min(Math.abs(x2 - x1), Math.abs(y2 - y1));
    const cx = x1 + r * Math.sign(x2 - x1);
    const cy = y1 + r * Math.sign(y2 - y1);
    allPaths.push({
        type: "circle",
        centerX: cx,
        centerY: cy,
        radius: r,
        lineWidth: ctx.lineWidth,
        strokeStyle: ctx.strokeStyle,
        alpha: ctx.globalAlpha,
        composite: ctx.globalCompositeOperation
    });
    redraw();
    saveState();

}

function insertTriangle(x1, y1, x2, y2) {
    allPaths.push({
        type: "triangle",
        a1: x1,
        b1: y1,
        a2: x2,
        b2: y2,
        lineWidth: ctx.lineWidth,
        strokeStyle: ctx.strokeStyle,
        alpha: ctx.globalAlpha,
        composite: ctx.globalCompositeOperation
    });
    redraw();
    saveState();
}

function redraw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (savedCanvasImage !== null) {
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1.0;
        ctx.drawImage(savedCanvasImage, 0, 0);
    }

    for (let i = 0; i < allPaths.length; i++) {
        const item = allPaths[i];

        if (item.type === 'image') {
            ctx.globalAlpha = item.alpha;
            ctx.globalCompositeOperation = item.composite;
            ctx.drawImage(item.data, item.x, item.y, item.w, item.h);
        }
        else if (item.type === 'text') {
            ctx.globalAlpha = item.alpha;
            ctx.globalCompositeOperation = item.composite;
            ctx.fillStyle = item.color;
            ctx.font = `${item.size}px Arial`;
            ctx.textBaseline = "top";
            ctx.fillText(item.text, item.x, item.y);
        }
        else if (item.type === "rect") {
            ctx.lineWidth = item.lineWidth;
            ctx.strokeStyle = item.strokeStyle;
            ctx.globalAlpha = item.alpha;
            ctx.globalCompositeOperation = item.composite;
            ctx.beginPath();
            ctx.rect(item.a1, item.b1, item.a2 - item.a1, item.b2 - item.b1);
            ctx.stroke();
        }
        else if (item.type === "circle") {
            ctx.lineWidth = item.lineWidth;
            ctx.strokeStyle = item.strokeStyle;
            ctx.globalAlpha = item.alpha;
            ctx.globalCompositeOperation = item.composite;
            ctx.beginPath();
            ctx.arc(item.centerX, item.centerY, item.radius, 0, 2 * Math.PI);
            ctx.stroke();
        }
        else if (item.type === "triangle") {
            ctx.lineWidth = item.lineWidth;
            ctx.strokeStyle = item.strokeStyle;
            ctx.globalAlpha = item.alpha;
            ctx.globalCompositeOperation = item.composite;
            ctx.beginPath();
            ctx.moveTo((item.a1 + item.a2) / 2, item.b1);
            ctx.lineTo(item.a2, item.b2);
            ctx.lineTo(item.a1, item.b2);
            ctx.closePath();
            ctx.stroke();
        }
        else {
            ctx.lineWidth = item.lineWidth;
            ctx.strokeStyle = item.strokeStyle;
            ctx.globalAlpha = item.alpha;
            ctx.globalCompositeOperation = item.composite;
            ctx.stroke(item.path);
        }
    }

    ctx.lineWidth = sizeSlider.value;
    ctx.globalAlpha = opacitySlider.value;
    ctx.strokeStyle = colourPicker.value;
    if (eraserMode) {
        ctx.globalCompositeOperation = 'destination-out'
    }
    else {
        ctx.globalCompositeOperation = 'source-over'
    }
}

function drawShapePreview() {
    console.log("bounding box");
    redraw();
    const a1 = shapeTopLeft[0];
    const b1 = shapeTopLeft[1];
    const a2 = mousePos[0];
    const b2 = mousePos[1];
    ctx.beginPath();
    if (currentShape === "rect") {
        ctx.rect(shapeTopLeft[0], shapeTopLeft[1], mousePos[0] - shapeTopLeft[0], mousePos[1] - shapeTopLeft[1]);
    }
    else if (currentShape === "circle") {
        const radius = 0.5 * Math.min(Math.abs(b2 - b1), Math.abs(a2 - a1));
        cx = a1 + radius * Math.sign(a2 - a1);
        cy = b1 + radius * Math.sign(b2 - b1);
        ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
    }
    else {
        ctx.moveTo((a1 + a2) / 2, b1);
        ctx.lineTo(a2, b2);
        ctx.lineTo(a1, b2);
        ctx.closePath();
    }
    ctx.stroke();
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

function clearShapeToggles() {
    rectButton.classList.remove("toggled");
    circleButton.classList.remove("toggled");
    triangleButton.classList.remove("toggled");
}

function clearSpecialToggles() {
    selectButton.classList.remove("toggled");
    textButton.classList.remove("toggled");
    imageButton.classList.remove("toggled");
}

function selectBrush(index, button) {
    brushType = index;
    clearToggles();
    clearSpecialToggles();
    selectMode = false;
    textBoxMode = false
    imageMode = false;
    button.classList.toggle("toggled");
    saveState();
}

function penButtonPressed() {
    selectBrush(0, penButton);
}

function brushButtonPressed() {
    selectBrush(1, brushButton);
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
    console.log("Element clicked:", event.target);
    if (imageMode) {
        insertImage(mousePos[0], mousePos[1]);
        //toggleImageMode();
        return;
    }
    if (textBoxMode) {
        insertText(mousePos[0], mousePos[1]);
        //toggleTextBoxMode();
        return;
    }
    if (shapeMode) {
        shapeTopLeft = [mousePos[0], mousePos[1]]
        drawingShape = true;
        return
    }
    if (!selectMode) {
        startPath();
        return;
    }

    const canvasRect = canvas.getBoundingClientRect();
    const clickX = event.clientX - canvasRect.left;
    const clickY = event.clientY - canvasRect.top;

    for (let i = allPaths.length - 1; i >= 0; i--) {
        const item = allPaths[i];

        if (item.type === 'text') {
            ctx.font = `${item.size}px Arial`;
            const textWidth = ctx.measureText(item.text).width;
            const textHeight = item.size;

            if (clickX >= item.x && clickX <= item.x + textWidth &&
                clickY >= item.y && clickY <= item.y + textHeight) {

                const newText = prompt("Edit text:", item.text);

                if (newText !== null && newText !== "") {
                    item.text = newText;
                    redraw();
                    saveState();
                } else if (newText === "") {
                    allPaths.splice(i, 1);
                    redraw();
                    saveState();
                }
                //toggleSelectMode();
                return;
            }
        }
    }
}

function mouseUp(event) {
    if (shapeMode === false) {
        endPath();
        return;
    }
    if (currentShape === "rect") {
        insertRect(shapeTopLeft[0], shapeTopLeft[1], mousePos[0], mousePos[1]);
        drawingShape = false;
    }
    else if (currentShape === "circle") {
        insertCircle(shapeTopLeft[0], shapeTopLeft[1], mousePos[0], mousePos[1]);
        drawingShape = false;
    }
    else {
        insertTriangle(shapeTopLeft[0], shapeTopLeft[1], mousePos[0], mousePos[1]);
        drawingShape = false;
    }
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
    if (drawingShape) {
        drawShapePreview();
    }
}


document.addEventListener("keydown", keyDown);
document.addEventListener("keyup", keyUp);

window.addEventListener('mousemove', setMousePos);

canvas.addEventListener('mousemove', setMousePos);
canvas.addEventListener('mousedown', mouseDown);
canvas.addEventListener('mouseup', mouseUp);

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

const imageButton = document.getElementById("imageButton");
imageButton.addEventListener("click", toggleImageMode);

const textButton = document.getElementById("textButton");
textButton.addEventListener("click", toggleTextBoxMode);

const selectButton = document.getElementById("selectButton");
selectButton.addEventListener("click", toggleSelectMode);

const rectButton = document.getElementById("rectButton");
rectButton.addEventListener("click", rectMode);

const circleButton = document.getElementById("circleButton");
circleButton.addEventListener("click", circleMode);

const triangleButton = document.getElementById("triangleButton");
triangleButton.addEventListener("click", triangleMode);
loadState();