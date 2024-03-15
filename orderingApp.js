const Order = require('./order');
const Driver = require('./driver');
const Sender = require('./sender');

class OrderingApp {
	constructor() {
		this.orders = [];
		this.drivers = [];
		this.senders = [];
		this.socketUserMap = new Map();
	}

	joinSession({ socket, user_type, name }) {
		this.createUser({ name, socket, user_type });
	}
	assignSocket({ socket, user }) {
		this.socketUserMap.set(user.id, socket);
	}
	sendEvent({ socket, data, eventname }) {
		socket.emit(eventname, data);
	}
	createUser({ name, socket, user_type }) {
		switch (user_type) {
			case 'sender':
				const sender = new Sender(name);
				this.senders.push(sender);
				this.assignSocket({ socket, user: sender, user_type });
				this.sendEvent({
					socket,
					data: { sender },
					eventname: 'senderCreated',
				});
				return sender;
			case 'driver':
				const driver = new Driver(name);
				this.drivers.push(driver);
				this.assignSocket({ socket, user: driver, user_type });
				this.sendEvent({
					socket,
					data: { driver },
					eventname: 'driverCreated',
				});
				return driver;
			default:
				throw new Error('invalid');
		}
	}

	requestOrder({ current_location, destination, price, id }) {
		const sender = this.senders.find((sender) => sender.id === id);
		const order = new Order({ current_location, destination, price, sender });

		const timer = setTimeout(() => {
			for (const order of this.orders) {
				if (order.status == 'pending') {
					order.status == 'expired';
					const senderSocket = this.socketUserMap.get(sender.id);
					senderSocket.emit('orderExpired', { order });
					clearTimeout(order.timer);

					// sendEvent({
					// 	socket: this.socketUserMap.get(sender.id),
					// 	data: { order },
					// 	eventname: 'orderExpired',
					// });
				}
			}
		}, 20000);
		const updateOrder = { ...order, timer: timer };
		this.orders.push(updateOrder);

		// notify drivers
		for (const driver of this.drivers) {
			console.log('driverB');
			if (driver.in_ride) continue;
			this.sendEvent({
				socket: this.socketUserMap.get(driver.id),
				data: { order },
				eventname: 'requestOrder',
			});
		}

		return updateOrder;
	}
	// acceptOrder(order) {
	// 	const { id, driver_id } = order;
	// 	const driver = this.drivers.find((driver) => driver.id === driver_id);
	// 	const rorder = this.orders.find((order) => order.id === id);
	// 	const sender = this.senders.find(
	// 		(sender) => sender.id === rorder.sender.id
	// 	);
	// 	rorder.assignDriver(driver);
	// 	const userSocket = this.socketUserMap.get(sender.id);
	// 	userSocket.emit('orderAccepted', { order: rorder });
	// 	const driverSocket = this.socketUserMap.get(driver.id);
	// 	driverSocket.emit('orderAccepted', { order: rorder });
	// }
	acceptOrder(updateOrder) {
		const { id, driver_id } = updateOrder;
		// get all info about order
		const driver = this.drivers.find((driver) => driver.id === driver_id);
		const _order = this.orders.find((order) => order.id === id);
		const sender = this.senders.find(
			(sender) => sender.id === _order.sender.id
		);
		driver.in_ride = true;
		_order.status = 'accepted';

		_order.driver = driver;
		console.log(_order.status);
		clearTimeout(_order.timer);

		// const userSocket = this.socketUserMap.get(sender.id);
		// userSocket.emit('orderAccepted', { order: _order });
		this.sendEvent({
			socket: this.socketUserMap.get(sender.id),
			data: { order: _order },
			eventname: 'orderAccepted',
		});
		for (const driver of this.drivers) {
			if (driver.id == driver_id) {
				// const driverSocket = this.socketUserMap.get(driver.id);
				// driverSocket.emit('orderAccepted', { order: _order });
				this.sendEvent({
					socket: this.socketUserMap.get(driver.id),
					data: { order: _order },
					eventname: 'orderAccepted',
				});
			} else {
				// const missedSocket = this.socketUserMap.get(driver.id);
				// missedSocket.emit('missedOrder', { order: _order });
				this.sendEvent({
					socket: this.socketUserMap.get(driver.id),
					data: { order: _order },
					eventname: 'missedOrder',
				});
			}
		}
	}

	rejectOrder(updateOrder) {
		const { id, driver_id } = updateOrder;
		const driver = this.drivers.find((driver) => driver.id === driver_id);
		const _order = this.orders.find((order) => order.id === id);
		const sender = this.senders.find(
			(sender) => sender.id === _order.sender.id
		);
		_order.status = 'rejected';
		clearTimeout(_order.timer);

		// const driverSocket = this.socketUserMap.get(driver.id);
		// driverSocket.emit('orderRejected', { order: _order });
		this.sendEvent({
			socket: this.socketUserMap.get(driver.id),
			data: { order: _order },
			eventname: 'orderRejected',
		});
		this.sendEvent({
			socket: this.socketUserMap.get(sender.id),
			data: { order: _order },
			eventname: 'orderRejected',
		});
	}
	finishRide(updateOrder) {
		const { id, driver_id } = updateOrder;
		const driver = this.drivers.find((driver) => driver.id === driver_id);
		const _order = this.orders.find((order) => order.id === id);
		const sender = this.senders.find(
			(sender) => sender.id === _order.sender.id
		);
		driver.in_ride = false;
		this.sendEvent({
			socket: this.socketUserMap.get(sender.id),
			data: { order: _order },
			eventname: 'finishRide',
		});
		this.sendEvent({
			socket: this.socketUserMap.get(driver.id),
			data: { order: _order },
			eventname: 'finishedRide',
		});
	}
}
module.exports = OrderingApp;
