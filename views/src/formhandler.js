
let realurl = window.location.href;

let [path, params] = realurl.split("?");
let searchParams = new URLSearchParams(params);

let a = realurl.split("/");
let rootdir = a.slice(3, -1).join("/") + "/"
console.log(rootdir)



const allowedChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function randRoom()
{
  let s = "";
  for (let i = 0; i < 4; ++i)
  {
    let j = Math.floor(Math.random() * allowedChars.length);
    s += allowedChars[j];
  }
  return s;
}


// https://stackoverflow.com/questions/4434076/best-way-to-alphanumeric-check-in-javascript
function isAlphaNumeric(str) {
  let code, i, len;

  for (i = 0, len = str.length; i < len; i++) {
    code = str.charCodeAt(i);
    if (!(code > 47 && code < 58) && // numeric (0-9)
        !(code > 64 && code < 91) && // upper alpha (A-Z)
        !(code > 96 && code < 123)) { // lower alpha (a-z)
      return false;
    }
  }
  return true;
};

//import {details} from "./session_details.js";

//const session = require("session_details.js");

let form = document.getElementById('form');
let name = document.getElementById('name_input');
let room = document.getElementById('room_input');
let error = document.getElementById('error');

room.value = randRoom();

form.addEventListener("submit", (e)=>
{
  e.preventDefault();
  if (name.value.length == 0)
  {
    error.textContent = "Please enter a name!";
    return;
  }
  if (isAlphaNumeric(name.value) == false)
  {
    error.textContent = "Your name can only have letters and numbers.";
    return
  }
  if (room.value.length != 4)
  {
    error.textContent = "Room codes must be 4 characters long.";
    return
  }
  if (isAlphaNumeric(room.value) == false)
  {
    error.textContent = "Room codes can only have letters and numbers.";
    return
  }
  error.textContent = "";
  window.location.replace("/" + rootdir + "game?room="+room.value.toLowerCase()+"&name=" + name.value);
});
