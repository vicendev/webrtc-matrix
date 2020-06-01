var socket = io.connect();

// Nombre de la sala
var sala = 'foo'

if ( sala != '' ){
    socket.emit('crearOUnir', sala);
    console.log('Intentó crear o unirse a una sala', sala);
}

socket.on('crearSala', function(sala) {
    console.log('Sala Creada ' + sala);
    isInitiator = true;
});

socket.on('salaLlena', function(sala) {
    console.log('Sala ' + sala + ' esta llena');
});

socket.on('unirse', function (sala) {
    console.log('Otro compañero solicitó unirse a la sala ' + sala);
    console.log('Este compañero es el iniciador de la sala' + sala + '!');
    isChannelReady = true;
});

socket.on('unido', function(sala) {
    console.log('unido a la sala: ' + sala);
    isChannelReady = true;
});

socket.on('log', function(array) {
    console.log.apply(console, array);
});

// Intermcabio de mensajes para la conexion remota
socket.on('mensaje', function(mensaje) {
    console.log('Cliente recibe mensaje: ', mensaje);

    if ( mensaje === 'tiene user media' ) {

        quizasComenzar();

    } else if ( mensaje.type === 'offer' ) {
        console.log('ESTOOOOOOOOOOY ACAAAAAAAAAAAAAAA EN OFFER!');
        if ( !isInitiator && !isStarted ) {

            quizasComenzar()
        }

        pc.setRemoteDescription(new RTCSessionDescription(mensaje));
        darRespuesta();

    } else if ( mensaje.type === 'answer' && isStarted ) {

        pc.setRemoteDescription(new RTCSessionDescription(mensaje));

    } else if ( mensaje.type === 'candidate' && isStarted ) {

        var candidate = new RTCIceCandidate({
            sdpMLineIndex: mensaje.label,
            candidate: mensaje.candidate
        });

        pc.addIceCandidate(candidate);

    } else if ( mensaje === 'adios' && isStarted ) {

        manipularColgarRemote();

    }
});

