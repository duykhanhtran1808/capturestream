'use strict';

let start = document.getElementById('btnStart');
let stop = document.getElementById('btnStop');
stop.style.display = 'none'

const userId = "8";
const token = "aksjhfdskj12184y3847@123";

const pcRecording = {};
var localstream;
const socket = io('https://msc2.fireants.vip:1006');

// Register
let body = {
    "userId": userId.toString(),
    "token": token
}

$.ajax({
    beforeSend: function (xhrObj) {
        xhrObj.setRequestHeader("userid", userId.toString());
        xhrObj.setRequestHeader("token", token);
    },
    url: "https://msc2.fireants.vip:1006/v0/subscribers",
    type: "POST",
    data: JSON.stringify(body),
    success: function (data) { alert('data: ' + JSON.stringify(data)); },
    contentType: "application/json",
    dataType: 'json'
});

function onOfferPresenter(error, offerSdp) {
    if (error) {
        console.log('onOfferPresenter', error);
        return
    }
    /*
    Dong goi ban tin gui len Server
     */

    let data = {
        userId: userId,
        token: token,
        sdp: offerSdp,
        option1: "Option1 chua co du lieu",
        option2: "Option2 chua co du lieu",
        option3: "Option3 chua co du lieu",
    }
    // Send socket to Server to create call
    console.log('onOfferPresenter send server:', data);
    socket.emit('P_STARTRECORDING', data);
}


function onIceCandidate(candidate) {
    // Send the candidate to the remote peer

    let data = {
        userId: userId,
        token: token,
        candidate: candidate
    }
    console.log('onIceCandidate send to server:', data);
    socket.emit('P_CANDIDATE', data);


    console.log('onIceCandidate: tu gen candidate', candidate);
    if (pcRecording.listCandidate == undefined) pcRecording.listCandidate = [];
    if (candidate) {
        pcRecording.listCandidate.push(candidate); // Luu cac candidate lai
    } else {
        pcRecording.candidate = 1;
    }


}

socket.on('U_OFFERSDP', (data) => {
    // Su kien xu ly offer SDP tu server tra ve
    try {
        console.log('U_OFFERSDP:', data)
        if (data && data.sdp && pcRecording && pcRecording.pc) { // Neu 2 doi tuong khac undefined

            pcRecording.pc.processAnswer(data.sdp);
        }
    } catch (e) {
        console.log('[U_OFFERSDP]:', e);
    }
})
socket.on('U_CANDIDATE', (data) => {
    // Su kien xu ly khi nhan duoc candidate
    try {
        console.log('U_CANDIDATE:', data)
        if (data && data.candidate && pcRecording && pcRecording.pc) { // Neu 2 doi tuong khac undefined

            if (data.candidate) {

                pcRecording.pc.addIceCandidate(data.candidate)
            } else {
                pcRecording.pc.addIceCandidate('')

            }
        }
    } catch (e) {
        console.log('[U_CANDIDATE] exception:', e);
    }
})

let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');

//Select cac video
let vidFromServer = document.getElementById('vidFromServer');
let outputVid = document.getElementById('outputVid');
let recordVid = document.getElementById('recordVid')

// Ve hinh
ctx.beginPath();
ctx.arc(75, 75, 50, 0, Math.PI * 2, true); // Outer circle
ctx.moveTo(110, 75);
ctx.arc(75, 75, 35, 0, Math.PI, false);  // Mouth (clockwise)
ctx.moveTo(65, 65);
ctx.arc(60, 65, 5, 0, Math.PI * 2, true);  // Left eye
ctx.moveTo(95, 65);
ctx.arc(90, 65, 5, 0, Math.PI * 2, true);  // Right eye
ctx.stroke();



//Cho video tu server vao canvas
vidFromServer.addEventListener('play', function () {
    let $this = this;
    (function loop() {
        if (!$this.paused && !$this.ended) {
            ctx.drawImage($this, 0, 200, 300, 200);
            setTimeout(loop, 1000 / 30);
        }
    })();
}, 0)

//Cho video ghi hinh vao canvas
recordVid.addEventListener('play', function() {
    let $this = this; //cache
    (function loop() {
      if (!$this.paused && !$this.ended) {
        ctx.drawImage($this, 400, 0, 300, 200);
        setTimeout(loop, 1000 / 30); // drawing at 30fps
      }
    })();
  }, 0);

//Chay ra output video
let stream;
vidFromServer.onplay = function () {
    stream = canvas.captureStream(30);
    outputVid.srcObject = stream;
    outputVid.play()
}

//Ghi hinh video
navigator.mediaDevices.getUserMedia({ audio: true, video: true}).then(function (mediaStreamObj) {
    start.addEventListener('click', function (ev) {
        recordVid.srcObject = mediaStreamObj
        recordVid.play()
        
        
        if (stream) {
            localstream = stream;
        }

        let options = {
            videoStream: localstream,
            onicecandidate: onIceCandidate
        }
        let webRtcPeer = kurentoUtils.WebRtcPeer.WebRtcPeerSendonly(options, function (error) {
            if (error) {
                console.log('Error when create webRTCPeer:', error);
                return;
            }
            this.generateOffer(onOfferPresenter);
        });
        pcRecording.pc = webRtcPeer;

        
        start.style.display = 'none'
        stop.style.display = null
    })

    stop.addEventListener('click', function (ev) {
        recordVid.srcObject = null
        stop.style.display = 'none'
        start.style.display = null

    })


}).catch(function (err) {
    console.log(err.name, err.message)
})

