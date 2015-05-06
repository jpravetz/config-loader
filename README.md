# epdoc-config #

Config loader and validator.

The epdoc-config library provides a mechanism to load environment-specific config settings
that are merged from a list of json config files that you specify.
JSON config files are loaded in order, with the later files
overwriting earlier settings. JSON config files may contain a ```configExt``` (config extension)
to reference another config file to load.
Config files added in this manner are loaded, in the order they are encountered, after all previous
config files are loaded. This allows a config file to specify a chain of config files to be loaded.

Within each config file, the loader will first load config settings
from the object named ```defaults```, and will then load settings from the object specified
by the first parameter of the ```init``` method (usually this is ENV _development_ or _production_).
The end result is a single config object that is merged from the various sources.

## JSON Config File Syntax ##

Example config JSON file:

```json
{
	"production": {
		"dbName": "test",
		"db:org": {
 			"driver": "mysql",
 			"host": "10.179.6.27"
 		}
	},
	"development": {
		"dbName": "dev.db"
	},
	"defaults": {
		"dbName": "test",
		"logFile": "${HOME}/log/${DATE}_${PID}_console.log"
	}
}
```

## How to use this module in your application ##

Install the node package.

```
npm install epdoc-config
```

Initialize once on launch.

```javascript
var Config = require('epdoc-config');
var moment = require('moment');
var env = 'development';
var files = ['path/to/project.settings.json'];
var opts = {
    replace: {
        home: "/User/bob",
        app: "/User/bob/dev/myproject",
        date: moment(logger.getStartTime()).format('YYYYMMDD_HHmmss'),
        pid: process.pid
    }
};

// Read the config files and replace instances of '${HOME}', etc with the values in opts.replace 
Config.init(env,files,opts);
// Now get the constructed config object
var config = Config.get();
```


Once initialized, access the config file from elsewhere in your code:

```javascript
var config = require('epdoc-config').get();
```

## API ##

### init ###

Initialize and return config settings, reading from a list of config files, with the last
file in the list overwriting previous files.
If ```configExt``` is found to be set to a string or arrays of strings in any of the loaded config files,
then the array of all _extended config_ files will be loaded once the initial list of config files is loaded.

#### Parameters ####

* __env__ Environment ```NODE_ENV```, usually one of ```development```, ```production```, ```staging```, ```test```.
* __configFileList__ List of config files to load
* __options__ An object with the following properties:
** __replace__ An object with key, value pairs where ${KEY} is to be replaced with value in all config strings. key is made uppercase.
** __flat__ Support loading flat files that do not have 'defaults' and 'env' subsections. If the file does not contain
a section named 'defaults', a section named for the specified environment, or a top level entry```"_type": "tree"```, 
then the file is loaded as a flat file.
To ensure that files that are _not_ flat get loaded properly, please always ensure that they contain a 'defaults' section
or that the top level object contains the property ```"_type": "tree"```.


#### Returns #####

The Config object.

Example:

```javascript
var Config = require('epdoc-config').init('staging',['path/to/project.settings.json']);
```

### get ###

Return the resultant config settings. Must call init() before calling this method.

#### Returns #####

The resultant config settings, resolved by loading from the list of config files.

Example:

```javascript
var config = Config.get();
```

### extend ###

Copy all of the properties in the source objects over to the config object, and return the config object. 
It's in-order, so the source will override properties of the same name in previous config.

#### Returns #####

The resultant config settings.

Example:

```javascript
var config = Config.extend({url:"http://my/path"});
```
