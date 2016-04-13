'use strict';
// dependencies
//----------------------------------------------------------------------------------------------------------
const lodash = require('lodash');
const fs = require('fs');
const path = require('path');
const utilities = require('../helper/utilities');
//----------------------------------------------------------------------------------------------------------


/**
 * This class has no description yet.
 *
 * @class EntityModel
 * @constructor
 */
//----------------------------------------------------------------------------------------------------------
module.exports = class EntityModel
//----------------------------------------------------------------------------------------------------------
{
    //------------------------------------------------------------------------------------------------------
    constructor(filePath)
    //------------------------------------------------------------------------------------------------------
    {
        this._setup();
    }


    //------------------------------------------------------------------------------------------------------
    initWithFilePath( filePath)
    //------------------------------------------------------------------------------------------------------
    {
        try {
            this.model = this._setupWithFilePath(filePath);
        } catch (error) {
            console.log( error);
        }
    }

    //------------------------------------------------------------------------------------------------------
    _setupWithFilePath(jsonOrPath)
    //------------------------------------------------------------------------------------------------------
    {
        var stats;

        if ( utilities.stringIsEmpty(jsonOrPath) ) {
            return null;
        }

        if ( !fs.existsSync(jsonOrPath) ) {
            return null;
        }

        stats = fs.lstatSync(jsonOrPath);

        if ( !stats.isFile() ) {
            jsonOrPath = path.join(jsonOrPath, 'index.js');
        }

        if ( fs.existsSync(jsonOrPath) ) {
            stats = fs.lstatSync(jsonOrPath);

            if ( stats.isFile() ) {
                return require(jsonOrPath);
            }
        }

        return null;
    }


    //------------------------------------------------------------------------------------------------------
    _setup()
    //------------------------------------------------------------------------------------------------------
    {
        this.model = null;
    }


    //------------------------------------------------------------------------------------------------------
    modelForName( name, options)
    //------------------------------------------------------------------------------------------------------
    {
        var MClass = this.model[name] || null, APIModel, fallBack = false;

        if ( ! MClass ) {
            APIModel = require('./APIModel.js');
            MClass = APIModel;
            //fallBack = ( returnFallback !== false );
            if ( !fallBack ) {
                return null;
            }
        }

        if ( data === undefined || !(data) ) {
            return MClass;
        }

        if ( fallBack ) {
            return new APIModel(name, data);
        }

        return new MClass(data);
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
