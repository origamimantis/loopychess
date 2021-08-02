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


let socket;


function debug(stuff)
{
  socket.emit("debug", stuff);
}

const NUMLAYER = 3;

const BOARD_LEFT = 32;
const BOARD_TOP  = 32;


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

const number2letter = "_ABCDEFGH";
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
  ctx[i].font = "20px Courier New, monospace";
  ctx[i].textBaseline = "middle"
  //ctx[i].textAlign = "center"
}

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
  ctx[l].arc(x + 32, y + 32, radius, 0, 2 * Math.PI, false)
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


function clearCanvas()
{
  for (let i = 0; i < NUMLAYER; i++)
    ctx[i].clearRect(0,0,760, 640)
}
function drawBoard()
{
  ctx[0].drawImage(board_bg, BOARD_LEFT, BOARD_TOP);
  ctx[0].fillStyle = "black";
  for (let i = 0; i < 8; ++i)
  {
    let l = i;
    if (color == BLACK)
      l = 7-l;
    l += 1;
    drawText(0, number2letter[l], ...idx2board(i + 0.5,  7.25, true))
    drawText(0, number2letter[l], ...idx2board(i + 0.5, -1.25, true))

    drawText(0, l, ...idx2board( 8.25, i - 0.5, true))
    drawText(0, l, ...idx2board(-0.25, i - 0.5, true))
  }
}
function erasePiece(i,j)
{
  ctx[1].clearRect(...idx2board(i,j), 64,64);
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
      let ext = "_" + (p.color == BLACK ? "b" : "w");
      ctx[1].drawImage(piece_imgs[p.type + ext], ...idx2board(i,j));
    }
  }
  let attackers = inCheck(color, grid);
  
  attackers.forEach( (v) => 
    {
      drawCircle(1, ...idx2board(...v), 24, false, "red");
    });
}

function drawPromotionMenu(i)
{
  let ext = "_" + (color == BLACK ? "b" : "w");
  ctx[2].fillStyle = "blue";
  ctx[2].fillRect(...idx2board(i,7), 64, 256);
  for (let j = 0; j < 4; ++j)
  {
    ctx[2].drawImage(piece_imgs[promotionChoices[j] + ext], ...idx2board(i,7-j));
  }
}

function idx2board(i, j, ignorecolor = false)
{
  if (ignorecolor == false && color == BLACK)
  {
    i = 7-i;
    j = 7-j;
  }
  i -= 0.5;
  j -= 0.5;
  let x = BOARD_LEFT + i*64 + 32;
  let y = BOARD_TOP + (7-j)*64 - 32;
  return [x,y]
}
function board2idx(x, y)
{
  return [Math.floor((x-BOARD_LEFT)/64), 7-Math.floor((y-BOARD_TOP)/64)]
}

function selectPiece(i,j,board_)
{
  let p = board_[j][i];

  let m = getMovable(i, j, board_).all;
  
  m.forEach( (v) => 
    {
      let [i,j] = JSON.parse(v);
      if (board_[j][i] === null)
      {
	ctx[2].globalAlpha = 0.3;
	drawCircle(2, ...idx2board(i,j), 10, "black", false);
      }
      else
      {
	ctx[2].globalAlpha = 0.5;
	drawCircle(2, ...idx2board(i,j), 30);
      }
    });
  ctx[2].globalAlpha = 1;

  return m;
}


function addIfEmpty(m, i, j, board_)
{
  i = (i+8) % 8;
  if (0 <= j && j < 8 && board_[j][i] === null)
  // classic
  //if (0 <= i && i < 8 && 0 <= j && j < 8 && board_[j][i] === null)
  {
    for (let s of m)
      s.add(JSON.stringify([i,j]));
    return true;
  }
  return false;
}

