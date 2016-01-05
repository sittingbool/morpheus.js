'use strict';
// dependencies
//----------------------------------------------------------------------------------------------------------
var config = require('../../config/config');
//----------------------------------------------------------------------------------------------------------


/**
 * This class has no description yet.
 *
 * @class Neo4jConnector
 * @constructor
 */
//----------------------------------------------------------------------------------------------------------
module.exports = class Neo4jConnector
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
        this.databaseType = '';
        this.serverPath = '';

        this._config = {};
    }


    //------------------------------------------------------------------------------------------------------
    set config(config)
    //------------------------------------------------------------------------------------------------------
    {
        this._config = config;
        this.serverPath = config.server || '';
    }


    //------------------------------------------------------------------------------------------------------
    get config()
    //------------------------------------------------------------------------------------------------------
    {
        return this._config;
    }



    //------------------------------------------------------------------------------------------------------
    static getInstance()
    //------------------------------------------------------------------------------------------------------
    {
        if ( !this.instance ) {
            this.instance = new this();
        }

        return this.instance;
    }
};