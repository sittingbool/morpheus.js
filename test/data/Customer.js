'use strict';

var ObjectiveNeo4j = require('objective-neo4j');
var APIModel = ObjectiveNeo4j('APIModel');

module.exports = class Customer extends APIModel {
	constructor( data) {
		super("Customer", data);
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
	get company() {
		return this.getPropertyValue("company");
	}

	getCompany() {
		return this.getPropertyValue("company");
	}

	setCompany(objects) {
		return this.setPropertyValue(objects, "company");
	}

	set company(objects) {
		return this.setPropertyValue(objects, "company");
	}
	getProducts() {
		return this.getManyRelatedObjects("products");
	}
	get products() {
		return this.getManyRelatedObjects("products");
	}
	getIndexFromProducts(index) {
		return this.getManyRelatedObjectsForIndex("products", index);
	}

	setProducts(object) {
		return this.setManyRelatedObjects(object, "products");
	}
	set products(object) {
		return this.setManyRelatedObjects(object, "products");
	}
	addToProducts(object, index) {
		if(Array.isArray(object)) {return this.addManyRelatedObjects(object, "products");}
		else {return this.addManyRelatedObject(object, "products", index);}
	}
	removeFromProducts(object, index) {
		if(Array.isArray(object)) {return this.removeManyRelatedObjects(object, "products");}
		else {return this.removeManyRelatedObject(object, "products", index);}
	}

};