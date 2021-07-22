const express = require("express");
const fs = require("fs");
var crypto = require('crypto');

const app = express();
const port = 4445;

app.use(express.static(__dirname + "/public"));

app.get("/",  (req, res) => {
	res.sendFile( __dirname + "/views/index.html");
});

const favicon = require("serve-favicon");
app.use(favicon(__dirname + "/public/favicon.ico"));

var http = require('http');

const server = http.createServer(app)
server.listen(port, () => console.log("Live on port " + port));

const { Server } = require("socket.io");
const io = new Server(server);

let users =
	{
	}

let games =
	{
	}

function addSocket(id, socket)
{
	
	if (users[id] == undefined)
	{
	 users[id] = [socket];
	}
	else
	{
	 users[id].push(socket);
	}

}
function removeSocket(socket)
{
	let arr = users[socket.pairId];
	for (let i = 0; i < arr.length; ++i)
	{
		if (arr[i] == socket)
		{
			arr.splice(i, 1);

			if (arr.length == 0)
			{	delete users[socket.pairId]; }

			return;
		}
	}
}


io.on("connection", (socket)=>
{
  console.log("ey")
  var id = crypto.randomBytes(2).toString('hex').toLowerCase();

  socket.pairId = id;
  addSocket(id, socket);
  
  socket.emit('id', {id:id})	

  socket.on('test',(data)=> {
    console.log("received test value {" + data + "}");
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

      socket.emit('id', {id:new_id})	
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
