'use strict';

var ObjectiveNeo4j = require('objective-neo4j');
var APIModel = ObjectiveNeo4j('APIModel');

module.exports = class Employee extends APIModel {
	constructor( data) {
		super("Employee", data);
	}
	getFirstName() {
		return this.getPropertyValue("firstName");
	}

	get firstName() {
		return this.getPropertyValue("firstName");
	}

	setFirstName(value) {
		return this.setPropertyValue(value, "firstName");
	}

	set firstName(value) {
		return this.setPropertyValue(value, "firstName");
	}
	getLastName() {
		return this.getPropertyValue("lastName");
	}

	get lastName() {
		return this.getPropertyValue("lastName");
	}

	setLastName(value) {
		return this.setPropertyValue(value, "lastName");
	}

	set lastName(value) {
		return this.setPropertyValue(value, "lastName");
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

};