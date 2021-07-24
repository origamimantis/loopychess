'use strict';

let hostname = "https://foonkychess.herokuapp.com/:4445"
//let hostname = document.getElementById("host").getAttribute("hostname");


let socket;


function debug(stuff)
{
  socket.emit("debug", stuff);
}

const NUMLAYER = 3;

const BOARD_LEFT = 0;
const BOARD_TOP  = 0;


const PAWN = "pawn";
const KNIGHT = "knight";
const BISHOP = "bishop";
const ROOK = "rook";
const QUEEN = "queen";
const KING = "king";

const WHITE = 1;
const BLACK = -1;

let color2text = {0:"Spectating"};
color2text[WHITE] = "White";
color2text[BLACK] = "Black";

const A = 1;
const B = 2;
const C = 3;
const D = 4;
const E = 5;
const F = 6;
const G = 7;
const H = 8;



let canvases = document.getElementById("canvases");
let ctx = [];

for (let i = 0; i < NUMLAYER; i++)
{
  let can = canvases.appendChild(document.createElement("canvas"));
  can.id = "canvas-" + i.toString();
  can.width = 760;
  can.height = 640;
  can.style.position = "absolute";
  can.style.background = "transparent";
  can.style.left = BOARD_LEFT;
  can.style.top  = BOARD_TOP;

  ctx.push(can.getContext('2d'));
  ctx[i].fillStyle = "blue";
  ctx[i].textBaseline = "top";
  ctx[i].textAlign = "center";
}
ctx[2].font = "20px arial";

function loadImg(fname)
{
  return new Promise((resolve) =>
    {
      let img = new Image();
      img.onload = () => {resolve(img);};
      img.src = fname;
    })
}

async function loadPieceImgs()
{
  let d = {}
  for (let piece of [PAWN,KNIGHT,BISHOP,ROOK,QUEEN,KING])
  {
    d[piece+"_w"] = await loadImg("assets/" + piece + "_w.png");
    d[piece+"_b"] = await loadImg("assets/" + piece + "_b.png");
  }
  return d
}




// text with wrapping
function drawText(l, text, x, y, maxWidth = undefined)
{
  if (typeof text == "string")
  {
    let height = ctx[l].font.substring(0,2)*1.5;
    let lines = text.split('\n');
    for (let i = 0; i<lines.length; ++i)
      ctx[l].fillText(lines[i], x, y + i*height, maxWidth);
  }
  else
  {
    ctx[l].fillText(text, x, y, maxWidth);
  }

}
// https://stackoverflow.com/questions/25095548/how-to-draw-a-circle-in-html5-canvas-using-javascript
function drawCircle(l, x, y, radius, fill = false, stroke=true, strokeWidth=4)
{
  ctx[l].beginPath()
  ctx[l].arc(x, y, radius, 0, 2 * Math.PI, false)
  if (fill)
  {
    ctx[l].fillStyle = fill
    ctx[l].fill()
  }
  if (stroke)
  {
    ctx[l].lineWidth = strokeWidth
    ctx[l].strokeStyle = stroke
    ctx[l].stroke()
  }
}

let board_bg = null;
let piece_imgs = null;

function drawBoard()
{
  ctx[0].drawImage(board_bg, BOARD_LEFT, BOARD_TOP);
}
function drawPieces(grid)
{
  ctx[1].clearRect(0,0,760,640);

  for (let i = 0; i < 8; ++i)
  {
    for (let j = 0; j < 8; ++j)
    {
      let p = grid[j][i];
      if (p === null)
	continue
      if (color == BLACK)
	ctx[1].drawImage(piece_imgs[p.type + "_" + (p.color == BLACK ? "b" : "w")], ...idx2board(7-i-0.5,8-j-0.5));
      else
	ctx[1].drawImage(piece_imgs[p.type + "_" + (p.color == BLACK ? "b" : "w")], ...idx2board(i-0.5,j+0.5));
    }
  }
}

function idx2board(i, j)
{
  return [BOARD_LEFT + i*64 + 32, BOARD_TOP + (8-j)*64 - 32];
}
function board2idx(x, y)
{
  return [Math.floor((x-BOARD_LEFT)/64), 7-Math.floor((y-BOARD_TOP)/64)]
}

function selectPiece(i,j,p)
{
  ctx[2].fillText(p.type, 600, 256)
  let m = getMovableWithoutPin(i, j, p);
  m.forEach( (v) => 
    {
      let v2 = [...v]
      if (color == BLACK)
      {
	v2[0] = 7-v2[0];
	v2[1] = 7-v2[1];
      }
      drawCircle(2, ...idx2board(...v2), 30);
    });
  return m;
}


function addIfEmpty(m, i, j)
{
  if (0 <= i && i < 8 && 0 <= j && j < 8 && curGrid[j][i] === null)
  {
    m.add([i,j])
    return true;
  }
  return false;
}

function addIfCapture(m, i, j, color)
{
  if (0 <= i && i < 8 && 0 <= j && j < 8 && curGrid[j][i] !== null && curGrid[j][i].color !== color)
  {
    m.add([i,j]);
    return true;
  }
  return false;
    
}

