'use strict';
// dependencies
//----------------------------------------------------------------------------------------------------------
var SyncRestler = require('inline-rest');
var Neo4jResultParser = require('./Neo4jResultParser');
//----------------------------------------------------------------------------------------------------------


/**
 * This class has no description yet.
 *
 * @class Neo4jRequest
 * @constructor
 */
//----------------------------------------------------------------------------------------------------------
module.exports = class Neo4jRequest extends SyncRestler
//----------------------------------------------------------------------------------------------------------
{
    //------------------------------------------------------------------------------------------------------
    constructor( requestUrl, transaction)
    //------------------------------------------------------------------------------------------------------
    {
        super();

        this.requestUrl = requestUrl;

        if ( transaction ) {
            this.transaction = transaction;
        }
    }


    //------------------------------------------------------------------------------------------------------
    _setup()
    //------------------------------------------------------------------------------------------------------
    {
        this.transaction = null;
    }


    //------------------------------------------------------------------------------------------------------
    post(url, options)
    //------------------------------------------------------------------------------------------------------
    {
        if ( options && options.data && typeof options.data === 'object' ) {
            options.data = JSON.stringify(options.data);
        }

        return super.post(url, options);
    }


    //------------------------------------------------------------------------------------------------------
    cypherQuery( query)
    //------------------------------------------------------------------------------------------------------
    {
        let result = this.post(this.requestUrl, { data: { statements: [{ statement: query}]}});
        let parser = new Neo4jResultParser();

        if ( this.hasError ) {
            return [];
        }

        parser.rawData = result;

        result = parser.parsedData;

        if ( this.transaction ) {
            this.transaction.transactionCommitUrl = parser.rawData.commit;
            if ( parser.rawData.transaction && parser.rawData.transaction.expires ) {
                this.transaction.timeoutDate = parser.rawData.transaction.expires;
            }
        }

        return result;
    }


    //------------------------------------------------------------------------------------------------------
    _updateOptions( options, method)
    //------------------------------------------------------------------------------------------------------
    {
        options = super._updateOptions(options);

        options.headers = {
            'Accept': 'application/json; charset=UTF-8',
            'User-Agent': 'FMG-API-Neo4jRequest'
        };

        if ( method === 'post' ) {
            options.headers['Content-Type'] = 'application/json';
        }

        return options;
    }
};
