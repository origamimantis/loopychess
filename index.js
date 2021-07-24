const express = require("express");
var crypto = require('crypto');

const app = express();
let port = process.env.PORT;
if (process.argv[2] == "test")
  port = 4445;

app.use(express.static(__dirname + "/public"));

app.get("/",  (req, res) => {
	res.sendFile( __dirname + "/views/index.html");
});
app.get("/dev",  (req, res) => {
	res.sendFile( __dirname + "/views/indexd.html");
});
app.get("/test",  (req, res) => {
	res.sendFile( __dirname + "/views/test.html");
});

//const favicon = require("serve-favicon");
//app.use(favicon(__dirname + "/public/favicon.ico"));

var http = require('http');

const server = http.createServer(app)
server.listen(port, () => console.log("Live on port " + port));

let cors = {
  origin: "http://foonkychess.herokuapp.com",
  methods: ["GET", "POST"],
  credentials: true};



const { Server } = require("socket.io");
const io = new Server(server, {cors:cors})


let users =
	{
	}


// room = {board: Board, users: [], otherinfo: ...}


//import {Board} from "src/chessboard.js";

const b = require("./src/board.js");
class Room
{
  constructor(id)
  {
    this.board = new b.Board();
    this.users = []
    this.id = id;
  }
  addUser(socket)
  {
    this.users.push(socket);
  }
  delUser(socket)
  {
    for (let i = 0; i < this.users.length; ++i)
    {
      if (this.users[i] == socket)
      {
	this.users.splice(i, 1);
	return;
      }
    }
  }
  numUsers()
  {
    return this.users.length;
  }
}



let rooms = {};

function addSocket(id, socket)
{
  if (rooms[id] == undefined)
    rooms[id] = new Room(id);

  rooms[id].addUser(socket)

}

function removeSocket(socket)
{
  let room = rooms[socket.pairId];
  room.delUser(socket)
}


io.on("connection", (socket)=>
{
  var id = crypto.randomBytes(2).toString('hex').toLowerCase();

  socket.pairId = id;
  addSocket(id, socket);
  
  socket.emit('id', {id:id, number:rooms[id].users.length})	

  socket.on('test',(data)=> {
    console.log("received form value {" + data + "}");
  });

  socket.on('board_request',(data)=> {
    socket.emit("board_update", {board : rooms[socket.pairId].board});
  });

  socket.on('make_move',(data)=> {
    let r = rooms[socket.pairId];
    r.board.makeMove(data.ini, data.fin);
    for (sock of r.users)
    {
      sock.emit("board_update", {board : r.board});
    }
  });

  socket.on('canvas_data',(data)=> {
    for (let sock of users[socket.pairId])
    {
      sock.emit("draw_data", data);
    }
  });

  socket.on('pair',(new_id)=> {
    if (new_id.length>0 && new_id != socket.pairId)
    {
      removeSocket(socket);

      new_id = new_id.toLowerCase();
      socket.pairId = new_id;

      addSocket(new_id, socket);

      socket.emit('id', {id:new_id, number:rooms[new_id].users.length})
    }
    
  });
  socket.on('cursor',(xy)=> {
    for (let sock of users[socket.pairId])
    {
      sock.emit("cursor", xy);
    }
	  
  });

  socket.on('disconnect',()=> {
    removeSocket(socket);
  });
  socket.on('debug',(stuff)=> {
    console.log(stuff);
  });

    
});

// every 5 minutes, check for empty rooms and delete them
setInterval(()=>{
  let i = false;
  for (let id of Object.keys(rooms))
  {
    if (rooms[id].users.length == 0)
    {
      i = true;
      delete rooms[id];
    }
  }
}, 300000);
