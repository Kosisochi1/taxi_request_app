class Drive {
	constructor(name) {
		this.name = name;
		this.in_ride = false;
		this.id = Math.floor(Math.random() * 1000000).toString();
	}

	acceptOrder(order) {
		order.assignDrive(this);
	}
	rejectOrder(order) {
		console.log(`${this.name} rejects order ${order.id}`);
	}
}

module.exports = Drive;
