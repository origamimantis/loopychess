const express = require("express");
var crypto = require('crypto');

const app = express();
let port = process.env.PORT;
if (process.argv[2] == "test")
  port = 4445;

app.use(express.static(__dirname + "/docs/src"));

const an_re = "[A-Za-z0-9]"





app.get("/",  (req, res) => {
	res.sendFile( __dirname + "/docs/index.html");
});
app.get("/join/"+an_re+an_re+an_re+an_re,  (req, res) => {
  res.sendFile( __dirname + "/docs/join.html");
});
app.get("/game/"+an_re+an_re+an_re+an_re,  (req, res) => {
  res.sendFile( __dirname + "/docs/game.html");
});
app.get("/test",  (req, res) => {
	res.sendFile( __dirname + "/docs/test.html");
});


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


const b = require("./src/board.js");
const c = require("./src/constants.js");
class Room
{
  constructor(id)
  {
    this.board = new b.Board();
    this.users = []
    this.moves = []
    this.id = id;
  }
  getUserByName(name)
  {
    for (let o of this.users)
    {
      if (o.name == name)
	return o;
    }
    return null;
  }
  addUser(obj)
  {
    this.users.push(obj);
  }
  delUser(socket)
  {
    for (let i = 0; i < this.users.length; ++i)
    {
      if (this.users[i].socket == socket)
      {
	//this.users.splice(i, 1);
	this.users[i].socket = null;
	return;
      }
    }
  }
  numUsers()
  {
    return this.users.length;
  }
  getUserInfo()
  {
    let a = [];
    for (let u of this.users)
    {
      if (u.socket !== null)
	a.push({name:u.name, team:u.team});
    }
    return a;
  }
  isEmpty()
  {
    for (let o of this.users)
    {
      if (o.socket !== null)
	return false;
    }
    return true;
  }
}



let rooms = {};

function addSocket(id, name, socket)
{
  if (rooms[id] == undefined)
    rooms[id] = new Room(id);

  let l = rooms[id].users.length;
  let team = c.SPECTATING;
  if (l == 0)	    team = c.WHITE;
  else if (l == 1)  team = c.BLACK;

  rooms[id].addUser({name:name, team:team, socket:socket})

}

function removeSocket(socket)
{
  let room = rooms[socket.pairId];
  if (room !== undefined)
    room.delUser(socket);
}



function users_update(id)
{
  let room = rooms[id];
  if (room === undefined)
    return

  let info = room.getUserInfo();
  let i = 0;
  for (let u of rooms[id].users)
  {
    if (u.socket !== null)
    {
      u.socket.emit('users_update', {info: info, i: i });
      ++ i;
    }
  }
}

io.on("connection", (socket)=>
{

  socket.on('test',(data)=> {
    console.log("received form value {" + data + "}");
  });

  socket.on('board_request',(data)=> {
    let r = rooms[socket.pairId];
    socket.emit("board_update", {board : r.board, moves: r.moves});
  });

  socket.on('make_move',(data)=> {
    let r = rooms[socket.pairId];
    r.board.makeMove(data.ini, data.fin);

    if (data.promote)
      r.board.promote(data.fin, data.promote);

    r.moves.push(data.note);
    for (u of r.users)
    {
      if (u.socket !== null)
	u.socket.emit("board_update", {board : r.board, moves : r.moves});
    }
  });

  socket.on('canvas_data',(data)=> {
    for (let u of users[socket.pairId])
    {
      if (u.socket !== null)
	u.socket.emit("draw_data", data);
    }
  });

  socket.on('pair',(id_name)=> {
    let att_id = id_name.id;
    if (att_id.length>0 && att_id != socket.pairId)
    {
      let room = rooms[att_id];
      let collision;
      if (room === undefined)
	collision = null;
      else
	collision = rooms[att_id].getUserByName(id_name.name);

      if (collision !== null && collision.socket !== null)
      {
	socket.emit("name_collision", {name:id_name.name});
	return
      }

      removeSocket(socket);

      let new_id = id_name.id.toLowerCase();
      socket.pairId = new_id;

      if (collision === null)
	addSocket(new_id, id_name.name, socket);

      // reconnect
      else if (collision.socket === null)
	collision.socket = socket;

      users_update(new_id);
      socket.emit("paired", {});
    }
    
  });
  socket.on('cursor',(xy)=> {
    for (let u of users[socket.pairId])
    {
      u.socket.emit("cursor", xy);
    }
	  
  });

  socket.on('disconnect',()=> {
    removeSocket(socket);
    users_update(socket.pairId);
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
