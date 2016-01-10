'use strict';
// dependencies
//----------------------------------------------------------------------------------------------------------
var Neo4jTransaction = require('../connection/Neo4jTransaction');
var _ = require('lodash');
//----------------------------------------------------------------------------------------------------------


/**
 * This class has no description yet.
 *
 * @class BaseNeo4JDAO
 * @constructor
 */
//----------------------------------------------------------------------------------------------------------
module.exports = class Neo4jBaseDAO
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
        this.autoRecreateTransaction = false;
        this.entityName = null;
    }

    //------------------------------------------------------------------------------------------------------
    get transaction()
    //------------------------------------------------------------------------------------------------------
    {
        if ( !this._transaction || (this._transaction.transactionTimedOut() &&
            this.autoRecreateTransaction ) )
        {
            this._transaction = new Neo4jTransaction();
        }

        return this._transaction;
    }


    // TODO: use start statement and allow multiple ids
    //------------------------------------------------------------------------------------------------------
    nodeById( id, saveMode)
    //------------------------------------------------------------------------------------------------------
    {
        let query;
        let result;

        if ( !_.isNumber(id) ) {
            return null;
        }

        id = parseInt(id);

        if (saveMode) {
            query = 'MATCH (n) WHERE id(n)=' + id;
        } else {
            query = 'START n=node(' + id + ')';
        }

        query += this._returnStatementForIdentifier('n');

        result = this.transaction.performCypherRequest(query);

        return this.combinedResultsForIdentifier(result, 'n')[0] || null;
    }


    //------------------------------------------------------------------------------------------------------
    insertNode( properties)
    //------------------------------------------------------------------------------------------------------
    {
        if ( !properties || typeof properties !== 'object' ) {
            properties = {};
        }

        properties.created = '$neo4j.timestamp()';

        return this.createNodeForEntity( this.entityName, properties);
    }


    /**
     * lists nodes for
     * @param options {object|string} - an object containing all or some of the following values:
     * { id: [0-9]+, idSet: [(int), (int),..], where: '...', orderBy: '...', skip: [0-9]+, limit: [0-9]+ }
     * @returns {array} - an array of objects
     */
    //------------------------------------------------------------------------------------------------------
    listAll(options)
    //------------------------------------------------------------------------------------------------------
    {
        if (! this.entityName ) {
            return [];
        }

        return this.listEntityWithName( this.entityName, options);
    }


    /**
     * updates an element or many elements in the database with the given properties
     * @param limitation {optional} - either the id, an array of ids or a where clause to find the items to
     * be updated
     * @param properties {object} - an object containing the properties that should be updated
     */
    //------------------------------------------------------------------------------------------------------
    update( limitation, properties)
    //------------------------------------------------------------------------------------------------------
    {
        let options;
        if ( !limitation ) {
            return [];
        }
        if ( !properties && typeof limitation === 'object' ) {
            properties = limitation;
            options = this._limitationOptionsForData(properties);
        } else {
            options = this._limitationOptionsForLimitation(limitation);
        }

        return this.updateQuery(properties, options);
    }


    //------------------------------------------------------------------------------------------------------
    delete( dataOrOptions)
    //------------------------------------------------------------------------------------------------------
    {
        let options;
        if ( !dataOrOptions ) {
            return 0;
        }
        if ( typeof dataOrOptions === 'string' && dataOrOptions.length ) {

            options = this._limitationOptionsForLimitation(dataOrOptions);

        } else {

            options = this._limitationOptionsForData(dataOrOptions);
        }

        return this.deleteNodeForEntity(options);
    }


    //------------------------------------------------------------------------------------------------------
    updateQuery( properties, options)
    //------------------------------------------------------------------------------------------------------
    {
        let propertiesQuery;
        let query;

        if ( !options || options.limit === 0 ) {
            return [];
        }

        if ( !properties ) {
            properties = {};
        }

        properties.updated = '$neo4j.timestamp()';
        delete properties.id;
        delete properties.labels;

        propertiesQuery = this._propertiesStatementForData(properties);

        query = this._startStatementForLimitationOptions(options);

        if ( !query.length ) {
            query += 'MATCH (n) ';
        }

        query += this._whereStatementForLimitationOptions(options);

        query += 'SET n += ' + propertiesQuery;

        query += this._returnStatementForIdentifier('n');

        let result = this.transaction.performCypherRequest(query);

        return this.combinedResultsForIdentifier(result, 'n');
    }


    //------------------------------------------------------------------------------------------------------
    deleteNodeForEntity(name, options)
    //------------------------------------------------------------------------------------------------------
    {
        let result;
        let query;
        let identifier = 'n';

        if ( !name ) {
            return 0;
        }

        if ( !options && typeof name === 'object' ) {
            options = name;
            name = '';
        } else if (name.length) {
            name = ':'+name;
        }

        // TODO create a query -model to take over those and other actions

        if ( typeof options === 'string' ) {
            options = { where: options };
        }

        if ( options ) {
            if ( options.limit === 0 ) {
                return [];
            }
            identifier = options.identifier || identifier;
        }

        query = this._startStatementForLimitationOptions(options);

        query += 'MATCH ('+identifier+name+')';

        query += this._whereStatementForLimitationOptions(options);

        query += ' OPTIONAL MATCH n-[r]-()';

        query += ' DELETE r,n RETURN count(n) as count';

        result = this.transaction.performCypherRequest(query);

        result = this.combinedResultsForIdentifier(result, 'count');

        result = result[0];

        if ( !result ) {
            return 0;
        }

        return result;
    }


    //------------------------------------------------------------------------------------------------------
    createRelationship(sourceId, targetId, name, inverseName, options)
    //------------------------------------------------------------------------------------------------------
    {
        let properties = null;
        let inverseProperties = null;
        let query;
        let retQuery;
        let result;

        if ( _.isNaN(sourceId) || _.isNaN(targetId) || typeof name !== 'string' || name.length < 1 ) {
            return 0;
        }

        if ( !options && inverseName && typeof inverseName === 'object' ) {
            options = inverseName;
            inverseName = undefined;
        }

        if ( !options ) {
            options = {};
        }

        properties = options.properties || properties;

        if ( properties ) {
            properties = ' ' + this._propertiesStatementForData(properties);
        } else {
            properties = '';
        }

        query = 'START source=node(' + parseInt(sourceId) + '), target=node(' + parseInt(targetId) + ')';

        query += ' CREATE UNIQUE source-[rel:' + name + properties + ']->target';

        retQuery = ' RETURN ( count(rel)';

        if ( inverseName ) {
            inverseProperties = options.properties || inverseProperties;

            if ( inverseProperties ) {
                inverseProperties = ' ' + this._propertiesStatementForData(inverseProperties);
            } else {
                inverseProperties = '';
            }

            query += ' CREATE UNIQUE source<-[inv:' + inverseName + inverseProperties + ']-target';

            retQuery += ' + count(inv) ';
        }

        query += retQuery + ') as count';

        result = this.transaction.performCypherRequest(query);

        result = this.combinedResultsForIdentifier(result, 'count');

        return result[0] || 0;
    }


    //------------------------------------------------------------------------------------------------------
    deleteRelationship(sourceId, targetId, name, inverseName, options)
    //------------------------------------------------------------------------------------------------------
    {
        let query;
        let delQuery;
        let retQuery;
        let result;

        if ( _.isNaN(sourceId) || _.isNaN(targetId)) {
            return 0;
        }

        if ( !options && inverseName && typeof inverseName === 'object' ) {
            options = inverseName;
            inverseName = undefined;
        }

        if ( ! name ) {
            name = '';
        } else {
            name = ':'+name;
        }

        // not used so far
        /*if ( !options ) {
            options = {};
        }*/

        query = 'START source=node(' + parseInt(sourceId) + '), target=node(' + parseInt(targetId) + ')';

        query += ' MATCH source-[rel' + name + ']->target';

        delQuery = ' DELETE rel';

        retQuery = ' RETURN ( count(rel)';

        if ( inverseName ) {

            query += ', source<-[inv:' + inverseName + ']-target';

            delQuery += ', inv';

            retQuery += ' + count(inv) ';
        }

        query += delQuery;

        query += retQuery + ') as count';

        result = this.transaction.performCypherRequest(query);

        result = this.combinedResultsForIdentifier(result, 'count');

        return result[0] || 0;
    }


    //------------------------------------------------------------------------------------------------------
    createNodeForEntity( name, properties)
    //------------------------------------------------------------------------------------------------------
    {
        let propertiesQuery = this._propertiesStatementForData(properties);

        let query = 'CREATE (n:'+name+' '+propertiesQuery+')'+this._returnStatementForIdentifier('n');
        let result = this.transaction.performCypherRequest(query);

        return this.combinedResultsForIdentifier(result, 'n');
    }


    //------------------------------------------------------------------------------------------------------
    listEntityWithName( name, options)
    //------------------------------------------------------------------------------------------------------
    {
        let result;
        let query;
        let identifier = 'n';

        // TODO create a query -model to take over those and other actions

        if ( typeof options === 'string' ) {
            options = { where: options };
        }

        if ( options ) {
            if ( options.limit === 0 ) {
                return [];
            }
            identifier = options.identifier || identifier;
        }

        query = this._startStatementForLimitationOptions(options);

        query += 'MATCH ('+identifier+':'+name+')';

        query += this._whereStatementForLimitationOptions(options);

        query += this._returnStatementForIdentifier(identifier, options);

        result = this.transaction.performCypherRequest(query);

        return this.combinedResultsForIdentifier(result, identifier);
    }


    //------------------------------------------------------------------------------------------------------
    combinedResultsForIdentifier(result, identifier)
    //------------------------------------------------------------------------------------------------------
    {
        let results = [];

        result.forEach( function(current) {
            if ( current[identifier] ) {
                if ( Array.isArray(current[identifier]) ) {
                    results = results.concat(current[identifier]);
                } else {
                    results.push(current[identifier]);
                }
            }
        });

        return results;
    }


    //------------------------------------------------------------------------------------------------------
    _returnStatementForIdentifier( identifier, options)
    //------------------------------------------------------------------------------------------------------
    {
        let statement = ' RETURN id('+identifier+'), '+identifier+', labels('+identifier+')';
        let orderBy = null;
        let skip = -1;
        let limit = -1;

        if ( options ) {
            orderBy = options.orderBy || orderBy;
            skip = options.skip || skip;
            limit = options.limit || limit;
        }

        if ( orderBy ) {
            orderBy = orderBy.trim();
            if ( orderBy.toLowerCase().indexOf('order by') < 0 ) {
                orderBy = 'ORDER BY '+orderBy;
            }
            statement += ' '+ orderBy;
        }

        if ( _.isNumber(skip) && skip > 0 ) {
            statement += ' SKIP '+skip;
        }

        if ( _.isNumber(limit) && limit > -1 ) {
            statement += ' LIMIT '+skip;
        }

        return statement + ';';
    }


    //------------------------------------------------------------------------------------------------------
    _propertiesStatementForData( data)
    //------------------------------------------------------------------------------------------------------
    {
        let propertiesQuery = '{';
        let propertiesEmpty = true;

        Object.keys(data).forEach( function( key) {
            let value = data[key] || null;
            // make json value except for neo4j - functions
            // (determined by $neo4j.<function-name>(<params-or-empty>)
            if ( typeof value !== 'string' || !/^\$neo4j\.([\w\W]+)\(([\w\W]+)?\)$/i.test(value) ) {
                value = JSON.stringify(value);
            } else {
                value = value.replace(/^\$neo4j\./i, '');
            }
            if ( !propertiesEmpty ) {
                propertiesQuery += ', ';
            }
            propertiesQuery += key+':'+value;
            propertiesEmpty = false;
        });

        return propertiesQuery + '}';
    }


    //------------------------------------------------------------------------------------------------------
    _limitationOptionsForLimitation( limitation)
    //------------------------------------------------------------------------------------------------------
    {
        if ( _.isNumber(limitation) ) {
            return { id: limitation };
        } else if ( Array.isArray(limitation) ) {
            return { idSet: JSON.stringify(limitation) };
        } else if ( typeof limitation === 'string' && limitation.length > 0 ) {
            return { where: limitation };
        }

        return null;
    }


    //------------------------------------------------------------------------------------------------------
    _limitationOptionsForData( data)
    //------------------------------------------------------------------------------------------------------
    {
        let options = null;

        if ( !data ) {
            return options;
        }

        if ( Array.isArray(data) ) {
            options.idSet = [];
            data.forEach( function(current) {
                if ( current && typeof current === 'object' &&
                    _.isNumber(current.id) && current.id >= 0 )
                {
                    options.idSet.push(current.id);
                }
            });
            if ( options.idSet.length < 1 ) {
                // if no data to update query with limit 0 to not execute for all data
                return { limit: 0 };
            }
            options.idSet = JSON.stringify(options.idSet);
        } else if ( typeof data === 'object' && _.isNumber(data.id) && data.id >= 0) {
            return { id: data.id };
        }

        return options;
    }


    //------------------------------------------------------------------------------------------------------
    _startStatementForLimitationOptions( options)
    //------------------------------------------------------------------------------------------------------
    {
        let statement;

        if ( !options || typeof options !== 'object' ) {
            return '';
        }

        statement = 'START n=node(';

        if ( options.id ) {
            return statement+options.id+') ';
        }

        if ( options.idSet ) {
            return statement+options.id.replace(/[\[\]]/g, '')+') ';
        }

        return '';
    }


    //------------------------------------------------------------------------------------------------------
    _whereStatementForLimitationOptions( options)
    //------------------------------------------------------------------------------------------------------
    {
        let where = null;

        if ( !options ) {
            return '';
        }

        where = options.where || where;

        if ( where ) {
            where = where.trim();
            if ( where.toLowerCase().indexOf('where') < 0 ) {
                where = 'WHERE '+where;
            }
            return ' '+ where;
        }

        return '';
    }
};
