'use strict';
// dependencies
//----------------------------------------------------------------------------------------------------------
const _ = require('lodash');
const nodeUtil = require('sbool-node-utils');
const stringUtil = nodeUtil('stringUtil');
const cryptUtil = nodeUtil('cipherUtil');
const dateUtil = nodeUtil('dateUtil');
//----------------------------------------------------------------------------------------------------------


/**
 * This class has no description yet.
 *
 * @class CypherQuery
 * @constructor
 */
//----------------------------------------------------------------------------------------------------------
module.exports = class CypherQuery
//----------------------------------------------------------------------------------------------------------
{
    //------------------------------------------------------------------------------------------------------
    constructor(entityName) // TODO: accept labels
    //------------------------------------------------------------------------------------------------------
    {
        this.labels = this.entityName = entityName;
        this._setup();
    }


    //------------------------------------------------------------------------------------------------------
    _setup()
    //------------------------------------------------------------------------------------------------------
    {
        this.queryIdentifier = 'n';
        this.startString = '';
        this.wheres = [];
        this.matches = [];
        this.optionalMatches = [];
        this.returns = [];
        this.suffix = '';
        this.preReturnStatements=[];
        this.sortDescriptors = [];
        this.skip = -1;
        this.limit = -1;
        this.ignoreRelations = [];
        this.fetchFaulted = false;


        this._queryIdentifier = '_'+this.entityName.toLowerCase();

        if ( this.entityName === '*' ) {

            this._queryIdentifier = '_n';
        }
    }


    //------------------------------------------------------------------------------------------------------
    get queryIdentifier()
    //------------------------------------------------------------------------------------------------------
    {
        if ( this.entityName ) {
            if ( this.entityName === '*' ) {
                this._queryIdentifier = '_n';
                return this._queryIdentifier;
            }
            return '_' + this.entityName.toLowerCase();
        }

        return this._queryIdentifier;
    }


    //------------------------------------------------------------------------------------------------------
    set queryIdentifier( queryIdentifier)
    //------------------------------------------------------------------------------------------------------
    {
        return this._queryIdentifier;
    }


    //------------------------------------------------------------------------------------------------------
    objectIdentifier ()
    //------------------------------------------------------------------------------------------------------
    {
        return this.queryIdentifier;
    }


    //------------------------------------------------------------------------------------------------------
    fetchId( id)
    //------------------------------------------------------------------------------------------------------
    {
        this.where('id($self)='+id);
        return this;
    }


    //------------------------------------------------------------------------------------------------------
    fetchIds( ids)
    //------------------------------------------------------------------------------------------------------
    {
        if ( ids instanceof Array === false ) { return; }
        this.where('id($self) IN '+JSON.stringify(ids));
        return this;
    }


    //------------------------------------------------------------------------------------------------------
    _createMatchString( identifier, options)
    //------------------------------------------------------------------------------------------------------
    {
        var originOrEntity, relationship, target, matchArray;

        if ( !options ) {
            options = {};
        }

        originOrEntity = options.originOrEntity;
        relationship = options.relationship;
        target = options.target;
        matchArray = options.matchArray || [];

        if ( identifier.search(/\$self/i) >= 0 ) {
            identifier = identifier.replace(/\$self/g, this.objectIdentifier());
        }

        if ( originOrEntity === undefined ) {
            if ( typeof identifier === "string" ) {
                matchArray.push(identifier);
            } else if ( identifier instanceof Array ) {
                for( var i=0; i < identifier.length; i++ ) {
                    this._createMatchString(identifier[i], {matchArray: matchArray});
                }
            }
            return this;
        }
        if ( relationship !== undefined && typeof relationship === "string" &&
            typeof originOrEntity === "string") {
            var idString = "";
            if ( identifier !== null && typeof identifier === "string" ) {
                idString = identifier;
            }
            var targetString = "";
            if ( target !== undefined && typeof target === "string" ) {
                targetString = target;
            }
            var match = '('+originOrEntity+')-['+idString+':'+relationship+']->('+targetString+')';

            matchArray.push(match);
        }

        return this;
    }


    //------------------------------------------------------------------------------------------------------
    match( identifier, originOrEntity, relationship, target)
    //------------------------------------------------------------------------------------------------------
    {
        var options = {
            originOrEntity:originOrEntity,
            relationship:relationship,
            target:target,
            matchArray: this.matches
        };
        return this._createMatchString( identifier, options );
    }


    //------------------------------------------------------------------------------------------------------
    optionalMatch( identifier, originOrEntity, relationship, target)
    //------------------------------------------------------------------------------------------------------
    {
        var options = {
            originOrEntity:originOrEntity,
            relationship:relationship,
            target:target,
            matchArray: this.optionalMatches
        };
        return this._createMatchString( identifier, options );
    }


    //------------------------------------------------------------------------------------------------------
    where( _where)
    //------------------------------------------------------------------------------------------------------
    {
        var whereParts, wherePart, i, deepMatch, originIdentifier, index, path, compStr= '';

        if ( typeof _where === "string" ) {
            if ( _where.search(/\$self/i) >= 0 ) {
                _where = _where.replace(/\$self/g, this.objectIdentifier());
                path= _where.match(/([a-zA-z0-9_\.])+([a-zA-z0-9])/i);
                if ( path.length > 0 ) {
                    path = path[0];
                    whereParts = path.split('.');
                    if (whereParts.length > 2) { // deep match
                        originIdentifier = this.objectIdentifier();
                        deepMatch = '(' + originIdentifier + ')';
                        for (i = 1; i < whereParts.length - 1; i++) {
                            wherePart = whereParts[i];
                            originIdentifier = '_' + wherePart;
                            if ( i === whereParts.length-2) {
                                deepMatch +=
                                    '-[:' + wherePart + ']->(_' + wherePart + ')';
                            } else {
                                deepMatch +=
                                    '-[:' + wherePart + ']-()';
                            }
                        }
                        this.match(deepMatch);
                        if (whereParts.pop().search('id') >= 0) {
                            index = _where.search(/\.id/g) + 3;
                            _where = 'id(' + originIdentifier + ')' + _where.substr(index);
                        } else {
                            wherePart = whereParts.pop();
                            index = _where.search(new RegExp("\\."+wherePart,"g")) + wherePart.length+1;
                            compStr = _where.substr(index);

                            _where = originIdentifier + compStr;
                        }
                    } else if ( _where.match(
                            new RegExp(this.objectIdentifier()+'.id[^a-zA-z0-9]', 'g')) !== null )
                    {
                        // rewrites $self.id to id(self) only if
                        // id is no the beginning of another property name
                        _where = _where.replace(
                            new RegExp(this.objectIdentifier()+'.id', 'g'),
                            'id('+this.objectIdentifier()+')');
                    }
                }
            }

            this._baseWhere( _where);
            return this;
        }
        if ( _where instanceof Array ) {
            for( i=0; i < _where.length; i++ ) {
                this.where(_where[i]);
            }
        }
        return this;
    }


    // options:
    // conjunction: and|or|xor
    //------------------------------------------------------------------------------------------------------
    _baseWhere( whereString, options)
    //------------------------------------------------------------------------------------------------------
    {
        var conjunction = 'AND';

        if ( typeof whereString !== 'string' || whereString.length <= 0 ) {
            return this;
        }

        if ( options ) {
            if ( options.conjunction ) {
                conjunction = options.conjunction.toUpperCase();
            }
        }

        if ( ['AND', 'OR', 'XOR'].indexOf(conjunction) < 0 ) {
            return this;
        }

        if ( this.wheres.length === 0 ) {
            conjunction = '';
        } else {
            conjunction += ' ';
        }

        this.wheres.push( conjunction + '(' + whereString + ')' );

        return this;
    }


    //------------------------------------------------------------------------------------------------------
    whereNotDeleted()
    //------------------------------------------------------------------------------------------------------
    {
        this.where('NOT HAS($self.deleted)');
    }


    //------------------------------------------------------------------------------------------------------
    queryReturn ( ret)
    //------------------------------------------------------------------------------------------------------
    {
        if ( ret instanceof Array ) {
            for( var i=0; i < ret.length; i++ ) {
                this.queryReturn(ret[i]);
            }
            return this;
        }
        if ( typeof ret === "string" ) {
            this.returns.push( ret);
        }
        return this;
    }


    //------------------------------------------------------------------------------------------------------
    getQueryString( addReturn)
    //------------------------------------------------------------------------------------------------------
    {
        var i,
            query = "", statement;

        switch ( typeof this.labels ) {
            case 'string':
            {
                if ( this.labels === '*' ) {
                    this.match('('+this.queryIdentifier+')');
                } else {
                    this.match('(' + this.queryIdentifier + ':' + this.labels + ')');
                }
            }
                break;

            case 'object':
            {
                if ( this.labels instanceof Array ) {

                    this.match('('+this.queryIdentifier+')');

                    if ( this.labels.indexOf('*') < 0 ) {

                        this.labels.forEach(function (current) {
                            this.where(this.queryIdentifier + ':' + current);
                        }, this);
                    }
                }
            }
                break;

            default:
                break;
        }

        query += this.startString;
        this.matches = _.uniq(this.matches);
        this.optionalMatches = _.uniq(this.optionalMatches);
        this.wheres = _.uniq(this.wheres);
        this.returns = _.uniq(this.returns);

        if ( this.matches.length > 0 ) {
            query += "MATCH ";
            for (i=0; i < this.matches.length; i++ ) {
                query += ''+this.matches[i]+',';
            }
            if ( query.charAt(query.length-1) === "," ) { query = query.substr(0, query.length-1); }
            query += " ";
        }

        if ( this.wheres.length > 0 ) {
            query += "WHERE ";
            for (i=0; i < this.wheres.length; i++ ) {
                /*if ( i > 0 ) {
                 query += "AND ";
                 }*/
                //query += '('+this.wheres[i]+') ';
                query += this.wheres[i]+' ';
            }
        }

        if ( this.optionalMatches.length > 0 ) {
            query += "";
            for (i=0; i < this.optionalMatches.length; i++ ) {
                query += 'OPTIONAL MATCH '+this.optionalMatches[i]+' ';
            }
            if ( query.charAt(query.length-1) === "," ) { query = query.substr(0, query.length-1); }
            query += " ";
        }

        for (i = 0; i < this.preReturnStatements.length; i++) {
            statement = this.preReturnStatements[i].trim();

            query += statement + ' ';
        }

        if ( addReturn && this.returns.length > 0 ) {
            query += "RETURN ";
            for (i=0; i < this.returns.length; i++ ) {
                query += ''+this.returns[i]+',';
            }
            if ( query.charAt(query.length-1) === "," ) { query = query.substr(0, query.length-1); }
            query += " ";
        }

        if ( query.charAt(query.length-1) === " " ) { query = query.substr(0, query.length-1); }

        if ( ! stringUtil.stringIsEmpty(this.suffix) ) {
            if (this.suffix.charAt(0) !== ' ') {
                this.suffix = ' ' + this.suffix;
            }

            query += this.suffix;
        }

        return query + ';';
    }
};
