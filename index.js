/*************************************************************************
 * ARMOR5 CONFIDENTIAL
 * Copyright 2012 Armor5 Inc. All Rights Reserved.
 *
 * NOTICE:  All information contained herein is, and remains the property
 * of Armor5 Inc. and its suppliers, if any.  The intellectual and
 * technical concepts contained herein are proprietary to Armor5 Inc.
 * and its suppliers and may be covered by U.S. and Foreign Patents,
 * patents in process, and are protected by trade secret or copyright law.
 * Dissemination of this information or reproduction of this material is
 * strictly forbidden unless prior written permission is obtained from
 * Armor5 Inc..
 **************************************************************************/

'use strict';

var Path = require('path');

// List of config files that is loaded by default
var CONFIG_FILES = [ './data/global.settings.json' ];

/**
 *
 * Our static global variable, will contain the properties:
 *      env - The environment variable that was used to initialize the config settings
 *      config - The config object. Access this object using Config.get();
 */

var props = {};

/**
 * Initialize and return config settings, reading from a list of config files, with the last file in the list
 * overwriting previous files. Loads the default global.settings.json config file first.
 * @param nodeEnv Environment NODE_ENV, usually one of development, production, staging, test.
 * @param configFileList List of config files to load. Paths should be absolute.
 * @param options See README
 * @returns The resultant config settings, resolved by loading from the list of config files.
 */
var init = function (nodeEnv, configFileList, options) {

    props.env = nodeEnv;
    props.config = {};
    props.files = [];

    if (!options || options.excludeGlobals !== true) {
        for (var cdx = 0; cdx < CONFIG_FILES.length; ++cdx) {
            var file = Path.resolve(__dirname, CONFIG_FILES[cdx]);
            _add(file, options);
        }
    }
    if (configFileList) {
        for (var cdx = 0; cdx < configFileList.length; ++cdx) {
            _add(configFileList[cdx], options);
        }
    }

    // Do some self-reflection and see if the config file has specified any other config files
    // to be loaded, then load these in the end. Can be used for white-labeling.
//    if ( options && options.appDir && props.config.configFileList instanceof Array) {
//        for (var cdx = 0; cdx < props.config.configFileList.length; ++cdx) {
//            _add(options.appDir + "/" + props.config.configFileList[cdx]);
//        }
//    }

    return {
        getDb: getDb,
        env: env,
        get: get,
        files: files
    };
};

/**
 * Return the resultant config settings. Must call init() before calling this method.
 * @returns The resultant config settings, resolved by loading from the list of config files.
 */
function get() {
    _throwIfNotInitialized();
    return props.config;
};

/**
 * @returns The env value that was used to initialze the data
 */
function env() {
    _throwIfNotInitialized();
    return props.env;
};

/**
 * Helper to return the settings for a particular database. Database settings
 * must be stored with the key 'db:mydbname'.
 * @param name Name of the database settings to return
 * @returns
 */
function getDb(name) {
    _throwIfNotInitialized();
    return props.config && props.config['db:' + name] ? props.config['db:' + name] : undefined;
}

/**
 * Return a list of all the files that were loaded, in order, when building the config object
 * @returns The list of config files.
 */
function files() {
    _throwIfNotInitialized();
    return props.files;
};


function _throwIfNotInitialized() {
    if (!props.config)
        throw new Error('config-loader has not been initialized');
}

/**
 * Private function to read a config file and merge it into the accumulated
 * config object.
 * @param filename
 */
function _add(filename, options) {
    try {
        var config = require(filename);
        _merge(config['defaults'], filename, options);
        _merge(config[props.env], filename, options);
        var fileObj = {
            description: ( config[props.env] && config[props.env].description ) ? config[props.env].description :
                ( config['defaults'] ? config['defaults'].description : undefined ),
            path: filename
        };
        props.files.push(fileObj);
    } catch (e) {
        console.log("Error reading config file: %s", e);
        throw new Error(e);
    }
}

var configRegExp = /^\$CONFIG\$\/?(.*)$/;
var appRegExp = /^\$APP\$\/?(.*)$/;

/**
 *
 * @param obj
 * @param configFilename The absolute path of the config file from which we are merging properties
 * @private
 */
function _merge(obj, configFilename, options) {
    if (obj) {
        for (var prop in obj) {
            if (options && typeof obj[prop] === 'string') {
                if (options.resolveConfigPath && configFilename) {
                    var p = obj[prop].match(configRegExp);
                    if (p) {
                        props.config[prop] = Path.resolve(Path.dirname(configFilename), p[1]);
                    } else {
                        props.config[prop] = resolveAppPath(obj[prop]);
                    }
                } else {
                    props.config[prop] = resolveAppPath(obj[prop]);
                }
            } else {
                props.config[prop] = obj[prop];
            }
        }
    }

    function resolveAppPath(value) {
        if (options.resolveAppPath && options.appDir) {
            var p = value.match(appRegExp);
            if (p) {
                return Path.resolve(Path.dirname(options.appDir), p[1]);
            } else {
                return value;
            }
        } else {
            return value;
        }
    }
};


module.exports.init = init;
module.exports.get = get;
module.exports.getDb = getDb;
module.exports.env = env;
module.exports.files = files;
