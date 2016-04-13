'use strict';
// dependencies
//----------------------------------------------------------------------------------------------------------
const jsonFile = require('jsonfile');
const lodash = require('lodash');
const fs = require('fs');
const path = require('path');
const utilities = require('../helper/utilities');
const DBEntity = require('../DBEntity');
//----------------------------------------------------------------------------------------------------------


/**
 * This class has no description yet.
 *
 * @class DBModelScheme
 * @constructor
 */
//----------------------------------------------------------------------------------------------------------
class DBModelScheme
//----------------------------------------------------------------------------------------------------------
{
    //var schemeDict = null;

    //------------------------------------------------------------------------------------------------------
    constructor( jsonOrFile)
    //------------------------------------------------------------------------------------------------------
    {
        this._setup();
    }


    //------------------------------------------------------------------------------------------------------
    _setup()
    //------------------------------------------------------------------------------------------------------
    {
        this.schemeDict = {};
        //this.setupModel();
    }


    //------------------------------------------------------------------------------------------------------
    initWithJsonOrFile( jsonOrPath)
    //------------------------------------------------------------------------------------------------------
    {
        var schemeDict;

        try {
            schemeDict = this._setJSONORFile(jsonOrFile) || null;

            this.scheme.entities.forEach(function (entity) {
                var entityDict = {}, elements = [];

                entity.properties = entity.properties.concat([
                    {name: "created", type: "date", index: false, optional: true, unique: false, encrypted: false},
                    {name: "updated", type: "date", index: false, optional: true, unique: false, encrypted: false},
                    {name: "deleted", type: "date", index: false, optional: true, unique: false, encrypted: false}
                ]);

                entity.properties.forEach(function (property) {
                    property.accessType = "property";
                    //entityDict[property.name] = property;
                    elements.push(property);
                });

                entity.relationships.forEach(function (relationship) {
                    relationship.accessType = "relationship";
                    //entityDict[relationship.name] = relationship;
                    elements.push(relationship);
                });

                schemeDict[entity.name] = new DBEntity(entity.name, elements);
            });

            this.scheme = schemeDict;
        } catch (error) {
            console.log(error);
        }
    }


    //------------------------------------------------------------------------------------------------------
    _setJSONORFile( jsonOrPath)
    //------------------------------------------------------------------------------------------------------
    {
        var stats;

        if ( _.isObject(jsonOrPath) ) {
            return jsonOrPath;
        }

        if ( utilities.stringIsEmpty(jsonOrPath) ) {
            return null;
        }

        if ( fs.existsSync(jsonOrPath) ) {
            stats = fs.lstatSync(jsonOrPath);

            if ( stats.isFile() ) {
                jsonOrPath = require(jsonOrPath);
            }
        } else {
            jsonOrPath = JSON.stringify(jsonOrPath);
        }

        return jsonOrPath;
    }


    /*//------------------------------------------------------------------------------------------------------
    setupModel()
    //------------------------------------------------------------------------------------------------------
    {
        var configDir = null,
            defaultPath = path.join(__dirname, 'modelscheme.json');

        var config = configLoader(configDir, {
            configEnvironmentVar: 'CONFIGDIR',
            subDirPath: 'database',
            fileToBeLoaded: 'modelScheme.json',
            altDirNameKey: 'modelDirectory',
            altFileNameKey: 'modelFile',
            defaultFilePath: defaultPath
        });

        if ( config ) {
            return this.setupSchemeDict(config);
        }

        this.schemeDict = null;
    }


    //------------------------------------------------------------------------------------------------------
    setupSchemeDict( modelFile)
    //------------------------------------------------------------------------------------------------------
    {
        console.log("ModelFile: "+modelFile);

        var scheme = jsonFile.readFileSync(modelFile);

        if ( scheme === null || typeof scheme === undefined || scheme === undefined) {
            console.log( "Error reading database model file");
            return;
        }

        var schemeDict = {
            version: scheme.version
        };

        scheme.entities.forEach( function( entity) {
            var entityDict = {}, elements = [];

            entity.properties = entity.properties.concat([
                { name: "created", type: "date", index: false, optional:true, unique: false, encrypted: false },
                { name: "updated", type: "date", index: false, optional:true, unique: false, encrypted: false },
                { name: "deleted", type: "date", index: false, optional:true, unique: false, encrypted: false }
            ]);

            entity.properties.forEach( function ( property) {
                property.accessType = "property";
                //entityDict[property.name] = property;
                elements.push(property);
            });

            entity.relationships.forEach( function ( relationship) {
                relationship.accessType = "relationship";
                //entityDict[relationship.name] = relationship;
                elements.push(relationship);
            });

            schemeDict[entity.name] = new DBEntity(entity.name, elements);
        });

        this.scheme = this.schemeDict = schemeDict; // alias
    }*/


    //------------------------------------------------------------------------------------------------------
    static getInstance()
    //------------------------------------------------------------------------------------------------------
    {
        if ( !this.instance ) {
            this.instance = new this();
        }
        return this.instance;
    }

    //------------------------------------------------------------------------------------------------------
    getEntityByName( name)
    //------------------------------------------------------------------------------------------------------
    {
        return this.scheme[name];
    }
}

module.exports = DBModelScheme;
