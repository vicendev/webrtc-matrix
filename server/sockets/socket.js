const { io } = require('../server');
const { os } = require('os');

io.sockets.on('connection', function(client) {
    

    function log() {
        var array = ['Message from server'];
        array.push.apply(array, arguments);
        client.emit('log', array);
    }

    client.on('mensaje', function(mensaje) {
        log('Cliente dice: ', mensaje);
        // Cambiar broadcast, en caso de sistema de salas
        client.broadcast.emit('mensaje', mensaje);
    });

    client.on('crearOUnir', function(sala) {
        log('Solicitud recibida para crear o unirse a una sala ' + sala);

        var clientesEnSala = io.sockets.adapter.rooms[sala];
        var numClientes = clientesEnSala ? Object.keys(clientesEnSala.sockets).length : 0;
        log('Sala ' + sala + ' ahora tiene ' + numClientes + ' cliente(s)');

        if ( numClientes === 0 ) {
            client.join(sala);
            log('Cliente ID ' + client.id + ' creada sala ' + sala);
            client.emit('crearSala', sala, client.id);

            // Cambiar a numClientes >= x para conferencia multiple
            ///////////////////////////////////////////////////////
        } else if ( numClientes === 1 ) {

            log('Cliente ID ' + client.id + ' unido a la sala ' + sala);

            io.sockets.in(sala).emit('unirse', sala);
            client.join(sala);
            client.emit('unido', sala, client.id);
            io.sockets.in(sala).emit('ready');
        } else {
            client.emit('salaLlena', sala);
        }
    });

    client.on('ipaddr', function() {
        var ifaces = os.networkInterfaces();
        for ( var dev in ifaces ) {
            ifaces[dev].foreach(function(detalles) {
                if (detalles.family === 'IPv4' && detalles.address !== '127.0.0.1') {
                    client.emit('ipaddr', detalles.address);
                }
            });
        } 
    });

    client.on('adios', function() {
        console.log('Adios Recibido');
    });
});