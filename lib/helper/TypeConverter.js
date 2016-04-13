'use strict';
// dependencies
//----------------------------------------------------------------------------------------------------------
const dateformat = require('dateformat');
const isJSON = require('is-json');
const _ = require('lodash');
//----------------------------------------------------------------------------------------------------------


/**
 * This class has no description yet.
 *
 * @class TypeConverter
 * @constructor
 */
//----------------------------------------------------------------------------------------------------------
module.exports = class TypeConverter
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
        this._supportedTypes =
            ['json', 'object', 'string', 'number', 'integer', 'double', 'float', 'bool', 'boolean', 'date'];
        this._dateFromat = 'isoUtcDateTime';

        this._defaultValues = {
            json: 'null',
            object: null,
            string: '',
            number: 0,
            bool: false,
            date: new Date(0)
        };

        this._defaultValues.boolean = this._defaultValues.bool;
        this._defaultValues.integer =
        this._defaultValues.double =
        this._defaultValues.float =
            this._defaultValues.number;
    }


    //------------------------------------------------------------------------------------------------------
    set dateFormat( value)
    //------------------------------------------------------------------------------------------------------
    {
        this._dateFormat = value;
    }


    //------------------------------------------------------------------------------------------------------
    get dateFormat()
    //------------------------------------------------------------------------------------------------------
    {
        return this._dateFormat;
    }


    //------------------------------------------------------------------------------------------------------
    set defaultValues( value)
    //------------------------------------------------------------------------------------------------------
    {
        if ( !_.isObject(value) ) {
            return;
        }
        this._defaultValues = _.merge(this._defaultValues, value);
    }


    //------------------------------------------------------------------------------------------------------
    get defaultValues()
    //------------------------------------------------------------------------------------------------------
    {
        return this._defaultValues;
    }


    //------------------------------------------------------------------------------------------------------
    setDefaultValue(type, value)
    //------------------------------------------------------------------------------------------------------
    {
        this._defaultValues[type] = value;
    }


    //------------------------------------------------------------------------------------------------------
    getDefaultValue(type)
    //------------------------------------------------------------------------------------------------------
    {
        return this._defaultValues[type] || null;
    }


    //------------------------------------------------------------------------------------------------------
    typeIsSupported( type)
    //------------------------------------------------------------------------------------------------------
    {
        return ( this._supportedTypes.indexOf(type) > -1 );
    }


    //------------------------------------------------------------------------------------------------------
    /**
     * Parses any value into the given type
     * @param value {*} - the value to be parsed
     * @param type {string} - the target type
     * @param [fromType=null] {string} - (optional) the source type
     */
    anyToType( value, type, fromType)
    //------------------------------------------------------------------------------------------------------
    {
        if ( !fromType ) {
            fromType = typeof value;

            if ( fromType === 'object' && value !== null ) {
                if ( value instanceof Date ) {
                    fromType = 'date';
                }
            }
        }

        if ( fromType === type ) {
            return value;
        }

        switch (fromType) {

            case 'object':
                return this.objectToType(value, type);

            case 'json':
                return this.jsonToType(value, type);

            case 'string':
                return this.stringToType(value, type);

            case 'number':
                return this.numberToType(value, type);

            case 'date':
                return this.dateToType(value, type);

            case 'boolean':
            case 'bool':
                return this.booleanToType(value, type);
        }

        return value;
    }


    //------------------------------------------------------------------------------------------------------
    objectToType( value, type)
    //------------------------------------------------------------------------------------------------------
    {
        if ( !this.typeIsSupported(type) ) {
            return value;
        }

        switch (type) {

            case 'json':
            case 'string':
                return JSON.stringify(value);

            case 'number':
            case 'integer':
            case 'float':
            case 'double':
            case 'date':
            case 'boolean':
            case 'bool': {
                if ( value.value ) {
                    return this.anyToType( value.value, type);
                }

                return this.getDefaultValue(type);
            }
        }

        return value;
    }


    //------------------------------------------------------------------------------------------------------
    jsonToType( value, type)
    //------------------------------------------------------------------------------------------------------
    {
        if ( !this.typeIsSupported(type) ) {
            return value;
        }

        if ( !_.isString(value) || !isJSON(value) ) {
            return value;
        }

        return this.anyToType(JSON.parse(value), type);
    }


    //------------------------------------------------------------------------------------------------------
    stringToType( value, type)
    //------------------------------------------------------------------------------------------------------
    {
        if ( !this.typeIsSupported(type) ) {
            return value;
        }

        if ( isJSON(value) ) {
            return this.jsonToType(value, type);
        }

        switch (type) {
            case 'object':
                return { value: value };

            case 'json':
                return JSON.stringify( value);

            case 'float':
            case 'double': {
                if ( isNaN(value) ) {
                    return this.getDefaultValue(type);
                }
                return parseFloat(value);
            }

            case 'integer':
            case 'number': {
                if ( isNaN(value) ) {
                    return this.getDefaultValue(type);
                }
                return parseInt(value);
            }

            case 'date':
                return new Date(value);

            case 'boolean':
            case 'bool':{
                if ( !value ) {
                    return false;
                }
                switch(value.toLowerCase()){
                    case "true": case "yes": case "1": return true;
                    case "false": case "no": case "0": case null: return false;
                    default: return Boolean(value);
                }
            }
        }

        return value;
    }


    //------------------------------------------------------------------------------------------------------
    numberToType( value, type)
    //------------------------------------------------------------------------------------------------------
    {
        if ( !this.typeIsSupported(type) ) {
            return value;
        }

        if ( ! value ) {
            value = 0;
        }

        switch (type) {
            case 'object':
                return { value: value };

            case 'json':
                return JSON.stringify( value);

            case 'string':
                return '' + value;

            case 'date':
                return new Date(value);

            case 'boolean':
            case 'bool':
                return Boolean(value);
        }

        return value;
    }


    //------------------------------------------------------------------------------------------------------
    booleanToType( value, type)
    //------------------------------------------------------------------------------------------------------
    {
        if ( !this.typeIsSupported(type) ) {
            return value;
        }

        if ( !value ) {
            value = false;
        }

        switch (type) {
            case 'object':
                return { value: value };

            case 'json':
                return JSON.stringify( value);

            case 'string':
                return this.stringToType(value, type);

            case 'number':
            case 'integer':
            case 'float':
            case 'double':
                if ( value ) {
                    return 1;
                } else {
                    return 0;
                }

            case 'date':
                if ( value ) {
                    return new Date();
                } else {
                    return this.getDefaultValue(type);
                }
        }

        return value;
    }


    //------------------------------------------------------------------------------------------------------
    dateToType( value, type)
    //------------------------------------------------------------------------------------------------------
    {
        if ( !this.typeIsSupported(type) ) {
            return value;
        }

        switch (type) {
            case 'object':
                return { value: value };

            case 'json':
                return JSON.stringify( value);

            case 'string':
                if ( !value ) {
                    return null;
                }
                return dateformat(value, this.dateFormat);

            case 'number':
                if ( !value ) {
                    return 0;
                } else {
                    return value.getTime();
                }

            case 'boolean':
            case 'bool':
                return (!! value);
        }

        return value;
    }
};
