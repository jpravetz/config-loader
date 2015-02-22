/*************************************************************************
 * Copyright(c) 2012-2015 Jim Pravetz <jpravetz@epdoc.com>
 * May be freely distributed under the MIT license.
 **************************************************************************/

var log = require('logger').get('config.validate');
var _u = require('underscore');

// Set to true to sort output
var SORT = true;

/**
 * Pretty print the config information that is contained in a config.def.js.
 * @param format Output format, either 'html' or 'json'
 * @param file The path to where the file should be written
 * @param def Th epath to where the config def file is
 * @param config Actual config information, which is used to populate one of the columns
 * @param log If provided, used for logging
 * @param callback Called when done with ( err )
 */
module.exports = function( format, ofile, def, config, log, callback ) {

    var spec = require(def);
    log && log.action('config.output').logObj({format: format, file: ofile}).info();

    var s = "";

    if( format === 'html' && typeof ofile === 'string' ) {

        var configNotFound = [];

        if( config ) {
            _u.each(config, function( value, key ) {
                if( !spec.columns[key] && !key.match(/^x\-/) ) {
                    configNotFound.push(key);
                }
            });
            configNotFound = _u.sortBy(configNotFound, function( key ) {
                return key;
            });
        }

        // Output

        s = html.getHeader();
        s += '<div class="datagrid"><table>';
        s += "<thead><tr><th>Name</th><th>Type</th><th>Description</th><th>Categories</th>";
        if( config ) {
            s += "<th>Values</th>";
        }
        s += "</tr></thead>";
        var keys = Object.keys(spec.columns);
        if( SORT ) {
            keys = _u.sortBy(keys, function( key ) {
                return key;
            });
        }
        _u.each(keys, function( name ) {
            var item = spec.columns[name];
            s += "<tr><td>" + name + "</td><td>" + html.getType(item) + "</td>" +
            "<td>" + html.getDescription(item) + "</td>" +
            "<td>" + html.getCategories(item) + "</td>";
            if( config ) {
                s += "<td>" + html.getValue(config[name], item.columns) + "</td>";
            }
            s += "</tr>\n";
        });

        _u.each(configNotFound, function( name ) {
            var item = spec.columns[name];
            s += "<tr><td>" + name + "</td><td></td>" +
            "<td>Not found in config definition file</td>" +
            "<td></td>";
            s += "<td>" + html.getValue(config[name]) + "</td>";
            s += "</tr>\n";
        });

        s += "</table></div>";
        s += html.getFooter();

    } else if( format === 'csv' ) {

        _u.each(spec.columns, function( item, name ) {
            var str = item.description;
            if( item.columns ) {
                var desc = [];
                _u.each(item.columns, function( item, name ) {
                    var s = name;
                    if( item.bRequired ) {
                        s += ' (required)';
                    }
                    if( item.description ) {
                        s += ': ' + item.description;
                    }
                    desc.push(s);
                });
                str += ' Parameters: ' + desc.join(', ') + '.';
            }
            console.log('"' + name + '","' + ( item.bRequired ? 'true' : 'false' ) + '","' + str + '"');
        });
    } else {
        s = JSON.stringify(spec, null, '  ');
    }

    if( ofile ) {
        var fs = require('fs');
        fs.writeFile(ofile, s, {encoding: 'utf8'}, function( err ) {
            if( err ) {
                log && log.action('config.write.error').error(err.toString);
            }
            callback(err);
        });
    } else {
        console.log(s);
        callback();
    }

};

