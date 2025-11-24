var connection = new WebSocket('ws://localhost:9090');

connection.onopen = function(){
    console.log("Connected to the server");
}

connection.onmessage = function(msg){
    var data = JSON.parse(msg.data);
    switch(data.type){
        case "login":
            loginProcess(data.success);
        break;
         case "offer":
            call_status.innerHTML = '<div class="calling-status-wrap card black white-text"> <div class="user-image"> <img src="assets/images/me.png" class="caller-image circle" alt=""> </div> <div class="user-name">'+data.name+'</div> <div class="user-calling-status">Calling...</div> <div class="calling-action"> <div class="call-accept"><i class="material-icons green darken-2 white-text audio-icon">call</i></div> <div class="call-reject"><i class="material-icons red darken-3 white-text close-icon">close</i></div> </div> </div>';

            var call_receive = document.querySelector('.call-accept');
            var call_reject = document.querySelector('.call-reject');
            call_receive.addEventListener("click", function(){
                    acceptCall(data.name);
                    offerProcess(data.offer, data.name);
                    call_status.innerHTML = ' <div class="call-status-wrap white-text"> <div class="calling-wrap"> <div class="calling-hang-action"> <div class="videocam-on"> <i class="material-icons teal darken-2 white-text video-toggle">videocam</i> </div> <div class="audio-on"> <i class="material-icons teal darken-2 white-text audio-toggle">mic</i> </div> <div class="call-cancel"> <i class="call-cancel-icons material-icons red darken-3 white-text ">call</i> </div> </div> </div> </div>';
                    
                     var video_toggle = document.querySelector('.video-cam-on');
                     var audio_toggle = document.querySelector('.audio-on');

                     video_toggle.onclick = function(){
                        strem.getVideoTracks() [0].enable = !
                        (stream.getVideoTracks()[0].enabled);


                     }

                     var video_toggle_class = document.querySelector('.video_toggle');
                     if(video_toggle_class.innerText == 'videocam'){
                        video_toggle_class.innerText ='vidocam_off';
                     }else{
                        video_toggle_class.innerText ='videocam';
                     }


                      audio_toggle.onclick = function(){
                        strem.getAudioTrack() [0].enable = !
                        (stream.getAudioTracks()[0].enabled);


                     }

                     var video_toggle_class = document.querySelector('.audio_toggle');
                     if(audio_toggle_class.innerText == 'mic'){
                        audio_toggle_class.innerText ='mic_off';
                     }else{
                        video_toggle_class.innerText ='mic';
                     }

                     hangup();
                     
            })
            call_reject.addEventListener("click", function(){
                    call_status.innerHTML = '';
                    alert('Call is rejected');
                    rejectedCall(data.name);
            })
           
        break;
         case "answer":
            answerProcess(data.answer);
        break;
         case "candidate":
            candidateProcess(data.candidate);
        break;
        case "reject":
            rejectProcess();
        break;
        case "accept":
            acceptProcess();
        break;
        case "leave":
            leaveProcess();
        break;
        default:
            break;
    }
}

connection.onerror = function(error){
  console.log(error);
}

var connected_user;
var local_video = document.querySelector("#local-video");
var remote_video = document.querySelector("#remote-video");
var call_btn = document.querySelector("#call-btn");
var call_to_username_input = document.querySelector("#username-input");
var call_status = document.querySelector(".call-hang-status");

call_btn.addEventListener("click", function(){
    var call_to_username = call_to_username_input.value;
      call_status.innerHTML = '<div class="calling-status-wrap card black white-text"> <div class="user-image"> <img src="assets/images/other.png" class="caller-image circle" alt=""> </div> <div class="user-name">'+call_to_username+'</div> <div class="user-calling-status">Calling...</div> <div class="calling-action">  <div class="call-reject"><i class="material-icons red darken-3 white-text close-icon">close</i></div> </div> </div>';
 
    var call_reject = document.querySelector('.call-reject');
    call_reject.addEventListener("click", function(){
                call_status.innerHTML = '';
                alert('Call is rejected');
                rejectedCall(call_to_username);
        })

    if(call_to_username.length > 0){
        connected_user = call_to_username;
        myConn.createOffer(function(offer){
            send({
                 type:"offer",
                 offer:offer
            })

            myConn.setLocalDescription(offer)
        }, function(error){
            alert("Offer has not created");
        })
    }
})
var name;
var connectedUser;
var myConn;
var dataChannel;
var url_string = window.location.href;
var url = new URL(url_string);
var username = url.searchParams.get("username");

// alert(username);
setTimeout(function(){
if(connection.readyState === 1){
    if(username !=null){
        name = username;
        if(name.length > 0){
            send ({
                type: "login",
                name: name
            })
        }
    }
}else{
   console.log("Connection has no established"); 
}
},3000)

function send(message){
    if(connected_user){
        message.name = connected_user;
    }
    connection.send(JSON.stringify(message))
}

