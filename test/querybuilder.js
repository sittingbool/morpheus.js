/**
 * Created by richardhabermann on 06.04.16.
 */
var mocha = require('mocha');
var should = require('should');
var _ = require('lodash');

var Neo4jConnector = require('../lib/connection/Neo4jConnector');
var Neo4jTransaction = require('../lib/connection/Neo4jTransaction');
var Neo4jBaseDAO = require('../lib/data-access/Neo4jBaseDAO');
var CypherQuery = require('../lib/model/CypherQuery');

describe('neo4j-connector', function() {

    it('should generate correct instance vars', function( done) {

        var instance = new CypherQuery('SomeEntityClass');

        instance.queryIdentifier.should.be.equal('_someentityclass');
        instance.objectIdentifier().should.be.equal('_someentityclass');
        instance.entityName.should.be.equal('SomeEntityClass');
        instance.labels.should.be.equal('SomeEntityClass');

        done();
    });


    it('should create correct match statement for relationship', function( done) {

        var instance = new CypherQuery('SomeEntityClass'), matches;

        instance.match('ident', 'origin', 'someRelation', 'target');
        instance.match('$self', 'origin', 'someRelation', 'target');

        matches = instance.matches;

        matches.length.should.be.equal(2);

        matches[0].should.be.equal('(origin)-[ident:someRelation]->(target)');
        matches[1].should.be.equal('(origin)-[_someentityclass:someRelation]->(target)');

        done();
    });


    it('should create correct match statement for variable', function( done) {

        var instance = new CypherQuery('SomeEntityClass'), matches;

        instance.match('ident');

        matches = instance.matches;

        matches.length.should.be.equal(1);

        matches[0].should.be.equal('ident');

        done();
    });


    it('should create correct optional match statement for relationship', function( done) {

        var instance = new CypherQuery('SomeEntityClass'), matches;

        instance.optionalMatch('ident', 'origin', 'someRelation', 'target');
        instance.optionalMatch('$self', 'origin', 'someRelation', 'target');

        matches = instance.optionalMatches;

        matches.length.should.be.equal(2);

        matches[0].should.be.equal('(origin)-[ident:someRelation]->(target)');
        matches[1].should.be.equal('(origin)-[_someentityclass:someRelation]->(target)');

        done();
    });


    it('should create correct optional match statement for variable', function( done) {

        var instance = new CypherQuery('SomeEntityClass'), matches;

        instance.optionalMatch('ident');

        matches = instance.optionalMatches;

        matches.length.should.be.equal(1);

        matches[0].should.be.equal('ident');

        done();
    });
});