'use strict';
// dependencies
//----------------------------------------------------------------------------------------------------------
var _ = require('lodash');
//----------------------------------------------------------------------------------------------------------


/**
 * This class has no description yet.
 *
 * @class Neo4jResultParser
 * @constructor
 */
//----------------------------------------------------------------------------------------------------------
module.exports = class Neo4jResultParser
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
        this._rawData = null;
        this._parsedData = null;
        this._didParse = false;
    }


    //------------------------------------------------------------------------------------------------------
    set rawData( data)
    //------------------------------------------------------------------------------------------------------
    {
        if ( typeof data === 'string' ) {
            data = JSON.parse(data);
        }
        this._rawData = data;
    }


    //------------------------------------------------------------------------------------------------------
    get rawData()
    //------------------------------------------------------------------------------------------------------
    {
        return this._rawData;
    }


    //------------------------------------------------------------------------------------------------------
    get parsedData()
    //------------------------------------------------------------------------------------------------------
    {
        if ( !this._didParse ) {
            this.parseData();
        }

        return this._parsedData;
    }


    //------------------------------------------------------------------------------------------------------
    parseData()
    //------------------------------------------------------------------------------------------------------
    {
        let parsedData = [], i, current, currentData;

        let results = this._rawData.results || [];
        //let data = this._rawData.data || [];

        let resultObject = {};

        for( i = 0; i < results.length; i++ ) {

            current = results[i];
            currentData = current.data || [];

            this.parseResult( current, currentData, resultObject);

            Object.keys( resultObject).forEach( function( key) {

                if ( Array.isArray(resultObject[key]) ) {
                    _.uniq(resultObject[key], function(n) {
                        if ( typeof n === 'object' && n && _.isNumber(n.id) ) {
                            return n.id;
                        }

                        return n;
                    });
                }

            });

            parsedData.push(resultObject);
        }

        this._parsedData = parsedData;
    }


    //------------------------------------------------------------------------------------------------------
    parseResult( result, data, resultObject)
    //------------------------------------------------------------------------------------------------------
    {
        let columns = result.columns;

        data.forEach( function( current) {
            this.parseResultEntry( columns, current.row, resultObject);
        }, this);
    }


    //------------------------------------------------------------------------------------------------------
    parseResultEntry(columns, data, resultObject)
    //------------------------------------------------------------------------------------------------------
    {
        let i, currentCol, currentParseKey, currentData, currentVal, parentKey;

        let currentParseObject = {};

        // TODO: connect to object identifier

        let expression = /\([a-zA-Z]+\)/g;

        for ( i = 0; i < columns.length; i++ ) {
            currentCol = columns[i];
            currentData = data[i];

            currentParseObject[currentCol] = currentData;
        }

        Object.keys( currentParseObject).forEach( function( key) {

            currentCol = currentParseKey = key;
            currentData = currentVal = currentParseObject[key];

            if ( currentData === undefined ) {
                return;
            }

            if ( expression.test(currentParseKey) ) {

                currentParseKey = currentParseKey.replace(expression, ''); // eg. label(n) -> label

                parentKey = currentCol.replace(currentParseKey, '').replace(/(\(|\))/g, ''); // eg. label(n) -> (n) -> n

                currentData = currentParseObject[parentKey];

                if ( typeof currentData === 'object' && currentData ) {
                    currentData[currentParseKey] = currentVal;

                    currentParseObject[key] = 0;

                    return;
                }

                currentData = currentVal; // set back to original for following code

            }

            if ( !resultObject[key] || !Array.isArray(resultObject[key]) ) {
                resultObject[key] = [];
            }

            resultObject[key].push( currentData);
        }, this);
    }
};
