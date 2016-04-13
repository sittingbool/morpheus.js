'use strict';
// dependencies
//----------------------------------------------------------------------------------------------------------
const utilities = require('../helper/utilities');
const _ = require('lodash');
const TypeConverter = require('../helper/TypeConverter');
const DBArray = require('./DBArray');
//----------------------------------------------------------------------------------------------------------


/**
 * This class has no description yet.
 *
 * @class ApiModel
 * @constructor
 */
//----------------------------------------------------------------------------------------------------------
module.exports = class ApiModel
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
        this._properties = {};
        this._relationships = {};
        this._fetchedRelationships = []; // not to be refetched if empty

        this.entity = null;
        this.faulted = true;

        this._id = -1;
        this.typeConverter = new TypeConverter();
    }


    //------------------------------------------------------------------------------------------------------
    set id( value)
    //------------------------------------------------------------------------------------------------------
    {
        this._id = value;
    }


    //------------------------------------------------------------------------------------------------------
    get id()
    //------------------------------------------------------------------------------------------------------
    {
        return this._id;
    }


    //------------------------------------------------------------------------------------------------------
    setPropertyValue(name, value, options)
    //------------------------------------------------------------------------------------------------------
    {
        let property = this.entity.getProperty(name), storeType;

        if ( !property ) { return; }

        if (!options) {
            options = {};
        }

        storeType = this._storeTypeForPropertyType(property.type);

        value = this.typeConverter.anyToType(value, storeType);

        if ( options.skipDbUpdate !== true && this._properties[name] !== value ) {
            // TODO: update-query to db
        }

        this._properties[name] = value;
    }


    //------------------------------------------------------------------------------------------------------
    getPropertyValue(name)
    //------------------------------------------------------------------------------------------------------
    {
        let property = this.entity.getProperty(name), outputType, storeType, value;

        if ( !property ) {
            return undefined;
        }

        outputType = this._outputTypeForPropertyType(property.type);
        storeType = this._storeTypeForPropertyType(property.type);

        if ( this.faulted ) {
            // TODO: fetch if faulted
            this.faulted = false;
        }

        value = this._properties[name];

        if ( !value ) {
            return this.typeConverter.getDefaultValue(outputType);
        }

        value = this.typeConverter.anyToType(value, outputType, storeType);

        return value;
    }


    //------------------------------------------------------------------------------------------------------
    setOneRelation(name, element, options)
    //------------------------------------------------------------------------------------------------------
    {
        let relationship;

        if ( element instanceof ApiModel === false ) {
            return;
        }

        if (!options) {
            options = {};
        }

        relationship = this.entity.getRelationship(name);

        if ( !relationship || relationship.type !== 'one' ||
            !utilities.isValidId(element.id) ) { return; }

        if ( options.skipDbUpdate !== true &&
            this._relationships[name] && this._relationships[name].id !== element.id )
        {
             // TODO: send update query
        }

        this._relationships[name] = element; // TODO: set if null, merge if not
    }


    //------------------------------------------------------------------------------------------------------
    getOneRelation(name)
    //------------------------------------------------------------------------------------------------------
    {
        let relationship = this.entity.getRelationship(name);

        if ( !relationship ) {
            return undefined;
        }

        if ( !this._relationships[name] ) {
            if ( this._fetchedRelationships.indexOf(name) > -1 ) {
                return null;
            }

            // TODO: fetch from db

            // this._relationships[name] = result;
        }

        return this._relationships[name];
    }


    //------------------------------------------------------------------------------------------------------
    setManyRelation(name, elements, options)
    //------------------------------------------------------------------------------------------------------
    {
        let relationship, diff, lengthBeforeFilter, currentValue;

        if (!options) {
            options = {};
        }

        relationship = this.entity.getRelationship(name);

        if ( !relationship || relationship.type !== 'many' ) { return; }

        if ( !elements ) {
            elements = [];
        }

        lengthBeforeFilter = elements.length;

        if ( options.skipEntryFiltering !== true ) {
            elements = elements.filter(function(el) {
                return ( el instanceof ApiModel && utilities.isValidId(el.id) );
            });
        }

        if ( lengthBeforeFilter && elements.length < 1 ) {
            console.log('Can not set many related Elements without wrong type or without id on '+
                this.constructor.name);
            return;
        }

        currentValue = this._relationships[name];

        if ( options.skipDbUpdate !== true &&
            this._relationships[name] && this._relationships[name].id !== element.id )
        {
            // TODO: send update query
        }

        this._relationships[name] = elements; // TODO: set if null, merge if not
    }


    //------------------------------------------------------------------------------------------------------
    getManyRelation(name)
    //------------------------------------------------------------------------------------------------------
    {
    }


    //------------------------------------------------------------------------------------------------------
    addToManyRelation(name, elements)
    //------------------------------------------------------------------------------------------------------
    {

    }


    //------------------------------------------------------------------------------------------------------
    removeFromManyRelation(name, elements)
    //------------------------------------------------------------------------------------------------------
    {

    }


    //------------------------------------------------------------------------------------------------------
    setData(data, options)
    //------------------------------------------------------------------------------------------------------
    {
    }


    //------------------------------------------------------------------------------------------------------
    setDataFromDb(data, options)
    //------------------------------------------------------------------------------------------------------
    {
    }


    //------------------------------------------------------------------------------------------------------
    setDataFromJson(data, options)
    //------------------------------------------------------------------------------------------------------
    {
    }


    //------------------------------------------------------------------------------------------------------
    updateData(data, options)
    //------------------------------------------------------------------------------------------------------
    {
    }


    //------------------------------------------------------------------------------------------------------
    save()
    //------------------------------------------------------------------------------------------------------
    {

    }


    //------------------------------------------------------------------------------------------------------
    deleteObject()
    //------------------------------------------------------------------------------------------------------
    {

    }


    //------------------------------------------------------------------------------------------------------
    _arrayDiff(oldArray, newArray)
    //------------------------------------------------------------------------------------------------------
    {
        return utilities.arrayDiff(oldArray, newArray, function( el1, el2) {
            return el1 && el2 && utilities.isValidId(el1.id) && el1.id === el2.id;
        });
    }


    //------------------------------------------------------------------------------------------------------
    _storeTypeForPropertyType(type)
    //------------------------------------------------------------------------------------------------------
    {
        switch( type) {
            case "varchar255":
            case "text":
            case "decimal":
                return 'string';

            case "int16":
            case "int32":
            case "int64":
            case "date":
                return 'integer';

            case "float":
            case "double":
            case "bool":
            case "json":
                return type;

            default:
                return type;
        }
    }


    //------------------------------------------------------------------------------------------------------
    _outputTypeForPropertyType(type)
    //------------------------------------------------------------------------------------------------------
    {
        switch( type) {
            case "varchar255":
            case "text":
            case "decimal":
                return 'string';

            case "int16":
            case "int32":
            case "int64":
                return 'integer';

            case "float":
            case "double":
            case "bool":
            case "date":
                return type;

            case "json":
                return 'object';

            default:
                return type;
        }
    }
};
