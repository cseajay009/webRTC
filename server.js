
const fs = require('fs');
const https =  require('https');
const express =  require("express");
const app =  express();
const socketio =  require('socket.io');

app.use(express.static(__dirname));

const cert = fs.readFileSync('cert.crt');
const key =  fs.readFileSync('cert.key');

const expressServer =  https.createServer({key,cert},app);
const io =  socketio(expressServer);
expressServer.listen(8181);
const offers = [
   // offerusername
   // offer
   // offerIceCandidates
   // answeredUserName
   // answer
   // answererIceCandidates


];


const connectedSockets = [
    //userName, socketId
];


io.on('connection',(socket)=>{
  
    const userName =   socket.handshake.auth.userName;
    const password =   socket.handshake.auth.password;

    connectedSockets.push({
       
        sockedId : socket.id,
        userName 

    }); 

    if(offers.length){
        socket.emit('availableOffers',offers);
    }

    socket.on('newOffer',newOffer=>{
          offers.push({
            offererUserName: userName,
            offer: newOffer,
            offerIceCandidates: [],
            answererUserName: null,
            answer: null,
            answererIceCandidates: []
         })

         socket.broadcast.emit('newOfferAwaiting',offers.slice(-1));
         console.log(newOffer.sdp.slice(50));
    })



    socket.on('newAnswer',(offerObj,ackFunction)=>{
      
        console.log(offerObj);

        const socketToAnswer =  connectedSockets.find(s=>s.userName === offerObj.offererUserName)

        
        if(!socketToAnswer){
            return;
        }

        const socketIdToAnswer = socketToAnswer.sockedId;
        const offerToUpdate = offers.find(o=>o.offererUserName === offerObj.offererUserName);
        if(!offerToUpdate){
            console.log("No offer to update");
            return;
        }
        ackFunction(offerToUpdate.offerIceCandidates);
        offerToUpdate.answer = offerObj.answer
        offerToUpdate.answererUserName = userName

        socket.to(socketIdToAnswer).emit('answerResponse',offerToUpdate);


    })

     socket.on('sendIceCandidatetoSignalingServer',iceCandidateObj=>{
         const{didIOffer, iceUserName, iceCandidate} = iceCandidateObj;
         console.log(iceCandidate);

         if(didIOffer){
             const offerInOffers =  offers.find(o=>o.offererUserName===iceUserName);
             if(offerInOffers){
                 offerInOffers.offerIceCandidates.push(iceCandidate);
                  
                 if(offerInOffers.answererUserName){

                   const socketToSendTo = connectedSockets.find(s=>s.userName === answererUserName)
                   if(socketToSendTo){
                       socket.to(socketToSendTo.socketId).emit('receivedIceCandidateFromServer',iceCandidate)
                   }else{
                       console.log("Ice candidate Received but could not find answerer")
                   }

                 
                 }
            
                         
                }
         }else{
            const offerInOffers =  offers.find(o=>o.answererUserName===iceUserName);
            const socketToSendTo = connectedSockets.find(s=>s.userName === offererUserName)
            if(socketToSendTo){
                socket.to(socketToSendTo.socketId).emit('receivedIceCandidateFromServer',iceCandidate)
            }else{
                console.log("Ice candidate Received but could not find offerer")
            }
         }
     })




})