const path = require("path");
const http = require("http");

const express = require("express");
const socketio = require("socket.io");
const Filter = require("bad-words")

const {messages,generateLocationMessage} = require("./utils/messages");
const {addUser , removeUser ,getUser,getUsersInRoom} = require("./utils/users")

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname,"..","public")));

app.get("/",(req,res,next)=>{
    return res.sendFile(path.join(__dirname,"..","public","index.html"))
})

//server(emits) --> client(receives with on) ---acknowledgment --> server

//client(emits) --> server(receives with on) ---acknowledgment --> client


io.on('connection',(socket)=>{

   console.log("New web socket connection")

   //emiting event to client using on and passing data

   //socket.emit('message',messages('Welcome'));

   //Broadcast emits a message fromsocket to all others and not him
  // socket.broadcast.emit('message',messages("New User Joined"));
   

   //for join from client
   socket.on('join',({username,room},callback) =>{
       //io.to.emit to emit to every body in a room
       //socket.broadcast.to.emit to every body in room except that socket

      const {error,user} = addUser({id:socket.id,username,room})
      if(error){
        return callback(error)
       }

       //join room first
       socket.join(user.room)

       //emit to user
       socket.emit('message',messages("Admin",'Welcome'));

  
       const message = user.username + " has joined";
       //brodcast to every one
       socket.broadcast.to(user.room).emit('message',messages(message))
       io.to(user.room).emit('roomData',{
           room : user.room,
           users : getUsersInRoom(user.room)
       })

       callback();
   })

   //server receiving event from client with ON 
   socket.on('sendMessage',(message,callback) =>{

       const filter = new Filter()

       if(filter.isProfane(message)){
           return callback("Profanity is not allowed")
       }

      //get user data
      const user = getUser(socket.id);
      
      //send to all sockets using IO
      io.to(user.room).emit("message",messages(user.username,message));
      callback();
   })

   //Event on receiving coordinates details
   socket.on("sendLocation",(coordinates,callback) =>{
       message = `https://google.com/maps?q=${coordinates.latitude},${coordinates.longitude}`;

       const user = getUser(socket.id);

       io.to(user.room).emit('locationMessage',generateLocationMessage(user.username,message));
       callback()
   })
   
   //When a connection stops call disconnect event on that socket and pass callback function if wanted
   socket.on('disconnect',()=>{

       const user = removeUser(socket.id);

       if(user){ 
            message = "User left"
            io.to(user.room).emit('message',messages(user.username,`has left`));
            io.to(user.room).emit('roomData',{
                room : user.room,
                users : getUsersInRoom(user.room)
            })
       }
      
   })
















//    socket.emit('countUpdated',count);

//    socket.on("increment",()=>{
//        count++
//        //socket.emit("countUpdated",count);
//        io.emit('countUpdated',count);
//    })
})




server.listen(port,()=>{
    console.log(`Listening on port ${port}`)
})

