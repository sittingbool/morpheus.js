'use strict';
// dependencies
//----------------------------------------------------------------------------------------------------------
var APIModelUpdateRequest = require('../DBAccess/APIModelUpdateRequest');
var APIModelFetchRequest = require('../DBAccess/APIModelFetchRequest');
//----------------------------------------------------------------------------------------------------------


/**
 * This class has no description yet.
 *
 * @class DBArray
 * @constructor
 */
//----------------------------------------------------------------------------------------------------------
module.exports = class DBArray extends Array
//----------------------------------------------------------------------------------------------------------
{
    //------------------------------------------------------------------------------------------------------
    constructor( owner, relationshipName, entityName, elements)
    //------------------------------------------------------------------------------------------------------
    {
        var i, current, APIModel;

        super();

        this.locked = true;

        if ( owner ) {
            this.owner = owner;
        }

        this.relationshipName = relationshipName;
        this.entityName = entityName;

        if ( elements instanceof Array ) {

            APIModel = require('./APIModel.js');

            for( i = 0; i < elements.length; i++ ) {
                current = elements[i];

                if ( current instanceof APIModel ) {
                    this.push(current);
                }
            }
        }

        this.locked = false;

        this._setup();
    }


    //------------------------------------------------------------------------------------------------------
    _setup()
    //------------------------------------------------------------------------------------------------------
    {
    }


    //------------------------------------------------------------------------------------------------------
    objectAtIndex( index)
    //------------------------------------------------------------------------------------------------------
    {
        this.resolveFaulted([index]);

        return this[index] || null;
    }


    // returns unchanged
    //------------------------------------------------------------------------------------------------------
    _objectsForIds(ids)
    //------------------------------------------------------------------------------------------------------
    {
        var i, current, retArray = [];

        for( i = 0; i < this.length; i++ ) {
            current = this[i];

            if ( ids.indexOf(current.id) < 0 ) {
                continue;
            }

            retArray.push( current);
        }

        return retArray;
    }


    // returns faulted ones as solved if said so
    //------------------------------------------------------------------------------------------------------
    objectsForIds( ids, returnFaulted)
    //------------------------------------------------------------------------------------------------------
    {
        var plainObjects = this._objectsForIds(ids), idsToBeResolved, request, result,
            objectForId, plainObject;

        if ( returnFaulted ) {
            return plainObjects;
        }

        idsToBeResolved = [];

        objectForId = {};

        plainObjects.forEach( function( current) {
            if ( current.faulted ) {
                idsToBeResolved.push( current.id );
                objectForId[current.id] = current;
            }
        }, this);

        if ( idsToBeResolved.length < 1 ) {
            return plainObjects;
        }

        request = new APIModelFetchRequest( this.entityName, this.owner.context);

        request.fetchIds( idsToBeResolved);

        result = request.performFetch();

        result.objects.forEach( function( current) {
            plainObject = objectForId[current.id];

            plainObject.data = current.data;
            plainObject.faulted = false;
        }, this);

        return plainObjects;
    }


    /**
     * resolves all objects that are marked to be faulted with the real data
     * @param indexes - optional parameter to give an array of indexes this should be limited to or an object
     * representing a range with start (from 0) and count
     */
    //------------------------------------------------------------------------------------------------------
    resolveFaulted( indexesOrRange)
    //------------------------------------------------------------------------------------------------------
    {
        var ids = [], current, i;

        if ( indexesOrRange instanceof Array ) {
            indexesOrRange.forEach( function( idx) {

                if ( idx >= this.length ) {
                    return;
                }

                current = this[idx];

                if ( current.faulted === false ) {
                    return;
                }

                if ( current ) {
                    ids.push( current.id);
                }
            }, this);

            return this.objectsForIds(ids);
        }

        if ( typeof indexesOrRange === 'object' && indexesOrRange !== null &&
            typeof indexesOrRange.start === 'number' && indexesOrRange.start >= 0 &&
            typeof indexesOrRange.count === 'number' && indexesOrRange.count > 0 )
        {
            for( i = indexesOrRange.start; i < (indexesOrRange.start+indexesOrRange.count); i++ ) {
                if ( i >= this.length ) {
                    break;
                }
                current = this[i];

                if ( current.faulted === false ) {
                    continue;
                }

                ids.push(current.id);
            }

            return this.objectsForIds(ids);
        }
    }


    //------------------------------------------------------------------------------------------------------
    resolveFaultedByIds( ids)
    //------------------------------------------------------------------------------------------------------
    {
        return this.objectsForIds(ids);
    }


    //------------------------------------------------------------------------------------------------------
    normalize()
    //------------------------------------------------------------------------------------------------------
    {
        this.resolveFaulted();
    }


    //------------------------------------------------------------------------------------------------------
    push( items)
    //------------------------------------------------------------------------------------------------------
    {
        var request, result;

        if ( this.locked ) {
            return super.push( items);
        }

        if ( !(items) ) {
            return this;
        }

        request = new APIModelUpdateRequest( this.owner, this.owner.context );

        result = request.createRelationship(this.relationshipName, this.owner, items);

        if ( !result ) {
            return this;
        }

        return super.push(items);
    }


    //------------------------------------------------------------------------------------------------------
    remove( items)
    //------------------------------------------------------------------------------------------------------
    {
        var request, result, i, current, index, currentLockedState;

        if ( !(items) || ( items instanceof Array && items.length < 1 )) {
            return this;
        }

        if ( !this.locked ) {

            request = new APIModelUpdateRequest(this.owner, this.owner.context);

            result = request.removeRelationship(this.relationshipName, this.owner, items);

            if (!result) {
                return this;
            }
        }

        currentLockedState = this.locked;
        this.locked = true;

        for( i = 0; i < items.length; i++ ) {
            current = items[i];
            current = this._objectsForIds([current.id]);

            index = this.indexOf(current);

            if ( index >= 0 ){
                this.splice(index, 1);
            }
        }

        this.locked = currentLockedState;

        return this;
    }


    //------------------------------------------------------------------------------------------------------
    pop()
    //------------------------------------------------------------------------------------------------------
    {
        var request, result, item = super.pop();

        if ( !(item) ) {
            return item;
        }

        request = new APIModelUpdateRequest( this.owner, this.owner.context );

        result = request.removeRelationship(this.relationshipName, this.owner, item);

        if ( result ) {
            return item;
        }

        super.push(item); // reset it to original state

        return null;
    }


    //------------------------------------------------------------------------------------------------------
    concat( items)
    //------------------------------------------------------------------------------------------------------
    {
        var request, result, i, current, lockedBack;

        if ( !(items)  || ( items instanceof Array && items.length < 1 ) ) {
            return this;
        }

        if ( this.locked ) {
            return super.concat( items);
        }

        request = new APIModelUpdateRequest( this.owner, this.owner.context );

        result = request.createRelationship(this.relationshipName, this.owner, items);

        if ( !result ) {
            return this;
        }

        lockedBack = this.locked;
        this.locked = true;

        for( i = 0; i < items.length; i++ ) {
            current = items[i];
            this.push(current);
        }

        this.locked = lockedBack;

        return this;
    }


    //------------------------------------------------------------------------------------------------------
    splice( start, deleteCount, items)
    //------------------------------------------------------------------------------------------------------
    {
        var itemsToDelete = [], i, current, request, result;

        if ( this.locked ) {
            return super.splice(start, deleteCount, items);
        }

        for( i = start; i < deleteCount; i++ ) {
            if ( i >= this.length ) {
                break;
            }

            current = this[i];

            itemsToDelete.push(current);
        }

        if ( itemsToDelete.length > 0 ) {

            request = new APIModelUpdateRequest(this.owner, this.owner.context);

            result = request.removeRelationship(this.relationshipName, this.owner, itemsToDelete);

            if ( !result ) {
                return this;
            }
        }

        if ( !(items) || items.length < 1 ) {
            return this;
        }

        request = new APIModelUpdateRequest( this.owner, this.owner.context );

        result = request.createRelationship(this.relationshipName, this.owner, items);

        if ( !result ) {
            return this;
        }

        super.splice(start, deleteCount, items);
    }


    //------------------------------------------------------------------------------------------------------
    forEach( callback, thisArg, doNotResolve )
    //------------------------------------------------------------------------------------------------------
    {
        var i, current;

        if ( doNotResolve === true ) {
            return super.forEach(callback, thisArg);
        }

        this.resolveFaulted({start: 0, count: 100});

        for( i = 0; i < this.length; i++ ) {

            if ( i % 100 === 0 ) {
                this.resolveFaulted({start: i, count: 100});
            }

            current = this[i];

            callback.call(thisArg, current);
        }

        return this;
    }


    // works like Array.filter but applies the filter to this and returns this
    //------------------------------------------------------------------------------------------------------
    filterAndUpdate( callback, thisArg)
    //------------------------------------------------------------------------------------------------------
    {
        var itemsToRemove = [];

        this.forEach( function( item) {

            if ( ! callback.call(thisArg, item) ) {
                itemsToRemove.push(item);
            }

        }, thisArg);

        this.remove(itemsToRemove);

        return this;
    }
    
    
    //------------------------------------------------------------------------------------------------------
    __toJSON(resolve, seen)
    //------------------------------------------------------------------------------------------------------
    {
        var retString = '[', resolveArray = [], doNotResolve;

        if ( resolve instanceof Array ) {
            resolveArray = resolve;
            resolve = true;
        }

        doNotResolve = ( resolve !== true );

        if ( doNotResolve && this._hasFaulted() ) {
            return 'null';
        }

        this.forEach( function( current) {
            retString += current.__toJSON(resolveArray, seen)+ ',';
        }, this, doNotResolve);

        if ( this.length ) {
            retString = retString.substring(0, retString.lastIndexOf(','));
        }
        retString += ']';

        return retString;
    }


    //------------------------------------------------------------------------------------------------------
    _hasFaulted()
    //------------------------------------------------------------------------------------------------------
    {
        var retVal = false;
        this.forEach( function( current) {
            if ( current.faulted ) {
                retVal = true;
                return false;
            }
        }, this, true);

        return retVal;
    }
};
