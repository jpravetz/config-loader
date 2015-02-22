/*************************************************************************
 * Copyright(c) 2012-2015 Jim Pravetz <jpravetz@epdoc.com>
 * May be freely distributed under the MIT license.
 **************************************************************************/

/**
 * Filters the config using the config def, redacting passwords according to the def file
 * @param def Path to config definition file
 * @param config Config object
 * @returns {{supported: {}, unsupported: {}}}
 */
module.exports = function(def,config) {
    var spec = require(def);
    var result = { supported: {}, unsupported: {} };
    _.each(config, function (item, key) {
        if (spec.columns[key]) {
            if (item instanceof Array) {
                result.supported[key] = item;
            } else if (_.isObject(item)) {
                result.supported[key] = {};
                _.each( item, function(v,k) {
                    if( spec.columns[key].columns[k] && spec.columns[key].columns[k].password ) {
                        result.supported[key][k] = "********";
                    } else {
                        result.supported[key][k] = v;
                    }
                });

            } else {
                if( spec.columns[key].password ) {
                    result.supported[key] = "********";
                } else {
                    result.supported[key] = item;
                }
            }
        } else {
            result.unsupported[key] = item;
        }
    });
    return result;
};
