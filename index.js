const express = require('express');
const { createServer } = require('http');
const Server = require('socket.io');
const OrderingApp = require('./orderingApp');
const { userInfo } = require('os');
const oderingApp = new OrderingApp();

const app = express();
const server = createServer(app);
const io = Server(server);

io.on('connection', (socket) => {
	console.log('connection started');
	socket.on('join', (user_type, Username) => {
		const userInfo = {
			user_type: user_type,
			name: Username,
			socket: socket,
		};
		oderingApp.joinSession(userInfo);
	});

	socket.on('requestOrder', (order) => {
		console.log('Requesting order', order);
		oderingApp.requestOrder(order);
	});

	socket.on('acceptOrder', (order) => {
		oderingApp.acceptOrder(order);
	});
	socket.on('rejectOrder', (order) => {
		oderingApp.rejectOrder(order);
	});
	socket.on('finishRide', (order) => {
		oderingApp.finishRide(order);
	});
});

app.get('/', (req, res) => {
	res.send("Welcome to Taxi App");
});
app.get('/sender', (req, res) => {
	res.sendFile(__dirname + '/sender.html');
});
app.get('/driver', (req, res) => {
	res.sendFile(__dirname + '/driver.html');
});

server.listen(3002, () => {
	console.log('started');
});
