const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
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

function toggleEraserMode()
{
    /*check functionality*/
    erarserMode = !erarserMode
    if (erarserMode)
    {
        ctx.globalCompositeOperation = 'destination-out';
    }
    else
    {
        ctx.globalCompositeOperation = 'source-over';
    }
}

/* INPUT CHECKS */

function setMousePos(event)
{
    const canvasRect = canvas.getBoundingClientRect();
    mouseX = event.clientX - canvasRect.left;
    mouseY = event.clientY - canvasRect.top;
    mousePos = [mouseX, mouseY];
    update();
}

function keyDown(event)
{
    pressedKeys[event.key] = true
    if (event.key === "e")
    {
        toggleEraserMode();
    }
    if (event.key === "p")
    {
        console.log(allPaths)
    }
    if (pressedKeys["Control"] === true && pressedKeys["z"] === true)
    {
        undo();
    }
}
function keyUp(event)
{
    pressedKeys[event.key] = false
}

function mouseDown(event)
{
    /* check if mouse is in canvas*/
    startPath()
}

function mouseUp(event)
{
    /* check if mouse is in canvas*/
    endPath()
}

function startPath()
{
    currentPath = new Path2D();
    currentPath.moveTo(mousePos[0], mousePos[1]);
    penDown = true
}
function updateCurrentPath()
{
    if (!penDown)
    {
        return;
    }
    currentPath.lineTo(mousePos[0], mousePos[1]);
    draw();
}
function endPath()
{
    allPaths.push(currentPath);
    penDown = false
}

function draw()
{
    ctx.stroke(currentPath);
}

function undo()
{
    allPaths.pop()
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < allPaths.length; i++) 
    {
        ctx.stroke(allPaths[i]);
    }
}

function update()
{
    updateCurrentPath();
}


document.addEventListener("keydown", keyDown);
document.addEventListener("keyup", keyUp);

window.addEventListener('mousemove', setMousePos);

document.addEventListener('mousedown', mouseDown);

document.addEventListener('mouseup', mouseUp);