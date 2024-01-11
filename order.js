class Order {
	constructor({ current_location, destination, price, sender }) {
		this.current_location = current_location;
		this.destination = destination;
		this.price = price;
		this.sender = sender;
		this.id = Math.floor(Math.random() * 1000000).toString();
		this.driver = null;
		this.status = 'pending';
	}
	assignDriver(driver) {
		this.driver = driver;
	}
}

module.exports = Order;
