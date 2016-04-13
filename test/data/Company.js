'use strict';

var ObjectiveNeo4j = require('objective-neo4j');
var APIModel = ObjectiveNeo4j('APIModel');

module.exports = class Company extends APIModel {
	constructor( data) {
		super("Company", data);
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
	getEmployees() {
		return this.getManyRelatedObjects("employees");
	}
	get employees() {
		return this.getManyRelatedObjects("employees");
	}
	getIndexFromEmployees(index) {
		return this.getManyRelatedObjectsForIndex("employees", index);
	}

	setEmployees(object) {
		return this.setManyRelatedObjects(object, "employees");
	}
	set employees(object) {
		return this.setManyRelatedObjects(object, "employees");
	}
	addToEmployees(object, index) {
		if(Array.isArray(object)) {return this.addManyRelatedObjects(object, "employees");}
		else {return this.addManyRelatedObject(object, "employees", index);}
	}
	removeFromEmployees(object, index) {
		if(Array.isArray(object)) {return this.removeManyRelatedObjects(object, "employees");}
		else {return this.removeManyRelatedObject(object, "employees", index);}
	}
	getCustomers() {
		return this.getManyRelatedObjects("customers");
	}
	get customers() {
		return this.getManyRelatedObjects("customers");
	}
	getIndexFromCustomers(index) {
		return this.getManyRelatedObjectsForIndex("customers", index);
	}

	setCustomers(object) {
		return this.setManyRelatedObjects(object, "customers");
	}
	set customers(object) {
		return this.setManyRelatedObjects(object, "customers");
	}
	addToCustomers(object, index) {
		if(Array.isArray(object)) {return this.addManyRelatedObjects(object, "customers");}
		else {return this.addManyRelatedObject(object, "customers", index);}
	}
	removeFromCustomers(object, index) {
		if(Array.isArray(object)) {return this.removeManyRelatedObjects(object, "customers");}
		else {return this.removeManyRelatedObject(object, "customers", index);}
	}

};