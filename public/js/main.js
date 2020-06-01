'use strict';

// Variables globales
var isChannelReady = false;
var isInitiator = false;
var isStarted = false;
var localStream;
var pc;
var remoteStream;
var turnReady;

// ice server candidate
var pcConfig = {
    'iceServers': [{
      'urls': 'stun:stun.l.google.com:19302'
    }]
};

var sdpConstraints = {
    offerToReceiveAudio: true,
    offerToReceiveVideo: true
};


/////////////////Esuchar de los Sockets/////////////////////////

function enviarMensaje(mensaje) {
    console.log('Cliente enviado mensaje: ', mensaje);
    socket.emit('mensaje', mensaje)
}

/////////////////////////////////////////////////

// Selector DOM
var localVideo = document.querySelector('#localVideo');
var remoteVideo = document.querySelector('#remoteVideo');

// Variables de acceso a los perifericos.
navigator.mediaDevices.getUserMedia({
    audio: false,
    video:true
})
.then(gotStream)
.catch(function(e){
    alert('getUserMedia() error: ' + e.name);
})

// Obtener stream de video local
function gotStream(stream) {
    console.log('Agregando local stream');
    localStream = stream;
    localVideo.srcObject = stream;
    enviarMensaje('tiene user media');
    if ( isInitiator ) {
        quizasComenzar();
    }
}

var constraints = {
    video: true
};

console.log('Getting user media with constraints', constraints);

function quizasComenzar() {
    console.log('>>>>>>>>> quizasComenzar() ', isStarted, localStream, isChannelReady);
    if (!isStarted && typeof localStream !== 'undefined' && isChannelReady) {
        console.log('>>>>>>>> creando conexión con compañero');
        crearConexionEntrePares();
        pc.addStream(localStream);
        isStarted = true;
        console.log('isInitiator', isInitiator);
        if ( isInitiator ) {
            hacerLlamada();
        }
    }
}

window.onbeforeunload = function() {
    sendMessage('adios');
};


///////////////////////Funciones de Conexión/////////////////////////

function crearConexionEntrePares() {
    try {
        pc = new RTCPeerConnection(null);
        pc.onicecandidate = manipularCandidatoIce;
        pc.onaddstream = manipularStreamRemotoAgregado;
        pc.onremovestream = manipularStreamRemotoRemovido;
        console.log('RTCPeerConnection Creado');
    } catch (e) {
        console.log('Falló al crear PeerConnection, exception: ' + e.message);
        alert('No se pudo crear PeerConnection object.');
        return;
    }
}



//////////////////////////Manipuladores (Handles)///////////////////////////////////////////

function manipularCandidatoIce(evento) {
    console.log( 'icecandidate evento: ', evento );
    if ( evento.candidate ) {
        enviarMensaje({
            type: 'candidate',
            label: evento.candidate.sdpMLineIndex,
            id: evento.candidate.sdpMid,
            candidate: event.candidate.candidate
        });
    } else {
        console.log('Fin de candidatos.');
    }
}

function manipularStreamRemotoAgregado(evento){
    console.log('Stream remoto agregado.');
    remoteStream = evento.stream;
    remoteVideo.srcObject = remoteStream;
}

function manipularStreamRemotoRemovido(evento) {
    console.log('Stream remoto removido. Evento: ', evento);
}

function manipularCreateOfferError(evento) {
    console.log('createOffer() error', evento);
}

function manipularColgarRemote() {
    console.log('Sesión terminada');
    parar();
    isInitiator = false;
}

//////////////////Funciones de respuesta/////////////////////////////

function hacerLlamada() {
    console.log('Enviar oferta a par');
    pc.createOffer(establecerLocalYEnviarMensaje, manipularCreateOfferError);
}

function darRespuesta() {
    console.log('Enviado respuesta al compañero.');
    pc.createAnswer().then(
        establecerLocalYEnviarMensaje,
        enCrearSesionDescripcionError
    )
}

function establecerLocalYEnviarMensaje(descripcionSesion) {
    pc.setLocalDescription(descripcionSesion);
    console.log('establecerLocalYEnviarMensaje enviando mensaje', descripcionSesion);
    enviarMensaje(descripcionSesion);
}

function enCrearSesionDescripcionError(error) {
    trace('Falló al crear una descipcion de sesión: ' + error.toString());
}

/////////////////Funciones Utiles//////////////////////////////

function requestTurn(turnURL) {
    var turnExists = false;
    for (var i in pcConfig.iceServers) {
      if (pcConfig.iceServers[i].urls.substr(0, 5) === 'turn:') {
        turnExists = true;
        turnReady = true;
        break;
      }
    }
    if (!turnExists) {
      console.log('Getting TURN server from ', turnURL);
      // No TURN server. Get one from computeengineondemand.appspot.com:
      var xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
          var turnServer = JSON.parse(xhr.responseText);
          console.log('Got TURN server: ', turnServer);
          pcConfig.iceServers.push({
            'urls': 'turn:' + turnServer.username + '@' + turnServer.turn,
            'credential': turnServer.password
          });
          turnReady = true;
        }
      };
      xhr.open('GET', turnURL, true);
      xhr.send();
    }
}

function parar() {
    isStarted = false;
    pc.close();
    pc = null;
}