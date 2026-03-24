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
let selectMode = false

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

function toggleSelectMode()
{
    selectMode = !selectMode;
    selectButton.classList.toggle("toggled");
    if (!selectMode)
    {
        if(brushType === 0){
            penButtonPressed();
        }
        else
        {
            brushButtonPressed();
        }
        return
    }

    if(eraserMode)
    {
        toggleEraserMode();
    }
    clearToggles();
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

function insertImage() {
    const url = prompt("Enter the image URL:");
    if (url) {
        const img = new Image();
        img.crossOrigin = "anonymous"; 
        img.onload = function() {
            const x = 0
            const y = 0
            const width = img.width / 2;
            const height = img.height / 2;

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

function insertText() {
    const text = prompt("Enter your text:");
    if (text) {
        const x = canvas.width / 4;
        const y = canvas.height / 2;
        
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
        else {
            const isArray = Array.isArray(item);
            ctx.lineWidth = isArray ? item[1] : item.lineWidth;
            ctx.strokeStyle = isArray ? item[2] : item.strokeStyle;
            ctx.globalAlpha = isArray ? item[3] : item.alpha;
            ctx.globalCompositeOperation = isArray ? item[4] : item.composite;
            ctx.stroke(isArray ? item[0] : item.path);
        }
    }
    
    ctx.lineWidth = sizeSlider.value;
    ctx.globalAlpha = opacitySlider.value;
    ctx.strokeStyle = colourPicker.value;
    if (eraserMode)
    {
        ctx.globalCompositeOperation = 'destination-out'
    }
    else
    {
        ctx.globalCompositeOperation = 'source-over'
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
                toggleSelectMode();
                return;
            }
        }
    }
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

const imageButton = document.getElementById("imageButton");
imageButton.addEventListener("click", insertImage);

const textButton = document.getElementById("textButton");
textButton.addEventListener("click", insertText);

const selectButton = document.getElementById("selectButton");
selectButton.addEventListener("click", toggleSelectMode);

loadState();