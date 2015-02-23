# epdoc-config #

Config loader and validator.

The epdoc-config library provides a mechanism to load environment-specific config settings
that are merged from a list of json files that you specify. Files are loaded in order, with the later files
overwriting earlier settings.

Within each config file, the loader will first load config settings
from the sub-object named _default_, and will then load settings from the sub-object specified
by the first parameter of the init method.
The end result is a single config object that is merged from the various sources.

Typical use for config-loader is to load the default global settings file (global.settings.json) that is contained
within this project. As we evolve our deployment strategy this may change, and your source for config files
may change. But for now, you can include config-loader in your project and also pick up a set of global settings.

The global settings file contains database information for production and staging environments as well
as some additional information. You would typically define development and test settings in a project-specific config file.

You can suprress loading of the global setings file by setting the bExcludeGlobals option in the init method.

## JSON Config File Syntax ##

Example config JSON file:

```json
{
	"production": {
		"logDbName": "test",
		"db:org": {
 			"driver": "mysql",
 			"host": "10.179.6.27"
 		}
	},
	"development": {
		"logDbName": "sample.json"
	},
	"defaults": {
		"logDbName": "test"
	}
}
```

All config files must have top level sections within which the settings are stored.
The top level section named ```default``` is reserved for default settings.
You specify which section to load settings from using the first parameter of the init method.


## How to use this module in your application ##

This section contains instructions on how to use this module in your project.

Initialize once in your top level javascript file, including the global config file:

```javascript
var Config = require('config-loader').init('staging',['path/to/project.settings.json']);
var config = Config.get();
```

Excluding the global config file:

```javascript
var Config = require('config-loader').init('deploy1',['path/to/project.settings.json'],{bExcludeGlobals:true});
var config = Config.get();
```

Access the config file from other files:

```javascript
var data = require('config-loader').get();
```

## Initialize config-loader ##

### Once per application ###

You may want to create an appinit.js module for your application. You can then include this in your main
application as well as test scripts. The line to add to this module is:

```javascript
var Config = require('config-loader').init( process.env.NODE_ENV, [__dirname + "/../config/project.settings.json"] );
```

## Or create a config wrapper ##

This is old information. Please just make sure you init your Config once, and dispense with the wrappers.

For convenience you can wrap config initialization in your own javascript file.
This avoids having to specify your _project.settings.json_ path in every app or test
file that refers to your project config settings.

In this example our project has a top level _config_ folder containing the
following _index.js_ file and a separate _project.settings.json_ file with project-specific
config settings.

Example project-specific _config/index.js_ file:

```javascript
var Config;

module.exports.init = function(nodeEnv) {
	var env = nodeEnv ? nodeEnv : process.env.NODE_ENV;
	Config = require( 'config-loader' ).init( env, [ __dirname + '/project.settings.json'] );
	
	return {
		get: Config.get,
		getDb: Config.getDb,
		env: Config.env
	};
};

module.exports.get = function() {
	_throwIfNotInitialized();
	return Config.get();
};

module.exports.getDb = function(name) {
	_throwIfNotInitialized();
	return Config.getDb(name);
};

module.exports.env = function() {
	_throwIfNotInitialized();
	return Config.env();
};

function _throwIfNotInitialized() {
	if( !Config )
		throw new Error('Config has not been initialized');
}
```

To use this file from your main application file where you are intializing the config:

```javascript
var Config = require('./config').init('staging');
var dbSettings = Config.getDb('org');
```

Or from another file:

```javascript
var Config = require('./config');
var dbSettings = Config.getDb('org');
```
Refer to project _dashboard/geneva/config_ for a working example.

## API ##

### init ###

Initialize and return config settings, reading from a list of config files, with the last
file in the list overwriting previous files. Loads the default _global.settings.json_
config file first. If, after loading the specified config files, config-loader discovers
there is a configFileList parameter in the resulting config object, then config-loader will
also load this file. In this situation __options.appDir__ must also be specified.

#### Parameters ####

* __env__ Environment ```NODE_ENV```, usually one of ```development```, ```production```, ```staging```, ```test```.
* __configFileList__ List of config files to load
* __options__ An object with the following properties:
** __excludeGlobals__ If true then the global config file is not loaded (default false)
** __replace__ An object with key, value pairs where ${KEY} is to be replaced with value in all config strings. key is made uppercase.
** __resolveConfigPath__ If true then resolve the value as a path, replacing any first-level property values that begin with ${CONFIG} with the path to the config file itself

When using __resolveAppPath__, __resolveHomePath__ or __resolveConfigPath__ the config loader will replace any _first-level_ property values
containing ${APP} or ${CONFIG} with the corresponding value. For example

```javascript
{
    default: {
        "altLocales": "${CONFIG}/../locales",
        "altPublic": "${CONFIG}../public",
        "logHome": "${APP}/log",
    }
}
```

Will resolve to

```javascript
{
    default: {
        "altLocales": "/path/to/config/file/../locales",
        "altPublic": "/path/to/config/file/../public",
        "logHome": "/path/to/app.js/log",
    }
}
```

Note that the forward slash following __${CONFIG}__ or __${APP}__ is optional and is removed before resolving the path.

#### Returns #####

The Config object.

Example:

```javascript
var Config = require('config-loader').init('staging',['path/to/project.settings.json']);
```

### get ###

Return the resultant config settings. Must call init() before calling this method.

#### Returns #####

The resultant config settings, resolved by loading from the list of config files.

Example:

```javascript
var config = Config.get();
```