var html = {
    getDescription: function( item ) {
        var s = item.bRequired ? "(Required) " : "(Optional) ";
        s += item.description;
        if( item.columns ) {
            s += "<br/><b>Object Properties:</b><ul>";
            _u.each(item.columns, function( item, name ) {
                s += "<li><b>" + name + "</b>";
                s += item.bRequired ? " (Required) " : " (Optional) ";
                if( item.description ) {
                    s += item.description;
                }
                s += getDefault(item.default);
                s += "</li>"
            });
            s += "</ul>";
        } else {
            s += getDefault(item.default);
        }
        return s;

        function getDefault( v ) {
            if( v !== undefined ) {
                s = " Default value: ";
                if( typeof v === 'string' ) {
                    return s + "'" + v + "'";
                } else if( v instanceof Array ) {
                    return s + JSON.stringify(v);
                } else {
                    return s + String(v);
                }
            } else {
                return "";
            }
        }
    },

    getType: function( item ) {
        if( item.columns ) {
            return 'Object';
        } else if( item.rules && ( item.type === 'boolean' || item.rules.type === 'boolean' ) ) {
            return 'Boolean';
        } else if( item.rules && item.rules.validators instanceof Array && item.rules.validators[0] === 'isInt' ) {
            return 'Integer';
        } else if( item.array ) {
            return 'Array';
        } else {
            return 'String';
        }
    },

    getCategories: function( item ) {
        if( item.categories ) {
            return item.categories.join(',<br/>');
        } else {
            return "";
        }
    },

    getValue: function( value, spec ) {
        var s = "<pre>";
        if( typeof value === 'object' ) {
            var newValue = {};
            if( value instanceof Array ) {
                newValue = value;
            } else {
                _u.each(value, function( v, k ) {
                    if( spec && spec[k] && spec[k].password || spec === undefined && k === 'password' ) {
                        newValue[k] = "********";
                    } else {
                        newValue[k] = v;
                    }
                });
            }
            s += JSON.stringify(newValue, null, '  ');
        } else {
            if( spec && spec.password ) {
                s += "********";
            } else {
                s += value;
            }
        }
        s += "</pre>";
        return s;
    },

    getCss: function() {
        var s = "" +
            "h1 { font: bold 18px/200% Arial, Helvetica, sans-serif; }" +
            "h2 { font: bold 14px/200% Arial, Helvetica, sans-serif; }" +
            ".notes ul { font: normal 12px/200% Arial, Helvetica, sans-serif; }" +
            "p { font: normal 12px/150% Arial, Helvetica, sans-serif; }" +
            ".datagrid table { border-collapse: collapse; text-align: left; width: 100%; } " +
            ".datagrid {font: normal 12px/150% Arial, Helvetica, sans-serif; background: #fff; overflow: hidden; border: 1px solid #006699; -webkit-border-radius: 3px; -moz-border-radius: 3px; border-radius: 3px; }" +
            ".datagrid table td, .datagrid table th { padding: 3px 10px; }" +
            ".datagrid table thead th {background-color:gold; font-size: 15px; font-weight: bold; border-left: 1px solid #0070A8; border-bottom: 1px solid #0070A8; } " +
            ".datagrid table thead th:first-child { border: none; border-bottom: 1px solid #0070A8; }" +
            ".datagrid table tbody td { color: #00496B; border-left: 1px solid #E1EEF4; border-bottom: 1px solid #E1EEF4;font-size: 12px;font-weight: normal; }" +
            ".datagrid table tbody tr:last-child td { border-bottom: none; }";
        s += ".datagrid table ul { margin-top: 0px; margin-bottom: 0px; }";

        return s;
    },

    getHeader: function() {
        var title = "jdp378 - Admin Console Configuration Specification";
        var s = "<html><head><title>" + title + "</title>" +
            '<style type="text/css">' + this.getCss() +
            "</style>" +
            "</head><body><h1>" + title + "</h1>";
        s += "<p>Generated: " + (new Date()).toString() + "</p>";
        return s;
    },

    NOTES: ["Category <i>whitelabel</i> indicates a property that does not have a default value or which is intended soley for the purpose of white-labelling.",
        "Category <i>topology</i> indicates a property that depends on the system architecture (addresses, URLs)",
        "Category <i>secret</i> indicates a property that may contain confidential information that should not be shared.",
        "Default values are defaults in code if not overridden by any config file.",
        "All times are in milliseconds."
    ],

    getFooter: function() {
        var s = '<div class="notes"><h2>Notes</h2><ul>';
        _u.each(this.NOTES, function( note ) {
            s += "<li>" + note + "</li>";
        });
        s += "</ul></div>";
        s += "</body></html>";
        return s;
    }

};
