'use strict';

var ObjectiveNeo4j = require('objective-neo4j');
var APIModel = ObjectiveNeo4j('APIModel');

module.exports = class Product extends APIModel {
	constructor( data) {
		super("Product", data);
	}
	getName() {
		return this.getPropertyValue("name");
	}

	get name() {
		return this.getPropertyValue("name");
	}

	setName(value) {
		return this.setPropertyValue(value, "name");
	}

	set name(value) {
		return this.setPropertyValue(value, "name");
	}
	get customer() {
		return this.getPropertyValue("customer");
	}

	getCustomer() {
		return this.getPropertyValue("customer");
	}

	setCustomer(objects) {
		return this.setPropertyValue(objects, "customer");
	}

	set customer(objects) {
		return this.setPropertyValue(objects, "customer");
	}

};