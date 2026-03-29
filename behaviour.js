const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

ctx.lineCap = "round";
ctx.lineJoin = "round";

let eraserMode = false
let penDown = false
let allPaths = []
let redoPaths = [];
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
let drawingImage = false;
let drawingText = false;

let shapeSelected = false;
let rotatingSelected = false; // not rotating => moving
let shapeSelectInitialMousePos = [0, 0];
let initalShape = null;

const imagePreviewLineWidth = 10;
const imagePreviewLineColour = "rgb(106, 106, 106)";
const imagePreviewLineAlpha = 1;


function resetStrokeSettings() {
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
    else {
        shapeMode = false;
        textBoxMode = false;
        imageMode = false;
        shapeSelected = false;
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
    else {
        selectMode = false;
        shapeSelected = false;
        shapeMode = false;
        imageMode = false;
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
    else {
        selectMode = false;
        shapeSelected = false;
        shapeMode = false;
        textBoxMode = false
    }

    if (eraserMode) {
        toggleEraserMode();
    }
    imageButton.classList.toggle("toggled");
}

function toggleShapeMode(shape, button) {
    clearSpecialToggles();
    clearShapeToggles();

    selectMode = false;
    shapeSelected = false;
    textBoxMode = false;
    imageMode = false;

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

function clearCanvas() {
    allPaths.push(
        {
            type: 'clear'
        }
    )
    redoPaths = [];
    redraw();
    saveState();
}

function insertImage(mouseX, mouseY) {
    const url = prompt("Enter the image URL:");
    if (url) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = function () {
            let width = img.width;
            let height = img.height;
            const boxWidth = Math.abs(mouseX - shapeTopLeft[0]);
            const boxHeight = Math.abs(mouseY - shapeTopLeft[1]);
            const ratio = height / width;
            if (boxHeight / boxWidth > ratio) {
                width = boxWidth;
                height = ratio * width;
            }
            else {
                height = boxHeight;
                width = height / ratio;
            }

            allPaths.push({
                type: 'image',
                data: img,
                x: Math.min(shapeTopLeft[0], mouseX),
                y: Math.min(shapeTopLeft[1], mouseY),
                w: width,
                h: height,
                alpha: ctx.globalAlpha,
                composite: ctx.globalCompositeOperation
            });

            redoPaths = [];
            redraw();
            saveState();
        };
        img.onerror = () => alert("Failed to load image. Check the URL.");
        img.src = url;
    }
}

function insertText(mouseX, mouseY) {
    const boxWidth = Math.abs(mouseX - shapeTopLeft[0]);
    const boxHeight = Math.abs(mouseY - shapeTopLeft[1]);
    const text = prompt("Enter your text:");
    if (text) {
        let fontSize = boxHeight;
        ctx.font = `${fontSize}px Arial`;
        const textWidth = ctx.measureText(text).width;

        if (textWidth > boxWidth) {
            fontSize = fontSize * (boxWidth / textWidth);
        }

        allPaths.push({
            type: 'text',
            text: text,
            x: Math.min(shapeTopLeft[0], mouseX),
            y: Math.min(shapeTopLeft[1], mouseY),
            size: fontSize,
            color: colourPicker.value,
            alpha: opacitySlider.value,
            composite: 'source-over'
        });

        redoPaths = [];
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
        b2: y1,
        a3: x2,
        b3: y2,
        a4: x1,
        b4: y2,
        lineWidth: ctx.lineWidth,
        strokeStyle: ctx.strokeStyle,
        alpha: ctx.globalAlpha,
        composite: ctx.globalCompositeOperation
    });

    redoPaths = [];
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

    redoPaths = [];
    redraw();
    saveState();

}

function insertTriangle(x1, y1, x2, y2) {
    allPaths.push({
        type: "triangle",
        a1: x1,
        b1: y2,
        a2: x2,
        b2: y2,
        a3: (x1 + x2) / 2,
        b3: y1,
        lineWidth: ctx.lineWidth,
        strokeStyle: ctx.strokeStyle,
        alpha: ctx.globalAlpha,
        composite: ctx.globalCompositeOperation
    });

    redoPaths = [];
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

        if (item.type === 'clear') {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        else if (item.type === 'image') {
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
            ctx.moveTo(item.a1, item.b1);
            ctx.lineTo(item.a2, item.b2);
            ctx.lineTo(item.a3, item.b3);
            ctx.lineTo(item.a4, item.b4);
            ctx.closePath();
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
            ctx.moveTo(item.a1, item.b1);
            ctx.lineTo(item.a2, item.b2);
            ctx.lineTo(item.a3, item.b3);
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

    resetStrokeSettings();
}

function crossProduct(a, b, p) {
    return (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
}

function pointInPolygon(vertices) {
    let sign = 0;
    for (let i = 0; i < vertices.length; i++) {
        const a = vertices[i];
        const b = vertices[(i + 1) % vertices.length];
        const currentCrossProduct = crossProduct(a, b, mousePos);

        if (currentCrossProduct === 0) {
            continue;
        }

        if (sign === 0) {
            sign = Math.sign(currentCrossProduct);
        }

        if (Math.sign(currentCrossProduct) !== sign) {
            return false;
        }
    }

    return true;
}
function mouseInteriorCheck(shapeIndex) {
    const shape = allPaths[shapeIndex];
    if (shape.type === "rect") {
        const v1 = [shape.a1, shape.b1];
        const v2 = [shape.a2, shape.b2];
        const v3 = [shape.a3, shape.b3];
        const v4 = [shape.a4, shape.b4];

        return pointInPolygon([v1, v2, v3, v4])
    }
    else if (shape.type === "triangle") {
        const v1 = [shape.a1, shape.b1];
        const v2 = [shape.a2, shape.b2];
        const v3 = [shape.a3, shape.b3];

        return pointInPolygon([v1, v2, v3])
    }
    else {
        let mouseDistance = 0;
        mouseDistance += (mousePos[0] - shape.centerX) ** 2;
        mouseDistance += (mousePos[1] - shape.centerY) ** 2;
        mouseDistance = Math.sqrt(mouseDistance);
        return mouseDistance <= shape.radius;
    }
}

function moveShape() {
    const shape = allPaths[allPaths.length - 1];
    let move = [0, 0]
    move[0] = mousePos[0] - shapeSelectInitialMousePos[0];
    move[1] = mousePos[1] - shapeSelectInitialMousePos[1];
    if (shape.type === "rect") {
        shape.a1 = initalShape.a1 + move[0]
        shape.a2 = initalShape.a2 + move[0]
        shape.a3 = initalShape.a3 + move[0]
        shape.a4 = initalShape.a4 + move[0]
        shape.b1 = initalShape.b1 + move[1]
        shape.b2 = initalShape.b2 + move[1]
        shape.b3 = initalShape.b3 + move[1]
        shape.b4 = initalShape.b4 + move[1]
    }
    else if (shape.type === "triangle") {
        shape.a1 = initalShape.a1 + move[0]
        shape.a2 = initalShape.a2 + move[0]
        shape.a3 = initalShape.a3 + move[0]
        shape.b1 = initalShape.b1 + move[1]
        shape.b2 = initalShape.b2 + move[1]
        shape.b3 = initalShape.b3 + move[1]
    }
    else {
        shape.centerX = initalShape.centerX + move[0];
        shape.centerY = initalShape.centerY + move[1];
    }
}

function rotatePoint(x, y, cx, cy, cosTheta, sinTheta) {
    const dx = x - cx;
    const dy = y - cy;
    return [
        dx * cosTheta - dy * sinTheta + cx,
        dx * sinTheta + dy * cosTheta + cy
    ];
}

function rotateShape() {
    const shape = allPaths[allPaths.length - 1];

    let cx, cy;
    let points = [];

    if (shape.type === "rect") {
        cx = (initalShape.a1 + initalShape.a2 + initalShape.a3 + initalShape.a4) / 4;
        cy = (initalShape.b1 + initalShape.b2 + initalShape.b3 + initalShape.b4) / 4;
        points = [
            [initalShape.a1, initalShape.b1],
            [initalShape.a2, initalShape.b2],
            [initalShape.a3, initalShape.b3],
            [initalShape.a4, initalShape.b4]
        ];
    } else if (shape.type === "triangle") {
        cx = (initalShape.a1 + initalShape.a2 + initalShape.a3) / 3;
        cy = (initalShape.b1 + initalShape.b2 + initalShape.b3) / 3;
        points = [
            [initalShape.a1, initalShape.b1],
            [initalShape.a2, initalShape.b2],
            [initalShape.a3, initalShape.b3]
        ];
    } else {
        return;
    }

    const startAngle = Math.atan2(shapeSelectInitialMousePos[1] - cy, shapeSelectInitialMousePos[0] - cx);
    const currentAngle = Math.atan2(mousePos[1] - cy, mousePos[0] - cx);
    const theta = currentAngle - startAngle;

    const cosTheta = Math.cos(theta);
    const sinTheta = Math.sin(theta);

    if (shape.type === "rect") {
        const p1 = rotatePoint(points[0][0], points[0][1], cx, cy, cosTheta, sinTheta);
        const p2 = rotatePoint(points[1][0], points[1][1], cx, cy, cosTheta, sinTheta);
        const p3 = rotatePoint(points[2][0], points[2][1], cx, cy, cosTheta, sinTheta);
        const p4 = rotatePoint(points[3][0], points[3][1], cx, cy, cosTheta, sinTheta);

        shape.a1 = p1[0];
        shape.a2 = p2[0];
        shape.a3 = p3[0];
        shape.a4 = p4[0];
        shape.b1 = p1[1];
        shape.b2 = p2[1];
        shape.b3 = p3[1];
        shape.b4 = p4[1];
    } else if (shape.type === "triangle") {
        const p1 = rotatePoint(points[0][0], points[0][1], cx, cy, cosTheta, sinTheta);
        const p2 = rotatePoint(points[1][0], points[1][1], cx, cy, cosTheta, sinTheta);
        const p3 = rotatePoint(points[2][0], points[2][1], cx, cy, cosTheta, sinTheta);

        shape.a1 = p1[0];
        shape.a2 = p2[0];
        shape.a3 = p3[0];
        shape.b1 = p1[1];
        shape.b2 = p2[1];
        shape.b3 = p3[1];
    }
}

function drawShapePreview() {
    redraw();
    const a1 = shapeTopLeft[0];
    const b1 = shapeTopLeft[1];
    const a2 = mousePos[0];
    const b2 = mousePos[1];
    ctx.beginPath();
    if (currentShape === "rect") {
        ctx.rect(a1, b1, a2 - a1, b2 - b1);
    }
    else if (currentShape === "circle") {
        const radius = 0.5 * Math.min(Math.abs(b2 - b1), Math.abs(a2 - a1));
        const cx = a1 + radius * Math.sign(a2 - a1);
        const cy = b1 + radius * Math.sign(b2 - b1);
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

function drawImagePreview() {
    redraw();
    ctx.lineWidth = imagePreviewLineWidth;
    ctx.strokeStyle = imagePreviewLineColour;
    ctx.globalAlpha = imagePreviewLineAlpha;
    ctx.globalCompositeOperation = 'source-over'
    ctx.beginPath();
    ctx.rect(shapeTopLeft[0], shapeTopLeft[1], mousePos[0] - shapeTopLeft[0], mousePos[1] - shapeTopLeft[1]);
    ctx.stroke();
}

function drawSelectionPreview() {
    redraw();
    const shape = allPaths[allPaths.length - 1];
    ctx.lineWidth = imagePreviewLineWidth;
    ctx.strokeStyle = imagePreviewLineColour;
    ctx.globalAlpha = imagePreviewLineAlpha;
    ctx.globalCompositeOperation = 'source-over';
    let topLeft = [0, 0]
    let bottomRight = [0, 0]
    ctx.beginPath();
    if (shape.type === "rect") {
        topLeft = [Math.min(shape.a1, shape.a2, shape.a3, shape.a4), Math.min(shape.b1, shape.b2, shape.b3, shape.b4)];
        bottomRight = [Math.max(shape.a1, shape.a2, shape.a3, shape.a4), Math.max(shape.b1, shape.b2, shape.b3, shape.b4)];
    }
    else if (shape.type === "triangle") {
        topLeft = [Math.min(shape.a1, shape.a2, shape.a3), Math.min(shape.b1, shape.b2, shape.b3)];
        bottomRight = [Math.max(shape.a1, shape.a2, shape.a3), Math.max(shape.b1, shape.b2, shape.b3)];
    }
    else {
        topLeft = [shape.centerX - shape.radius, shape.centerY - shape.radius];
        bottomRight = [shape.centerX + shape.radius, shape.centerY + shape.radius];
    }
    topLeft[0] -= 30;
    topLeft[1] -= 30;
    bottomRight[0] += 30;
    bottomRight[1] += 30;
    ctx.rect(topLeft[0], topLeft[1], bottomRight[0] - topLeft[0], bottomRight[1] - topLeft[1]);
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

function getEventCoordinates(event) {
    if (event.touches && event.touches.length > 0) {
        return { x: event.touches[0].clientX, y: event.touches[0].clientY };
    }

    else if (event.changedTouches && event.changedTouches.length > 0) {
        return { x: event.changedTouches[0].clientX, y: event.changedTouches[0].clientY };
    }

    return { x: event.clientX, y: event.clientY };
}

function setMousePos(event) {
    const canvasRect = canvas.getBoundingClientRect();
    lastMousePos = [mousePos[0], mousePos[1]];

    const scaleX = canvas.width / canvasRect.width;
    const scaleY = canvas.height / canvasRect.height;

    let mouseX = (event.clientX - canvasRect.left) * scaleX;
    let mouseY = (event.clientY - canvasRect.top) * scaleY;
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
    shapeSelected = false;
    textBoxMode = false;
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
    if (pressedKeys["Control"] === true && pressedKeys["y"] === true) {
        redo();
    }
    else if (pressedKeys["Control"] === true && pressedKeys["z"] === true) {
        undo();
    }
}
function keyUp(event) {
    pressedKeys[event.key] = false
}

function mouseDown(event) {
    console.log("Element clicked:", event.target);
    canvas.setPointerCapture(event.pointerId);

    setMousePos(event);

    if (imageMode) {
        shapeTopLeft = [mousePos[0], mousePos[1]];
        drawingImage = true;
        return;
    }
    if (textBoxMode) {
        shapeTopLeft = [mousePos[0], mousePos[1]];
        drawingText = true;
        return;
    }
    if (shapeMode) {
        shapeTopLeft = [mousePos[0], mousePos[1]];
        drawingShape = true;
        return
    }
    if (!selectMode) {
        startPath();
        return;
    }
    const clickX = mousePos[0];
    const clickY = mousePos[1];

    for (let i = allPaths.length - 1; i >= 0; i--) {
        const item = allPaths[i];
        if (item.type === "rect" || item.type === "triangle" || item.type === "circle") {
            if (!mouseInteriorCheck(i)) {
                continue;
            }
            allPaths.push(allPaths.splice(i, 1)[0]);
            initalShape = structuredClone(item);
            shapeSelectInitialMousePos = mousePos;
            shapeSelected = true;
            return;
        }
        else if (item.type === 'text') {
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
    canvas.releasePointerCapture(event.pointerId);
    if (shapeMode) {
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
        return;
    }
    else if (imageMode) {
        if (mousePos[0] - shapeTopLeft[0] > 5 && mousePos[1] - shapeTopLeft[1] > 5) {
            insertImage(mousePos[0], mousePos[1]);
        }
        resetStrokeSettings();
        drawingImage = false;
    }
    else if (textBoxMode) {
        if (mousePos[0] - shapeTopLeft[0] > 5 && mousePos[1] - shapeTopLeft[1] > 5) {
            insertText(mousePos[0], mousePos[1]);
        }
        resetStrokeSettings();
        drawingText = false;
    }
    else if (selectMode) {
        if (shapeSelected) {
            shapeSelected = false;
            saveState()
        }
    }
    else {
        endPath();
    }
    redraw();
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
    redoPaths = [];
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
    if (allPaths.length > 0) {
        redoPaths.push(allPaths.pop());
        redraw();
        saveState();
    }
}

function redo() {
    if (redoPaths.length > 0) {
        allPaths.push(redoPaths.pop());
        redraw();
        saveState();
    }
}

function update() {
    updateCurrentPath();
    if (shapeSelected) {
        drawSelectionPreview();
        if (pressedKeys["r"] === true) {
            rotateShape();
        }
        else {
            moveShape();
        }
    }
    if (drawingShape) {
        drawShapePreview();
    }
    if (drawingImage || drawingText) {
        drawImagePreview();
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

const clearButton = document.getElementById("clearButton");
clearButton.addEventListener("click", clearCanvas);

canvas.style.touchAction = "none";

canvas.addEventListener('pointermove', setMousePos);
canvas.addEventListener('pointerdown', mouseDown);
canvas.addEventListener('pointerup', mouseUp);

canvas.addEventListener('pointercancel', mouseUp);

loadState();