const connectButton = document.getElementById('test');

connectButton.onclick = function() {
    const socketUrl = 'ws://localhost:8080';
    const socketConnection = new WebSocket(socketUrl);
    
    socketConnection.onopen = () => {
        socketConnection.send('Hey');
    }
    
    socketConnection.onerror = err => {
        console.log(err);
    }
    
    socketConnection.onmessage = e => {
        console.log(e.data);
    }
}