function loginProcess(success){
   if(success === false){
    alert("Try a different username");
   }else{
    // use modern API
    navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    }).then(function(myStream){
        stream = myStream;
        local_video.srcObject = stream;

        var configuration = {
          iceServers: [{
            urls: "stun:stun2.1.google.com:19302"
          }]
        };

        // Create RTCPeerConnection (use browser prefix only if you need legacy)
        myConn = new (window.RTCPeerConnection || window.webkitRTCPeerConnection)(configuration, {
          optional: [{ RtpDataChannels: true }]
        });

        // If this client is the callee (didn't create dataChannel),
        // incoming datachannel will be available here:
        myConn.ondatachannel = function(event){
            dataChannel = event.channel;

            dataChannel.onopen = function(){
              console.log("Data channel opened (remote)");
            };

            dataChannel.onmessage = function(event){
              // append incoming message
              chatArea.innerHTML += "<div class='left-align' style='display:flex; align-items:center;'><img src='assets/images/other.png' style='height:40px; width:40px;' class='caller-image circle'><div style='font-weight:600; margin:0 5px;'>"+ connected_user + "</div>:<div> "+event.data+"</div></div><br/>";
            };

            dataChannel.onerror = function(err){
              console.log("Data channel error (remote):", err);
            };
        };

        // If this client is the caller, create a data channel:
        // (you might already create it elsewhere — keep consistent)
        try {
          dataChannel = myConn.createDataChannel("channel1", { reliable: true });

          dataChannel.onerror = function(error){
              console.log("Data channel error (local):", error);
          };

          dataChannel.onmessage = function(event){
              chatArea.innerHTML += "<div class='left-align' style='display:flex; align-items:center;'><img src='assets/images/other.png' style='height:40px; width:40px;' class='caller-image circle'><div style='font-weight:600; margin:0 5px;'>"+ connected_user + "</div>:<div> "+event.data+"</div></div><br/>";
          };

          dataChannel.onopen = function(){
              console.log("Data channel opened (local)");
          };

          dataChannel.onclose = function(){
              console.log("Data channel closed (local)");
          };
        } catch (e) {
          // createDataChannel might throw in some contexts; handled by ondatachannel on other side
          console.log("createDataChannel not created here:", e);
        }

        // add local stream to connection
        myConn.addStream(stream);

        myConn.onaddstream = function(e){
              remote_video.srcObject = e.stream;
              call_status.innerHTML =' <div class="call-status-wrap white-text"> <div class="calling-wrap"> <div class="calling-hang-action"> <div class="videocam-on"> <i class="material-icons teal darken-2 white-text video-toggle">videocam</i> </div> <div class="audio-on"> <i class="material-icons teal darken-2 white-text audio-toggle">mic</i> </div> <div class="call-cancel"> <i class="call-cancel-icons material-icons red darken-3 white-text ">call</i> </div> </div> </div> </div>';
        };

        myConn.onicecandidate = function(event){
            if(event.candidate){
                send({
                    type:"candidate",
                    candidate: event.candidate
                });
            }
        };
    }).catch(function(error){
        console.log("getUserMedia error:", error);
    });
   }
}


function offerProcess(offer, name){
   connected_user = name;
   myConn.setRemoteDescription(new RTCSessionDescription(offer))
   
   //alert(name);
   //Create answer to an offer or user A.
   myConn.createAnswer(function(answer){
    myConn.setLocalDescription(answer);
    send({
        type: "answer",
        answer:answer
    })
   }, function(error){
     alert("Answer has not created");
   })

}

 function answerProcess(answer){
    myConn.setRemoteDescription(new RTCSessionDescription(answer));
 }

function candidateProcess(candidate){
    myConn.addIceCandidate(new RTCIceCandidate(candidate))
}

function rejectedCall(rejected_caller_or_callee){
    send ({
        type: "reject",
        name: rejected_caller_or_callee
    })
}

function acceptCall(callee_name){
   send({
       type: "reject",
       name: callee_name
   })
}

function rejectProcess(){
    call_status.innerHTML ='';
}

function acceptProcess(){
    call_status.innerHTML = '';
}

function hangup(){
    var call_cancel = document.querySelector('.call-cancel');
    call_cancel.addEventListener("click", function(){
        call_status.innerHTML = '';
        send({
            type:"leave"
        })
    })
}

function leaveProcess(){
    remote_video.src = null;
    myConn.close();
    myConn.onicecandidate = null;
    myConn.onaddstream = null;
    connected_user = null;
}

var msgInput = document.querySelector("#msg-input");
var msgSendBtn = document.querySelector("#msg-sent-btn");
var chatArea = document.querySelector("#chat-area");
msgSendBtn.addEventListener("click", function(event){
    var msgVal = msgInput.value;
    //if(!msgVal) return;

    // check dataChannel
    if(dataChannel && dataChannel.readyState === "open"){
        // send over datachannel (peer-to-peer)
        dataChannel.send(msgVal);

        // append to local chat UI
        chatArea.innerHTML += "<div class='right-align' style='display:flex; align-items:center; align-self:flex-end'><div>"+msgVal+"</div>:<div style='font-weight:600; margin: 0 5px;'>"+ name +"</div><img src='assets/images/me.png' style= 'height:40px; width:40px;'class='caller-image circle'></div><br/>";

        msgInput.value = "";
    } else {
        alert("Chat channel not open yet. Wait for connection to establish.");
        console.log("dataChannel state:", dataChannel ? dataChannel.readyState : "no dataChannel");
    }
});
