const socket = io();

//elements
const $form = document.querySelector("#message-form");
const $locationBtn = document.querySelector("#send-location");
const $formInputMessage = document.querySelector("#message-field");
const $formInputButton = document.querySelector("#message-button")
const $messagesDiv = document.querySelector("#messages");
const sideBarDiv = document.querySelector("#sidebar")


//Templates
const messageTemplate = document.querySelector("#message-template").innerHTML
const linksTemplate = document.querySelector("#link-template").innerHTML
const sideBarTemplate = document.querySelector("#sidebar-template").innerHTML

//option
const {username , room} = Qs.parse(location.search,{ignoreQueryPrefix:true})
console.log(username,room);

const autoScroll = () =>{
   //get new message element
   const newMessage = $messagesDiv.lastElementChild;

   //height of new message
   const newMessageStyles = getComputedStyle(newMessage)
   const newmessageMargin = parseInt(newMessageStyles.marginBottom)
   const newMesssageHeight = newMessage.offsetHeight + newmessageMargin;

   console.log(newmessageMargin);

   //visible height amount of view that can be seen
   const visibleHeight = $messagesDiv.offsetHeight

   //heigth of message container
   const containerHeight = $messagesDiv.scrollHeight

   //how far have we scrolled
   const scrollOffset = $messagesDiv.scrollTop + visibleHeight

   if(containerHeight - newMesssageHeight <= scrollOffset){
    
     //always scroll to the bottom
     $messagesDiv.scrollTop = $messagesDiv.scrollHeight
   }

}

//event sent from server receivend using ON and accepting callback
socket.on('message',(message) =>{

    console.log(message)
    //compile template with data we wanna render
    const html = Mustache.render(messageTemplate,{
        username : message.username,
        message : message.text,
        createdAt : moment(message.createdAt).format('h:mm a')
    })
    $messagesDiv.insertAdjacentHTML('beforeend',html)
    autoScroll()
})


//event for sending location message
socket.on("locationMessage",(message) =>{

    const html = Mustache.render(linksTemplate,{
        username : message.username,
        link : message.url,
        createdAt : moment(message.createdAt).format("h:mm a")
    })
    $messagesDiv.insertAdjacentHTML('beforeend',html)
    autoScroll()
   
})


//get room data
socket.on('roomData',({room,users})=>{
  const html = Mustache.render(sideBarTemplate,{
      room,users
  })
  sideBarDiv.innerHTML = html
})

//get data from form on submit event
$form.addEventListener('submit', (e) =>{
    e.preventDefault();

    //disable button
    $formInputButton.disabled = true
    const message = $formInputMessage.value
    

    //send event from client to server with dat using EMIT
    socket.emit("sendMessage",message,(error) =>{
        $formInputMessage.value = '';
        $formInputMessage.focus();
        $formInputButton.disabled = false
        if(error){
            return console.log(error);
        }
        console.log('Message Delivered');
    });
})


//get location btn

$locationBtn.addEventListener('click',()=>{
    $locationBtn.disabled = true
    if(!navigator.geolocation){
        return alert('You do not uuport geolocation')
    }

    navigator.geolocation.getCurrentPosition((position)=>{

          //Get latitude and longitude
         const {latitude,longitude} = position.coords
        
         //create coordination object
         const coordinates = {
             latitude,
             longitude
         }

         //emit send location event
         socket.emit("sendLocation",coordinates,() =>{
             $locationBtn.disabled = false
             console.log("Location shared");
         })
    })
   
   
})

socket.emit('join',{username,room},(error) =>{
    if(error){
      alert("error")
      location.href = "/";
    }
    
});




// socket.on('countUpdated',(count)=>{
//     console.log("The count has been updated", count);

// })

// const button = document.querySelector("#increment");
// button.addEventListener("click",()=>{
//     console.log('clicked');
//     socket.emit("increment");
// })