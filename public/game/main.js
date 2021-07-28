'use strict';

let realurl = window.location.href;

let hostname = document.getElementById("host").getAttribute("hostname");

// url parsing

let [path, params] = realurl.split("?");
window.history.pushState({}, document.title, window.location.pathname);

let searchParams = new URLSearchParams(params);




path = path.split("/");
let id = path[path.length-1];

if (searchParams.has("name") === false)
  window.location.replace("/join/"+id);

let name = searchParams.get("name");

console.log(name);


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
  let attackers = inCheck(color, grid);
  
  attackers.forEach( (v) => 
    {
      let v2 = [...v]
      if (color == BLACK)
      {
	v2[0] = 7-v2[0];
	v2[1] = 7-v2[1];
      }
      drawCircle(1, ...idx2board(...v2), 24, false, "red");
    });
}

function idx2board(i, j)
{
  return [BOARD_LEFT + i*64 + 32, BOARD_TOP + (8-j)*64 - 32];
}
function board2idx(x, y)
{
  return [Math.floor((x-BOARD_LEFT)/64), 7-Math.floor((y-BOARD_TOP)/64)]
}

function selectPiece(i,j,board_)
{
  let p = board_[j][i];
  ctx[2].fillText(p.type, 600, 256)

  let m = getMovableWithoutPin(i, j, board_).all;
  
  let marray = Array.from(m);
  for (let c of marray)
  {
    let [i1,j1] = JSON.parse(c);
    let ifMoved = copyBoard(board_);
    ifMoved[j1][i1] = ifMoved[j][i];
    ifMoved[j][i] = null;
    if (inCheck(p.color, ifMoved).length > 0)
      m.delete(c)
  }


  m.forEach( (v) => 
    {
      let v2 = [...JSON.parse(v)]
      if (color == BLACK)
      {
	v2[0] = 7-v2[0];
	v2[1] = 7-v2[1];
      }
      drawCircle(2, ...idx2board(...v2), 30);
    });
  




  return m;
}


function addIfEmpty(m, i, j, board_)
{
  if (0 <= i && i < 8 && 0 <= j && j < 8 && board_[j][i] === null)
  {
    for (let s of m)
      s.add(JSON.stringify([i,j]));
    return true;
  }
  return false;
}

function addIfCapture(m, i, j, color, board_)
{
  if (0 <= i && i < 8 && 0 <= j && j < 8 && board_[j][i] !== null && board_[j][i].color !== color)
  {
    for (let s of m)
      s.add(JSON.stringify([i,j]));
    return true;
  }
  return false;
    
}

function copyBoard(board_)
{
  return JSON.parse(JSON.stringify(board_))
}

let diags = [[1,1], [1,-1], [-1,1], [-1,-1]];
let orthogs = [[0,1], [0,-1], [1,0], [-1,0]];


