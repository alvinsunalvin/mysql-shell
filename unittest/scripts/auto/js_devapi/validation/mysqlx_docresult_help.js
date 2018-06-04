//@ Initialization
||

//@<OUT> DocResult help
NAME
      DocResult - Allows traversing the DbDoc objects returned by a
                  Collection.find operation.

DESCRIPTION
      Allows traversing the DbDoc objects returned by a Collection.find
      operation.

PROPERTIES
      executionTime
            Same as getExecutionTime

      warningCount
            Same as getWarningCount

      warnings
            Same as getWarnings

FUNCTIONS
      fetchAll()
            Returns a list of DbDoc objects which contains an element for every
            unread document.

      fetchOne()
            Retrieves the next DbDoc on the DocResult.

      getExecutionTime()
            Retrieves a string value indicating the execution time of the
            executed operation.

      getWarningCount()
            The number of warnings produced by the last statement execution.
            See getWarnings() for more details.

      getWarnings()
            Retrieves the warnings generated by the executed operation.

      help()
            Provides help about this class and it's members

//@<OUT> Help on executionTime
NAME
      executionTime - Same as getExecutionTime

SYNTAX
      <DocResult>.executionTime

//@<OUT> Help on warningCount
NAME
      warningCount - Same as getWarningCount

SYNTAX
      <DocResult>.warningCount

//@<OUT> Help on warnings
NAME
      warnings - Same as getWarnings

SYNTAX
      <DocResult>.warnings

//@<OUT> Help on fetchAll
NAME
      fetchAll - Returns a list of DbDoc objects which contains an element for
                 every unread document.

SYNTAX
      <DocResult>.fetchAll()

RETURNS
       A List of DbDoc objects.

DESCRIPTION
      If this function is called right after executing a query, it will return
      a DbDoc for every document on the resultset.

      If fetchOne is called before this function, when this function is called
      it will return a DbDoc for each of the remaining documents on the
      resultset.

//@<OUT> Help on fetchOne
NAME
      fetchOne - Retrieves the next DbDoc on the DocResult.

SYNTAX
      <DocResult>.fetchOne()

RETURNS
       A DbDoc object representing the next Document in the result.

//@<OUT> Help on getExecutionTime
NAME
      getExecutionTime - Retrieves a string value indicating the execution time
                         of the executed operation.

SYNTAX
      <DocResult>.getExecutionTime()

//@<OUT> Help on getWarningCount
NAME
      getWarningCount - The number of warnings produced by the last statement
                        execution. See getWarnings() for more details.

SYNTAX
      <DocResult>.getWarningCount()

RETURNS
       the number of warnings.

DESCRIPTION
      This is the same value than C API mysql_warning_count, see
      https://dev.mysql.com/doc/refman/5.7/en/mysql-warning-count.html

//@<OUT> Help on getWarnings
NAME
      getWarnings - Retrieves the warnings generated by the executed operation.

SYNTAX
      <DocResult>.getWarnings()

RETURNS
       A list containing a warning object for each generated warning.

DESCRIPTION
      This is the same value than C API mysql_warning_count, see
      https://dev.mysql.com/doc/refman/5.7/en/mysql-warning-count.html

      Each warning object contains a key/value pair describing the information
      related to a specific warning.

      This information includes: Level, Code and Message.

//@<OUT> Help on help
NAME
      help - Provides help about this class and it's members

SYNTAX
      <DocResult>.help()

//@ Finalization
||