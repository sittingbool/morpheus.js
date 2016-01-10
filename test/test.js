/**
 * Created by richardhabermann on 30.12.15.
 */
var mocha = require('mocha');
var should = require('should');
var _ = require('lodash');

var Neo4jConnector = require('../lib/connection/Neo4jConnector');
var Neo4JTransaction = require('../lib/connection/Neo4JTransaction');
var Neo4jBaseDAO = require('../lib/data-access/Neo4jBaseDAO');

describe('neo4j-connector', function() {

    var firstCreatedId;
    var lastCreatedId;
    var lastCreatedObject;

    before(function() {
        var connector = Neo4jConnector.getInstance();
        connector.serverPath = 'http://localhost:7474';
    });

    after( function() {
        //return; // if we need the data still
        // clean database
        var transaction = new Neo4JTransaction();

        transaction.performCypherRequest(
            'MATCH (n:Test) OPTIONAL MATCH n-[r]-() DELETE r,n');

        transaction.commit();
    });


    it('should create something', function( done) {
        var transaction = new Neo4JTransaction();

        var result = transaction.performCypherRequest(
            'CREATE (n:Test {name: "testcase 1", created: timestamp()}) RETURN id(n), n, labels(n)');

        transaction.commit();

        (Array.isArray(result)).should.be.true;
        result.length.should.be.greaterThan(0);

        result[0].n.should.be.ok;
        (Array.isArray(result[0].n)).should.be.true;
        result[0].n[0].should.be.ok;
        (typeof result[0].n[0]).should.be.equal('object');
        result[0].n[0].name.should.be.equal('testcase 1');
        (Array.isArray(result[0].n[0].labels)).should.be.true;
        result[0].n[0].labels[0].should.be.equal('Test');
        _.isNumber(result[0].n[0].id).should.be.true;

        result[0].n[0].id.should.be.greaterThanOrEqual(0);

        firstCreatedId = result[0].n[0].id;

        done();
    });


    it('should create an entity instance with access object', function( done) {
        var result;

        var dao = new Neo4jBaseDAO();

        dao.entityName = 'Test';

        result = dao.insertNode({ name:'testcase 2'});

        dao.transaction.commit();

        result.length.should.be.equal(1);

        result[0].name.should.be.equal('testcase 2');

        lastCreatedObject = result[0];

        lastCreatedId = lastCreatedObject.id;

        lastCreatedId.should.be.greaterThanOrEqual(0);

        done();
    });


    it('should list an entity with access object', function( done) {
        var result;
        var dao = new Neo4jBaseDAO();

        dao.entityName = 'Test';

        result = dao.listAll();

        (Array.isArray(result[0])).should.be.true;
        ( result[0].name === 'testcase 1' || result[0].name === 'testcase 2' ).should.be.true;

        result.length.should.be.greaterThan(1);

        console.log( 'Found '+ result.length + ' data sets of entity Test');

        done();
    });


    it('should list an entity with access object and where clause', function( done) {
        var result;
        var dao = new Neo4jBaseDAO();

        dao.entityName = 'Test';

        result = dao.listAll({where:'WHERE n.name = "testcase 2"'});

        (Array.isArray(result[0])).should.be.true;
        ( result[0].name === 'testcase 2' ).should.be.true;

        result.length.should.be.equal(1);

        console.log( 'Found '+ result.length + ' data sets of entity Test');

        done();
    });


    it('should list an entity with access object and options', function( done) {
        var result;
        var dao = new Neo4jBaseDAO();

        dao.entityName = 'Test';

        result = dao.listAll({orderBy: 'n.created ASC', skip:1, limit:1});

        (Array.isArray(result[0])).should.be.true;
        ( result[0].name === 'testcase 2' ).should.be.true;

        result.length.should.be.equal(1);

        console.log( 'Found '+ result.length + ' data sets of entity Test');

        done();
    });


    it('should update a node with access object and object data', function( done) {
        var result;
        var dao = new Neo4jBaseDAO();

        dao.entityName = 'Test';

        lastCreatedObject.name = 'testcase 3';

        result = dao.update(lastCreatedObject);

        (Array.isArray(result[0])).should.be.true;
        ( result[0].name === 'testcase 3' ).should.be.true;
        _.isNumber(result[0].updated).should.be.true;
        result[0].updated.should.be.greaterThan(1451771993601);

        result.length.should.be.equal(1);

        dao.transaction.rollback();

        lastCreatedObject = result[0];

        done();
    });


    it('should update a node with access object and where clause', function( done) {
        var result;
        var dao = new Neo4jBaseDAO();

        dao.entityName = 'Test';

        lastCreatedObject.name = 'testcase 3';

        result = dao.update('n.name = "testcase 2"', lastCreatedObject);

        (Array.isArray(result[0])).should.be.true;
        ( result[0].name === 'testcase 3' ).should.be.true;
        _.isNumber(result[0].updated).should.be.true;
        result[0].updated.should.be.greaterThan(1451771993601);

        result.length.should.be.equal(1);

        dao.transaction.rollback();

        lastCreatedObject = result[0];

        done();
    });


    it('should create and delete a single direction relationship', function( done) {
        var result;
        var dao = new Neo4jBaseDAO();

        var fetchIt = function() {
            var fetched = dao.transaction.performCypherRequest(
                'START source=node('+firstCreatedId+'), target=node('+lastCreatedId+') MATCH source-[rel:someRelationship]->target RETURN rel;');

            return dao.combinedResultsForIdentifier(fetched, 'rel')[0] || null;
        };

        dao.entityName = 'Test';

        // create
        result = dao.createRelationship(firstCreatedId, lastCreatedId, 'someRelationship');

        result.should.be.equal(1);

        result = fetchIt();

        ( !!result ).should.be.true;
        ( typeof result.id === 'number' && result.id > 0 ).should.be.true;

        // delete
        result = dao.deleteRelationship(firstCreatedId, lastCreatedId, 'someRelationship');

        result.should.be.equal(1);

        result = fetchIt();

        ( !!result ).should.be.false;

        dao.transaction.rollback();

        done();
    });


    it('should create and delete a double direction relationship', function( done) {
        var result;
        var dao = new Neo4jBaseDAO();

        var fetchIt = function() {
            var fetched = dao.transaction.performCypherRequest(
                'START source=node('+firstCreatedId+'), target=node('+lastCreatedId+') ' +
                'MATCH source-[rel:someRelationship]->target,' +
                ' source<-[inv:invRelationship]-target RETURN rel;');

            return dao.combinedResultsForIdentifier(fetched, 'rel')[0] || null;
        };

        dao.entityName = 'Test';

        // create
        result = dao.createRelationship(firstCreatedId, lastCreatedId, 'someRelationship', 'invRelationship');

        result.should.be.equal(2);

        result = fetchIt();

        ( !!result ).should.be.true;
        ( typeof result.id === 'number' && result.id > 0 ).should.be.true;

        // delete
        result = dao.deleteRelationship(firstCreatedId, lastCreatedId, 'someRelationship', 'invRelationship');

        result.should.be.equal(2);

        result = fetchIt();

        ( !!result ).should.be.false;

        dao.transaction.commit();

        done();
    });


    it('should delete a node with access object and object data', function( done) {
        var result;
        var dao = new Neo4jBaseDAO();

        dao.entityName = 'Test';

        result = dao.delete(lastCreatedObject);

        result.should.be.equal(1);

        console.log( 'Deleted '+ result.length + ' data sets of entity Test');

        dao.transaction.rollback();

        done();
    });


    it('should delete a node with access object and where clause', function( done) {
        var result;
        var dao = new Neo4jBaseDAO();

        dao.entityName = 'Test';

        result = dao.delete('n.name = "testcase 2"');

        result.should.be.equal(1);

        console.log( 'Deleted '+ result.length + ' data sets of entity Test');

        dao.transaction.rollback();

        done();
    });
});