function getMovableWithoutPin(i, j, p)
{
  let m = new Set();
  switch (p.type)
  {
    case PAWN:
      let direction = p.color;
      if (addIfEmpty(m, i, j+direction))
      {
	// 2 spaces if on starting row, but no jumps
	if ((j-direction)%7 == 0)
	  addIfEmpty(m, i, j+2*direction)
      }

      // captures
      addIfCapture(m, i+1, j+direction, p.color)
      addIfCapture(m, i-1, j+direction, p.color)
      
      // TODO: en passant
      break;
    case KNIGHT:
      for (let Li of [ i-2, i+2])
      {
	for (let Lj of [ j-1, j+1 ])
	{
	  if (addIfEmpty(m, Li, Lj) == false)
	    addIfCapture(m, Li, Lj, p.color);
	}
      }
      for (let Lj of [ j-2, j+2])
      {
	for (let Li of [ i-1, i+1 ])
	{
	  if (addIfEmpty(m, Li, Lj) == false)
	    addIfCapture(m, Li, Lj, p.color);
	}
      }
      break;
    case QUEEN:
    case BISHOP:
      for (let [dx, dy] of [[1,1], [1,-1], [-1,1], [-1,-1]])
      {
        let movable = true;
	let ni = i;
	let nj = j;
	while (movable == true)
	{
	  ni += dx;
	  nj += dy;
	  movable = addIfEmpty(m, ni, nj);
	}
	addIfCapture(m, ni, nj, p.color);
      }
      
      if (p.type == BISHOP)
	break;
    case ROOK:
      for (let [dx, dy] of [[0,1], [0,-1], [1,0], [-1,0]])
      {
        let movable = true;
	let ni = i;
	let nj = j;
	while (movable == true)
	{
	  ni += dx;
	  nj += dy;
	  movable = addIfEmpty(m, ni, nj);
	}
	addIfCapture(m, ni, nj, p.color);
      }
      break;
    case KING:
      break;

      
  }
  return m;
}





let getMethods = (obj) => Object.getOwnPropertyNames(obj).filter(item => typeof obj[item] === 'function')

let curGrid = null;

const states = {
  WAITING: 0,
  TURNSTART: 1,
  PIECESELECTED: 2,
  OVER: 3
}


function coordInSet(s, i, j)
{
  let c = [...s]
  for (let [m, n] of c)
  {
    if (m == i && n == j)
      return true;
  }
  return false;
}

function getColor(number)
{
  let a = null;
  let b = null

  if (number == 1)
  {
    a = WHITE;
    b = "White";
  }
  else if (number == 2)
  {
    a = BLACK;
    b = "Black";
  }
  else
  {
    a = 0;
    b = "Spectating";
  }
  return [a,b];
}

function click2board(i, j)
{
  if (color == BLACK)
  {
    return [7-i, 7-j];
  }
  else
    return [i,j];
}



let color = null;
let colorText = null;

let curState = states.WAITING;
let curCoord = null;
let curTurn = null;
let allowedMoves = null;

window.onload = async () => {


  piece_imgs = await loadPieceImgs();
  board_bg = await loadImg("board.png");

  socket = io.connect(hostname);
  
  socket.on("id", (e) => {

    [color, colorText] = getColor(e.number);

    socket.emit("board_request")
    curState = states.TURNSTART;
    document.getElementById("curRoom").textContent = "Current room: " + e.id;
    document.getElementById("colorText").textContent = "You are: " + colorText;
  });
  
  socket.on("board_update", (e) => {

    curGrid = e.board.grid;
    curTurn = e.board.turn;
    console.log(color2text, curTurn);
    document.getElementById("curTurn").textContent =  color2text[curTurn] + " to move.";

    drawBoard()
    drawPieces(e.board.grid)
    curState = states.TURNSTART;
  });

  window.onmousedown = (e) => {
    // ignore left, middle click
    if (e.which != 1)
      return

    let [i, j] = board2idx(e.offsetX, e.offsetY);
    
    ctx[2].clearRect(0,0,760, 640)

    if (0 <= i && i < 8 && 0 <= j && j < 8)
    {
      [i,j] = click2board(i,j);
      // clicked inside the board
      if (curCoord !== null)
      {
	if (color == curTurn && coordInSet(allowedMoves, i, j))
	{
	  socket.emit("make_move", {ini: curCoord, fin: [i,j]});
	}
	curState = states.TURNSTART;
	curCoord = null;
	allowedMoves = null;
      }
      if (curCoord === null)
      {
	let p = curGrid[j][i];
	if (p !== null)
	{
	  if (p.color == color)
	  {
	    allowedMoves = selectPiece(i,j,p)
	    curCoord = [i,j];
	    if (curTurn == color)
	      curState = states.PIECESELECTED;
	  }
	}
	else
	{
	  curCoord = null;
	}
      }
      
    }
    else
    {
      // clicked outside the board
    }


  }

}
