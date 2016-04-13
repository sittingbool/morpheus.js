'use strict';

const _ = require('lodash');

function arrayDiff(oldArray, newArray, compare) {
    let result = { added:[], removed:[], same:[] }, i, current;

    if ( !_.isArray(oldArray) || !_.isArray(newArray) ) {
        return result;
    }

    if ( !_.isFunction(compare) ) {
        compare = function(el1, el2) {
            return el1 === el2;
        }
    }

    for( i = 0; i < oldArray.length; i++ ) {
        current = oldArray[i];
        if ( _.find(newArray, function(el) { return compare(el, current); }) ) {
            result.same.push(current);
        } else {
            result.removed.push(current);
        }
    }

    for( i = 0; i < newArray.length; i++ ) {
        current = newArray[i];
        if ( ! _.find(oldArray, function(el) { return compare(el, current); }) ) {
            result.added.push(current);
        }
    }

    return result;
}


function isValidId(idVal) {
    return _.isNumber(idVal) && _.isFinite(idVal) && idVal >= 0;
}


function stringIsEmpty( value) {
    return (! _.isString( value) || value.length < 1 );
}



module.exports = {
    arrayDiff: arrayDiff,
    isValidId: isValidId,
    stringIsEmpty : stringIsEmpty
};