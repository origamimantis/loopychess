var form = document.getElementById('form');
var input = document.getElementById('input');

form.addEventListener('submit', function(e) {
  e.preventDefault();
  if (input.value) {
    if (input.value.startsWith("/join"))
    {
      let newID = input.value.split(" ")[1]
      if (newID.length == 4)
      {
	socket.emit('pair', newID);
	document.getElementById("text").textContent = "/join <roomnumber> to switch rooms.";
      }
      else
      {
	document.getElementById("text").textContent = "/join: invalid room code: must be length 4";
      }
    }
    else
    {
      socket.emit('test', input.value);
    }
    input.value = '';
  }
});
