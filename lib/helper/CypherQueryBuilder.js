'use strict';
// dependencies
//----------------------------------------------------------------------------------------------------------
const _ = require('lodash');
//----------------------------------------------------------------------------------------------------------


// constants
//----------------------------------------------------------------------------------------------------------
const COMPARATORS = { $eq: '=', $ne: '<>', $lt: '<', $gt: '>', $lte: '<=', $gte: '>=', $regex: '=~' };
const COLLECTION_COMPARATORS = { $in:'IN' };
const STRING_MATCHING = { $startsWith: 'STARTS WITH', $endsWith:'ENDS WITH', $contains:'CONTAINS' };
//----------------------------------------------------------------------------------------------------------

/**
 * This class has no description yet.
 *
 * @class CypherQueryBuilder
 * @constructor
 */
//----------------------------------------------------------------------------------------------------------
module.exports = class CypherQueryBuilder
//----------------------------------------------------------------------------------------------------------
{
    //------------------------------------------------------------------------------------------------------
    constructor()
    //------------------------------------------------------------------------------------------------------
    {
        this._setup();
    }


    //------------------------------------------------------------------------------------------------------
    _setup()
    //------------------------------------------------------------------------------------------------------
    {
        this._setupComparators();
    }


    //------------------------------------------------------------------------------------------------------
    _setupComparators()
    //------------------------------------------------------------------------------------------------------
    {
        let usedComparatorMaps, combinedMapping = {};

        this.comparators = {};
        this.knownComparators = [];

        usedComparatorMaps = [COMPARATORS, COLLECTION_COMPARATORS, STRING_MATCHING];

        usedComparatorMaps.forEach(function( current) {
            combinedMapping = _.merge( current);
        }, this);

        Object.keys(combinedMapping).forEach(function( key) {
            this._setComparator(key, COMPARATORS[key]);
        }, this);
    }


    //------------------------------------------------------------------------------------------------------
    _setComparator(name, cypher)
    //------------------------------------------------------------------------------------------------------
    {
        let usableComparatorKeys = [];

        usableComparatorKeys.push(name);
        usableComparatorKeys.push(name.toLowerCase());
        usableComparatorKeys.push(name.toUpperCase());

        usableComparatorKeys.forEach(function( current) {
            this.comparators[current] = cypher;

            if ( this.knownComparators.indexOf(current) < 0 ) {
                this.knownComparators.push(current);
            }

            if ( this.knownComparators.indexOf(cypher) < 0 ) {
                this.knownComparators.push(cypher);
            }

        }, this);
    }


    //------------------------------------------------------------------------------------------------------
    propertiesCypher( data)
    //------------------------------------------------------------------------------------------------------
    {
        let query = '{ ', queryFinal = ' }';

        if ( !_.isObject(data) ) {
            return query+queryFinal;
        }

        Object.keys(data).forEach(function( current) {
            if ( typeof data[current] === 'undefined' ) {
                return;
            }

            query += current + ': ' + JSON.stringify(data[current]) + ', ';

        }, this);

        query = query.substr(0, query.lastIndexOf(',') );

        return query+queryFinal;
    }


    //------------------------------------------------------------------------------------------------------
    startCypher( id, variable, addStartCommand)
    //------------------------------------------------------------------------------------------------------
    {
        let query = '';

        if ( _.isString(id) && !isNaN(id) ) {
            id = parseInt(id);
        }

        if ( ( !_.isNumber(id) && !_.isArray(id) ) || ! _.isString(variable) || variable.length < 1 ) {
            return '';
        }

        if ( addStartCommand ) {
            query = 'START ';
        }

        query += variable + '=node(';
        query += JSON.stringify(id).replace(/[\[\]]+/g, '');
        query += ')';

        return query;
    }


    //------------------------------------------------------------------------------------------------------
    createNode(data, options)
    //------------------------------------------------------------------------------------------------------
    {
        let query, identifier = 'n', returnQuery = null, labelString = '';

        if ( options ) {
            if ( _.isString(options.return) ) {
                returnQuery = options.return;
            }

            if ( _.isString(options.identifier) && options.identifier.length ) {
                identifier = options.identifier;
            }

            if ( _.isString(options.label) ) {
                labelString = ':' + options.label;
            }

            if ( _.isArray(options.labels) ) {
                labelString = '';
                options.labels.forEach( function(current) {
                    if ( !_.isString(current) ) {
                        return;
                    }
                    labelString += ':' + current;
                });
            }
        }

        if ( !returnQuery ) {
            returnQuery = 'RETURN '+identifier+', id('+identifier+')';
        }

        query = 'CREATE (' + identifier + labelString + ' ' + this.propertiesCypher(data) + ') ';

        return query + returnQuery + ';';
    }


    //------------------------------------------------------------------------------------------------------
    updateNodeProperties(id, data, options)
    //------------------------------------------------------------------------------------------------------
    {
        let query, identifier = 'n', returnQuery = null;

        if ( options ) {

            if ( _.isString(options.return) ) {
                returnQuery = options.return;
            }

            if ( _.isString(options.identifier) && options.identifier.length ) {
                identifier = options.identifier;
            }
        }

        query = this.startCypher(id, identifier, true);

        if ( query.length < 1 ) {
            return '';
        }

        if ( !returnQuery ) {
            returnQuery = 'RETURN '+identifier+', id('+identifier+')';
        }

        query += ' SET ' + identifier + ' = ' + this.propertiesCypher(data);

        return query + returnQuery + ';';
    }


    //------------------------------------------------------------------------------------------------------
    deleteNode(id)
    //------------------------------------------------------------------------------------------------------
    {
        let query = this.startCypher(id, 'n', true);

        if ( query.length < 1 ) {
            return '';
        }

        query += ' MATCH (n)-[r]-() DELETE r,n';

        return query + ';';
    }


    //------------------------------------------------------------------------------------------------------
    createRelationship( sourceId, targetId, options)
    //------------------------------------------------------------------------------------------------------
    {
        let query, subQuery,
            name = null, inverseName = null, properties = '', inverseProperties = '', returnQuery = null;

        query = this.startCypher(sourceId, 's', true);

        if ( query.length < 1 ) {
            return '';
        }

        subQuery = this.startCypher(targetId, 't', false);

        if ( subQuery.length < 1 ) {
            return '';
        }

        if ( options ) {

            if ( _.isString(options.return) ) {
                returnQuery = options.return;
            }

            if ( _.isString(options.name) && options.name.length ) {
                name = options.name;
            }

            if ( _.isString(options.inverseName) && options.inverseName.length ) {
                inverseName = options.inverseName;
            }

            if ( _.isObject(options.properties) ) {
                properties = ' '+this.propertiesCypher(options.properties);
            }

            if ( _.isObject(options.inverseProperties) ) {
                inverseProperties = ' '+this.propertiesCypher(options.inverseProperties);
            }
        }

        if ( !name ) {
            return '';
        }

        query += ', ' + subQuery;

        subQuery = '';

        query += ' CREATE UNIQUE (s)-[r:' + name + properties + ']->(t) ';

        if ( inverseName ) {
            query += 'CREATE UNIQUE (t)-[ri:' + inverseName + inverseProperties + ']->(s) ';
            subQuery = ' + count(ri)';
        }

        if ( !returnQuery ) {
            returnQuery = 'RETURN count(s) + count(t) as nodes, count(r)' + subQuery + ' as relationships';
        }

        return query + returnQuery + ';';
    }


    //------------------------------------------------------------------------------------------------------
    deleteRelationship( sourceId, targetId, options)
    //------------------------------------------------------------------------------------------------------
    {
        let query, subQuery,
            name = null, inverseName = null, deleteQuery;

        query = this.startCypher(sourceId, 's', true);

        if ( query.length < 1 ) {
            return '';
        }

        subQuery = this.startCypher(targetId, 't', false);

        if ( subQuery.length < 1 ) {
            return '';
        }

        if ( options ) {

            if ( _.isString(options.name) && options.name.length ) {
                name = options.name;
            }

            if ( _.isString(options.inverseName) && options.inverseName.length ) {
                inverseName = options.inverseName;
            }
        }

        if ( !name ) {
            return '';
        }

        query += ', ' + subQuery;

        query += ' MATCH (s)-[r:' + name + ']->(t) ';

        deleteQuery = 'DELETE r';

        if ( inverseName ) {
            query += ', (t)-[ri:' + inverseName + ']->(s) ';
            deleteQuery += ', ri';
        }

        return query + deleteQuery + ';';
    }


    //------------------------------------------------------------------------------------------------------
    _whereComparatorForString( string)
    //------------------------------------------------------------------------------------------------------
    {

    }


    //------------------------------------------------------------------------------------------------------
    whereComparisonQueryForString( string)
    //------------------------------------------------------------------------------------------------------
    {

    }


    //------------------------------------------------------------------------------------------------------
    _whereComparatorForObject( object)
    //------------------------------------------------------------------------------------------------------
    {

    }


    //------------------------------------------------------------------------------------------------------
    whereComparisonQueryForObject( object)
    //------------------------------------------------------------------------------------------------------
    {

    }
};
