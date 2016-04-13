'use strict';
// dependencies
//----------------------------------------------------------------------------------------------------------
var Neo4jRequest = require('./Neo4jRequest');
//----------------------------------------------------------------------------------------------------------


/**
 * This class has no description yet.
 *
 * @class Neo4jTransaction
 * @constructor
 */
//----------------------------------------------------------------------------------------------------------
module.exports = class Neo4jTransaction
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
        this.transactionId = -1;
        this._transactionCommitUrl = null;
        this.transactionTimeOutDate = null;

        this.errors = [];
        this.lastError = null;
    }


    //------------------------------------------------------------------------------------------------------
    get hasError()
    //------------------------------------------------------------------------------------------------------
    {
        return this.errors.length > 0;
    }


    //------------------------------------------------------------------------------------------------------
    get error()
    //------------------------------------------------------------------------------------------------------
    {
        return this.lastError;
    }


    //------------------------------------------------------------------------------------------------------
    set transactionCommitUrl( url)
    //------------------------------------------------------------------------------------------------------
    {
        let matches = url.match(/(?!transaction\/)([0-9]+)(?=\/commit)/g);
        if ( matches && matches.length ) {
            this.transactionId = parseInt(matches[0]) || -1;
        }
        this._transactionCommitUrl;
    }


    //------------------------------------------------------------------------------------------------------
    set timeoutDate( date)
    //------------------------------------------------------------------------------------------------------
    {
        if ( typeof date === 'string' ) {
            this.transactionTimeOutDate = new Date( date);
        } else if ( date instanceof Date ) {
            this.transactionTimeOutDate = date;
        }
    }

    //------------------------------------------------------------------------------------------------------
    handleError( error)
    //------------------------------------------------------------------------------------------------------
    {
        this.errors.push(error);
        this.lastError = error;
    }


    //------------------------------------------------------------------------------------------------------
    transactionIsValid()
    //------------------------------------------------------------------------------------------------------
    {
        this.transactionTimedOut(); // will reset transaction id if true
        return this.transactionId > -1;
    }


    //------------------------------------------------------------------------------------------------------
    transactionTimedOut()
    //------------------------------------------------------------------------------------------------------
    {
        if ( this.transactionId > -1 && this.transactionTimeOutDate &&
            this.transactionTimeOutDate.getTime() <= (new Date()).getTime() - 100 )
        {
            this.transactionId = -1; // invalidates transaction
            return true;
        }

        return false;
    }


    //------------------------------------------------------------------------------------------------------
    makeRequest()
    //------------------------------------------------------------------------------------------------------
    {
        let request = new Neo4jRequest( this.requestUrl, this);

        // TODO: hold process model and assign to request

        return request;
    }


    //------------------------------------------------------------------------------------------------------
    get requestUrl()
    //------------------------------------------------------------------------------------------------------
    {
        let Neo4jConnector = require('./Neo4jConnector');
        let url = Neo4jConnector.getInstance().serverPath+'/db/data/transaction';

        if ( this.transactionId > -1 ) {
            url += '/' + this.transactionId;
        }

        return url;
    }


    //------------------------------------------------------------------------------------------------------
    performCypherRequest( cypherString, quitTransaction)
    //------------------------------------------------------------------------------------------------------
    {
        let request, result;

        if ( typeof cypherString !== 'string' || this.transactionTimedOut() ) {
            return [];
        }

        request = this.makeRequest();

        result = request.cypherQuery( cypherString);

        if ( request.hasError ) {
            this.handleError(request.error);
        }

        if (quitTransaction) {
            this.rollback();
        }

        return result;
    }


    //------------------------------------------------------------------------------------------------------
    commit()
    //------------------------------------------------------------------------------------------------------
    {
        let request;

        if ( !this.transactionIsValid() ) {
            return false;
        }

        request = this.makeRequest();

        request.post(request.requestUrl + '/commit', null);

        if ( request.hasError ) {
            this.handleError(request.error);
            return false;
        }

        this.transactionId = -1;
        return true;
    }


    //------------------------------------------------------------------------------------------------------
    rollback()
    //------------------------------------------------------------------------------------------------------
    {
        let request;

        if ( !this.transactionIsValid() ) {
            return false;
        }

        request = this.makeRequest();

        request.delete(request.requestUrl, null);

        if ( request.hasError ) {
            this.handleError(request.error);
            return false;
        }

        this.transactionId = -1;
        return true;
    }
};