function getMovableWithoutPin(i, j, board_)
{
  let p = board_[j][i];


  let mov = new Set();
  let atk = new Set();
  let all = new Set();
  switch (p.type)
  {
    case PAWN:
      let direction = p.color;
      if (addIfEmpty([mov, all], i, j+direction, board_))
      {
	// 2 spaces if on starting row, but no jumps
	if ((j-direction)%7 == 0)
	  addIfEmpty([mov, all], i, j+2*direction, board_)
      }

      // captures
      addIfCapture([atk, all], i+1, j+direction, p.color, board_)
      addIfCapture([atk, all], i-1, j+direction, p.color, board_)
      
      // TODO: en passant
      for (let dx of [-1, 1])
      {
	let thing = board_[j][i+dx];
	if (thing && thing.type == PAWN && thing.color != p.color && thing.en_passant_capturable == true)
	{
	  addIfEmpty([atk, all], i+dx, j+direction, board_);
	}
      }

      break;
    case KNIGHT:
      for (let Li of [ i-2, i+2])
      {
	for (let Lj of [ j-1, j+1 ])
	{
	  if (addIfEmpty([atk, all], Li, Lj, board_) == false)
	    addIfCapture([atk, all], Li, Lj, p.color, board_);
	}
      }
      for (let Lj of [ j-2, j+2])
      {
	for (let Li of [ i-1, i+1 ])
	{
	  if (addIfEmpty([atk, all], Li, Lj, board_) == false)
	    addIfCapture([atk, all], Li, Lj, p.color, board_);
	}
      }
      break;
    case QUEEN:
    case BISHOP:
      for (let [dx, dy] of diags)
      {
        let movable = true;
	let ni = i;
	let nj = j;
	while (movable == true)
	{
	  ni += dx;
	  nj += dy;
	  movable = addIfEmpty([atk, all], ni, nj, board_);
	}
	addIfCapture([atk, all], ni, nj, p.color, board_);
      }
      
      if (p.type == BISHOP)
	break;
    case ROOK:
      for (let [dx, dy] of orthogs)
      {
        let movable = true;
	let ni = i;
	let nj = j;
	while (movable == true)
	{
	  ni += dx;
	  nj += dy;
	  movable = addIfEmpty([atk, all], ni, nj, board_);
	}
	addIfCapture([atk, all], ni, nj, p.color, board_);
      }
      break;
    case KING:
      for (let [dx, dy] of diags.concat(orthogs) )
      {
	if (addIfEmpty([atk, all], i+dx, j+dy, board_) == false)
	  addIfCapture([atk, all], i+dx, j+dy, p.color, board_);
      }
      // castle,              but not out of check
      if (p.moved == false && inCheck(p.color, board_, true).length == 0)
      {
	// king-side
	if (board_[j][5] === null && board_[j][6] === null
	  && board_[j][7] !== null && board_[j][7].moved == false)
	{
	  let through = true
	  for (let v of [5,6])
	  {
	    let tmp = copyBoard(board_);
	    tmp[j][v] = board_[j][i];
	    tmp[j][i] = null;
	    if (inCheck(p.color, tmp).length > 0)
	    {
	      through = false;
	      break;
	    }
	  }
	  if (through == true)
	    addIfEmpty([mov, all], 6, j, board_);
	}
	// queen-side
	if (board_[j][3] === null && board_[j][2] === null
	  && board_[j][0] !== null && board_[j][0].moved == false)
	{
	  let through = true
	  for (let v of [3,2])
	  {
	    let tmp = copyBoard(board_);
	    tmp[j][v] = board_[j][i];
	    tmp[j][i] = null;
	    if (inCheck(p.color, tmp).length > 0)
	    {
	      through = false;
	      break;
	    }
	  }
	  if (through == true)
	    addIfEmpty([mov, all], 2, j, board_);
	}
      }
      break;
  }
  return {mov:mov, atk:atk, all:all};
}



function inCheck(player, board_, ignoreKing = false)
{
  let enemy = -player;
  let pking = null;
  let epieces = [];
  for (let i = 0; i < 8; ++i)
  {
    for (let j = 0; j < 8; ++j)
    {
      if (board_[j][i] !== null)
      {
	if (board_[j][i].color == enemy)
	{
	  if (ignoreKing == false || board_[j][i].type != KING)
	    epieces.push([i,j])
	}
	else if (board_[j][i].type == KING && board_[j][i].color == player)
	  pking = [i,j];
      }
    }
  }
  let attackers = [];
  for (let [i,j] of epieces)
  {
    let m = getMovableWithoutPin(i, j, board_).atk;
    if (coordInSet(m, ...pking))
      attackers.push([i,j])
  }
  return attackers;
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
  return s.has(JSON.stringify([i,j]));
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


let users = []


let color = null;
let colorText = null;

let curState = states.WAITING;
let curCoord = null;
let curTurn = null;
let allowedMoves = null;

window.onload = async () => {

  document.getElementById("joincopy").textContent += "/join/"+id.toLowerCase();
  document.getElementById("curRoom").textContent = "Current room: " + id;

  piece_imgs = await loadPieceImgs();
  board_bg = await loadImg("board.png");
  drawBoard();

  socket = io.connect(hostname);
  
  socket.emit("pair", {id:id, name:name});

  socket.on("users_update", (e) => {

    users = e.info;
    color = users[e.i].team;

    colorText = color2text[color];

    curState = states.TURNSTART;

    document.getElementById("colorText").textContent = "You are: " + colorText;

    let maxlen = 0;
    for (let i = 0; i < users.length; ++i)
      if (users[i].name.length > maxlen)
	maxlen = users[i].name.length;

    let a2 = ["Users:"];

    for (let i = 0; i < users.length; ++i)
      a2.push(users[i].name+" ".repeat(maxlen - users[i].name.length + 4)+color2text[users[i].team]);
    document.getElementById("userlist").textContent = a2.join("\r\n");
    
    socket.emit("board_request")
  });
  
  socket.on("board_update", (e) => {

    curGrid = e.board.grid;
    curTurn = e.board.turn;
    
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
	let ret = false
	if (i == curCoord[0] && j == curCoord[1])
	  ret = true;

	curState = states.TURNSTART;
	curCoord = null;
	allowedMoves = null;

	if (ret)
	  return

      }
      if (curCoord === null)
      {
	let p = curGrid[j][i];
	if (p !== null)
	{
	  if (p.color == color)
	  {
	    allowedMoves = selectPiece(i,j,curGrid)

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
