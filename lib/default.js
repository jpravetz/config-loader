/*************************************************************************
 * ARMOR5 CONFIDENTIAL
 * Copyright 2013 Armor5, Inc. All Rights Reserved.
 *
 * NOTICE:  All information contained herein is, and remains the property
 * of Armor5, Inc. and its suppliers, if any. The intellectual and
 * technical concepts contained herein are proprietary to Armor5, Inc.
 * and its suppliers and may be covered by U.S. and Foreign Patents,
 * patents in process, and are protected by trade secret or copyright law.
 * Dissemination of this information or reproduction of this material is
 * strictly forbidden unless prior written permission is obtained from
 * Armor5, Inc..
 **************************************************************************/

var _u = require('underscore');

/**
 * Return the default value or an object from config.def that contains the default values for the specified config property.
 * These defaults are applied only in special instances within geneva, though we can consider applying the values more broadly.
 * Any values reported here would be overridden by defaults set in project.settings.json.
 * @param prop Name of the top level property in config.def.js
 * @returns If the property is an object then returns an object, otherwise returns the default value.
 */

module.exports = function(def,prop) {

    var columns = require(def).columns;
    if( prop ) {
        if( columns[prop] ) {
            if( columns[prop].default !== undefined ) {
                return columns[prop].default;
            } else if( columns[prop].columns ) {
                var obj = {};
                _u.each( columns[prop].columns, function(column,key) {
                    if( column.default !== undefined ) {
                        obj[key] = column.default;
                    }
                });
                return obj;
            }
        }
    }

};