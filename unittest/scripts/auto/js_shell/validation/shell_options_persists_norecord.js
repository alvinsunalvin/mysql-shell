//@ shell classic connection
|ClassicSession:<<<__mysql_uri>>>|

//@ autocomplete.nameCache update and set back to default using shell.options
|false|
|false|
|"autocomplete.nameCache": "false"|
||
|true|
//|"autocomplete.nameCache": "false"|

//@ batchContinueOnError update and set back to default using shell.options
||This option is read only
|false|
||Option batchContinueOnError not present in file
|false|

//@ devapi.dbObjectHandles update and set back to default using shell.options
|false|
|false|
|"devapi.dbObjectHandles": "false"|
||
|true|

//@ history.autoSave update and set back to default using shell.options
|true|
|true|
|"history.autoSave": "true"|
||
|false|

//@ history.maxSize update and set back to default using shell.options
|10|
|10|
|"history.maxSize": "10"|
||
|1000|

//@ history.sql.ignorePattern update and set back to default using shell.options
|*PATTERN*|
|*PATTERN*|
|"history.sql.ignorePattern": "*PATTERN*"|
||
|*IDENTIFIED*:*PASSWORD*|

//@ interactive update and set back to default using shell.options
||This option is read only
|true|
||Option interactive not present in file
|true|

//@ logLevel update and set back to default using shell.options
|8|
|8|
|"logLevel": "8"|
||
|5|

//@ outputFormat update and set back to default using shell.options
|{"value":"json/raw"}|
|{"value":"json/raw"}|
|\"outputFormat\": \"json/raw\"|
||
|table|

//@ passwordsFromStdin update and set back to default using shell.options
|true|
|true|
|"passwordsFromStdin": "true"|
||
|false|

//@ sandboxDir update and set back to default using shell.options
|\sandboxDir|
|\sandboxDir|
|"sandboxDir": "\\sandboxDir"|
||
|mysql-sandboxes|

//@ showWarnings update and set back to default using shell.options
|false|
|false|
|"showWarnings": "false"|
||
|true|

//@ useWizards update and set back to default using shell.options
|false|
|false|
|"useWizards": "false"|
||
|true|

//@ defaultMode update and set back to default using shell.options
|py|
|py|
|"defaultMode": "py"|
||
|none|

//@ autocomplete.nameCache update and set back to default using \option
||
|false|
|"autocomplete.nameCache": "false"|
||
|true|
//|"autocomplete.nameCache": "false"|

//@ batchContinueOnError update and set back to default using \option
||This option is read only
|false|
||Option batchContinueOnError not present in file
|false|

//@ devapi.dbObjectHandles update and set back to default using \option
||
|false|
|"devapi.dbObjectHandles": "false"|
||
|true|

//@ history.autoSave update and set back to default using \option
||
|true|
||
|false|

//@ history.maxSize update and set back to default using \option
||
|10|
||
|1000|

//@ history.sql.ignorePattern update and set back to default using \option
||
|*PATTERN*|
||
|*IDENTIFIED*:*PASSWORD*|

//@ interactive update and set back to default using \option
||This option is read only
|true|
||Option interactive not present in file
|true|

//@ logLevel update and set back to default using \option
||
|8|
||
|5|

//@ outputFormat update and set back to default using \option
||
|{"info":"json/raw"}|
||
|table|

//@ passwordsFromStdin update and set back to default using \option
||
|true|
||
|false|

//@ sandboxDir update and set back to default using \option
||
|\sandboxDir|
|"sandboxDir": "\\sandboxDir"|
||
|mysql-sandboxes|

//@ showWarnings update and set back to default using \option
||
|false|
|"showWarnings": "false"|
||
|true|

//@ useWizards update and set back to default using \option
||
|false|
|"useWizards": "false"|
||
|true|

//@ defaultMode update and set back to default using \option
||
|py|
|"defaultMode": "py"|
||
|none|

//@<OUT> List all the options using \option
 autocomplete.nameCache     true
 batchContinueOnError       false
 defaultMode                none
 devapi.dbObjectHandles     true
 history.autoSave           false
 history.maxSize            1000
 history.sql.ignorePattern  *IDENTIFIED*:*PASSWORD*
 interactive                true
 logLevel                   5
 outputFormat               table
 passwordsFromStdin         false
 sandboxDir                 <<<_defaultSandboxDir>>>
 showWarnings               true
 useWizards                 true
 
//@<OUT> List all the options using \option and show-origin
 autocomplete.nameCache     true (Compiled default)
 batchContinueOnError       false (Compiled default)
 defaultMode                none (Compiled default)
 devapi.dbObjectHandles     true (Compiled default)
 history.autoSave           false (Compiled default)
 history.maxSize            1000 (Compiled default)
 history.sql.ignorePattern  *IDENTIFIED*:*PASSWORD* (Compiled default)
 interactive                true (Compiled default)
 logLevel                   5 (Compiled default)
 outputFormat               table (Compiled default)
 passwordsFromStdin         false (Compiled default)
 sandboxDir                 <<<_defaultSandboxDir>>> (Compiled default)
 showWarnings               true (Compiled default)
 useWizards                 true (Compiled default)

//@ List an option which origin is Compiled default
|(Compiled default)|

//@ List an option which origin is User defined
|8|
|(User defined)|

//@ Verify error messages
||Valid values for shell mode are sql, js, py or none. (ArgumentError)
||Valid values for shell mode are sql, js, py or none.
||ReferenceError: InvalidOption is not defined
||Unrecognized option: InvalidOption.
||No help found for filter: InvalidOption
||No help found for filter: InvalidOption

//@ Configuration operation available in SQL mode
|Switching to SQL mode... Commands end with ;|
|8|
||The log level value must be an integer between 1 and 8 any of [none, internal, error, warning, info, debug, debug2, debug3].
|8|
||
|5|

//@<OUT> List all the options using \option for SQL mode
 autocomplete.nameCache     true
 batchContinueOnError       false
 defaultMode                none
 devapi.dbObjectHandles     true
 history.autoSave           false
 history.maxSize            1000
 history.sql.ignorePattern  *IDENTIFIED*:*PASSWORD*
 interactive                true
 logLevel                   5
 outputFormat               table
 passwordsFromStdin         false
 sandboxDir                 <<<_defaultSandboxDir>>>
 showWarnings               true
 useWizards                 true

//@<OUT> List all the options using \option and show-origin for SQL mode
 Switching to SQL mode... Commands end with ;
 autocomplete.nameCache     true (Compiled default)
 batchContinueOnError       false (Compiled default)
 defaultMode                none (Compiled default)
 devapi.dbObjectHandles     true (Compiled default)
 history.autoSave           false (Compiled default)
 history.maxSize            1000 (Compiled default)
 history.sql.ignorePattern  *IDENTIFIED*:*PASSWORD* (Compiled default)
 interactive                true (Compiled default)
 logLevel                   5 (Compiled default)
 outputFormat               table (Compiled default)
 passwordsFromStdin         false (Compiled default)
 sandboxDir                 <<<_defaultSandboxDir>>> (Compiled default)
 showWarnings               true (Compiled default)
 useWizards                 true (Compiled default)
 
