'use strict';

let hostname = "http://localhost:4445"


let socket;


function debug(stuff)
{

	socket.emit("debug", stuff);

}

window.onload = () => {
  socket = io.connect(hostname);

  socket.on("id", (e) => {
    debug("bruh");
  });

  window.onmousedown = (e) => {
    // ignore left, middle click
    if (e.which != 1)
      return

    debug("left click");
  }

}