function addIfCapture(m, i, j, color, board_)
{
  i = (i+8) % 8;
  if (0 <= j && j < 8 && board_[j][i] !== null && board_[j][i].color !== color)
  // classic
  //if (0 <= i && i < 8 && 0 <= j && j < 8 && board_[j][i] !== null && board_[j][i].color !== color)
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

function getMovable(i,j,board_)
{
  let m = getMovableWithoutPin(i, j, board_);
  
  let marray = Array.from(m.all);
  for (let c of marray)
  {
    let [i1,j1] = JSON.parse(c);
    let ifMoved = copyBoard(board_);
    ifMoved[j1][i1] = ifMoved[j][i];
    ifMoved[j][i] = null;
    if (inCheck(board_[j][i].color, ifMoved).length > 0)
    {
      m.all.delete(c);
      m.atk.delete(c);
      m.mov.delete(c);
    }
  }
  return m;
}


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


function canMove(player, board_)
{
  for (let i = 0; i < 8; ++i)
  {
    for (let j = 0; j < 8; ++j)
    {
      let p = board_[j][i];
      if (p !== null && p.color == player)
      {
	let m = getMovable(i,j,board_).all;
	if (m.size > 0)
	  return true;
      }
    }
  }
  return false;
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





let curGrid = null;

const states = {
  WAITING: 0,
  TURNSTART: 1,
  PIECESELECTED: 2,
  OVER: 3
}

let notate = {};
notate[PAWN] = "";
notate[KNIGHT] = "N";
notate[BISHOP] = "B";
notate[ROOK] = "R";
notate[QUEEN] = "Q";
notate[KING] = "K";

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

/*
function invert(img)
{
  return new Promise( (resolve) =>
  {
    let can = document.createElement("canvas");
    let ctx = can.getContext("2d");
    ctx.imageSmoothingEnabled = false;

    let w = img.width;
    let h = img.height;

    can.width = w;
    can.height = h;

    ctx.drawImage(img, 0, 0, w, h);

    let imageData = ctx.getImageData(0, 0, w, h);

    for (let i = 0; i < imageData.data.length; i += 4)
    {
      let slice = imageData.data.slice(i, i+4);
      if (slice[3] == 255)
      {
	slice[0] = 255-slice[0];
	slice[1] = 255-slice[1];
	slice[2] = 255-slice[2];
      }
      imageData.data.set(slice, i);
    }

    ctx.putImageData(imageData,0,0);

    let nImg = new Image();
    nImg.src = can.toDataURL('image/png');

    nImg.onload = ()=>{resolve(nImg)};
  })
}
*/
function toWritten(c)
{
  let [i,j] = c;
  return number2letter[i+1].toLowerCase() + (j+1).toString();
}


// each move maxlen 7, will make 12
function formatMoves(moves)
{
  let moves2 = [];
  let s = 2;
  for (let m of moves)
  {
    if (s >= 2)
    {
      moves2.push([]);
      s = 0;
    }
    moves2[moves2.length-1].push(m);    s += 1;
  }
  for (let i = 0; i < moves2.length; ++i)
  {
    if (moves2[i].length == 2)
      moves2[i] = moves2[i][0]+ " ".repeat(10-moves2[i][0].length) + moves2[i][1];
    else
      moves2[i] = moves2[i][0];
    let num = (i+1).toString() + ".";
    moves2[i] = num + " ".repeat(6-num.length) + moves2[i];
  }
  return moves2.join("\r\n");
}



let users = []


let color = null;
let colorText = null;

let promoting = false;
let promoteCoord = null;
let curCoord = null;
let curTurn = null;
let allowedMoves = null;

let gameOver = false;

const promotionChoices = [QUEEN, KNIGHT, ROOK, BISHOP];

window.onload = async () => {

  document.getElementById("joincopy").textContent += "/join/"+id.toLowerCase();
  document.getElementById("curRoom").textContent = "Current room: " + id;

  piece_imgs = await loadPieceImgs();
  board_bg = await loadImg("board.png");
  drawBoard();

  socket = io.connect(hostname);
  
  await MusicPlayer.loadMusic();
  socket.emit("pair", {id:id, name:name});


  socket.on("paired", async (e) => {

    MusicPlayer.playbase();

  });

  socket.on("users_update", (e) => {

    users = e.info;
    color = users[e.i].team;

    colorText = color2text[color];

    document.getElementById("colorText").textContent = "You are: " + colorText;

    let maxlen = 0;
    for (let i = 0; i < users.length; ++i)
      if (users[i].name.length > maxlen)
	maxlen = users[i].name.length;

    let a2 = ["Users:"];

    for (let i = 0; i < users.length; ++i)
      a2.push(users[i].name+" ".repeat(maxlen - users[i].name.length + 4)+color2text[users[i].team]);
    document.getElementById("userlist").textContent = a2.join("\r\n");
    
    let h = document.getElementById("hiddenplayers");
    if (users.length >= 2 && h.textContent.length == 0)
    {
      h.textContent = a2[1]+"\r\n"+a2[2];
    }
    
    socket.emit("board_request")
  });
  
  socket.on("board_update", (e) => {

    curGrid = e.board.grid;
    curTurn = e.board.turn;

    MusicPlayer.playfx("move");

    clearCanvas();
    drawBoard();
    drawPieces(e.board.grid);
    
    let mhe = document.getElementById("movehistory");
    mhe.textContent = formatMoves(e.moves);
    mhe.scrollTop = mhe.scrollHeight;

    let hasmove = canMove(curTurn, curGrid);
    let checked = inCheck(curTurn, curGrid).length > 0;
    if (hasmove == true)
    {
      document.getElementById("curTurn").textContent =  color2text[curTurn] + " to move.";
    }
    else
    {
      MusicPlayer.stop("base")
      if (checked == true)
      {
	document.getElementById("curTurn").textContent =  color2text[-curTurn] + " is victorious!";
	if (color != curTurn)
	  MusicPlayer.playfx("win");
	else
	  MusicPlayer.playfx("lose");
      }
      else
      {
	document.getElementById("curTurn").textContent =  "Stalemate...";
	MusicPlayer.playfx("draw");
      }
      gameOver = true;
      document.getElementById("downloadmoves").hidden = false;
      return
    }
    let mechecked = inCheck(color, curGrid).length > 0;
    let enchecked = inCheck(-color, curGrid).length > 0;

    MusicPlayer.stoplayer("good")
    MusicPlayer.stoplayer("bad")
    if (mechecked)
    {
      MusicPlayer.playfx("checked");
      MusicPlayer.playlayer("bad");
    }
    else if (enchecked)
    {
      MusicPlayer.playfx("checking");
      MusicPlayer.playlayer("good");
    }
  });

  window.onmousedown = (e) => {
    // ignore left, middle click
    if (e.which != 1)
      return

    if (gameOver)
      return;

    let [i, j] = board2idx(e.offsetX, e.offsetY);
    
    if (0 <= i && i < 8 && 0 <= j && j < 8)
    {
      [i,j] = click2board(i,j);
      // clicked inside the board
      if (curCoord !== null)
      {

	if (promoting == false)
	{
	  ctx[2].clearRect(0,0,760, 640)
	  if (color == curTurn && coordInSet(allowedMoves, i, j))
	  {
	    let piecemoved = curGrid[curCoord[1]][curCoord[0]];
	    let dest = curGrid[j][i];

	    if (piecemoved.type == PAWN &&
	      ( (color == BLACK && j == 0) || (color == WHITE && j == 7) ) )
	    {
	      promoting = true;
	      promoteCoord = [i,j];
	      erasePiece(...curCoord);
	      drawPromotionMenu(i);
	      return;
	    }
	    let lastMove;
	    if (piecemoved.type == KING && Math.abs(i-curCoord[0]) == 2)
	    {
	      if (i > curCoord[0])
		lastMove = "0-0";
	      else
		lastMove = "0-0-0";
	    }
	    else
	    {
	      lastMove = notate[piecemoved.type] + toWritten(curCoord);
	      if (dest !== null)
		lastMove += "x";
	      lastMove += toWritten([i,j]);


	      let next = copyBoard(curGrid);
	      next[j][i] = next[curCoord[1]][curCoord[0]];
	      next[curCoord[1]][curCoord[0]] = null;
	      let enemyCanMove = canMove(-curTurn, next);
	      let enemyChecked = inCheck(-curTurn, next).length > 0;

	      if	(enemyCanMove && enemyChecked)
		  lastMove += "+";
	      else if (enemyCanMove == false && enemyChecked)
		  lastMove += "#";
	      else if (enemyCanMove == false && enemyChecked == false)
		  lastMove += "sm"
	      
	      socket.emit("make_move", {ini: curCoord, fin: [i,j], note: lastMove});
	    }
	  }
	  let ret = false
	  if (i == curCoord[0] && j == curCoord[1])
	    ret = true;

	  curCoord = null;
	  allowedMoves = null;

	  if (ret)
	    return
	}
	else if (promoting == true)
	{
	  // queen, knight, rook, bishop seems to be the order on chess.com and lichess

	  if (i != promoteCoord[0] || Math.abs(j-promoteCoord[1]) > 3 )
	  {
	    // did not click inside menu, but do not let them cancel the promotion
	    // hehehehehhe
	    return
	  }
	  else
	  {
	    let newpiece = promotionChoices[Math.abs(j - promoteCoord[1])]
	    let lastMove;

	    lastMove = toWritten(curCoord);
	    lastMove += (curGrid[promoteCoord[1]][promoteCoord[0]] === null)? " ":"x";
	    lastMove += toWritten(promoteCoord);
	    lastMove += "=" + notate[newpiece];

	    let next = copyBoard(curGrid);
	    next[promoteCoord[1]][promoteCoord[0]] = next[curCoord[1]][curCoord[0]];
	    next[curCoord[1]][curCoord[0]] = null;
	    next[promoteCoord[1]][promoteCoord[0]].type = newpiece;

	    let enemyCanMove = canMove(-curTurn, next);
	    let enemyChecked = inCheck(-curTurn, next).length > 0;

	    if	    (enemyCanMove && enemyChecked)
		lastMove += "+";
	    else if (enemyCanMove == false && enemyChecked)
		lastMove += "#";
	    else if (enemyCanMove == false && enemyChecked == false)
		lastMove += "(stalemate xd)";

	    socket.emit("make_move", {ini: curCoord, fin: promoteCoord, note: lastMove, promote: newpiece});
	    promoting = false;
	    promoteCoord = null;
	  }

	}

      }
      if (curCoord === null)
      {
	let p = curGrid[j][i];
	if (p !== null)
	{
	  if (p.color == color)
	  {
	    allowedMoves = selectPiece(i,j,curGrid)

	    if (allowedMoves.size > 0)
	      curCoord = [i,j];
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
