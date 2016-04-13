/**
 * Created by richardhabermann on 03.04.16.
 */
var mocha = require('mocha');
var should = require('should');
var _ = require('lodash');
var path = require('path');

var Neo4jConnector = require('../lib/connection/Neo4jConnector');
var Neo4jTransaction = require('../lib/connection/Neo4jTransaction');
var Neo4jBaseDAO = require('../lib/data-access/Neo4jBaseDAO');
var DBModelScheme = require('../lib/model/DBModelScheme');
var EntityModel = require('../lib/model/EntityModel');

describe('neo4j-apimodel', function() {

    before(function() {
        var connector = Neo4jConnector.getInstance();
        connector.serverPath = 'http://localhost:7474';
        DBModelScheme.getInstance().initWithJsonOrFile(path.join(__dirname, 'data', 'modelScheme.json' ));
        EntityModel.getInstance().initWithFilePath(path.join(__dirname, 'data' ));
    });
});