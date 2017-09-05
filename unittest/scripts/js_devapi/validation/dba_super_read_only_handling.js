//@ Initialization
||

//@<OUT> Configures the instance, answers 'yes' on the read only prompt
The MySQL instance at 'localhost:<<<__mysql_sandbox_port1>>>' currently has the super_read_only
system variable set to protect it from inadvertent updates from applications.
You must first unset it to be able to perform any changes to this instance.
For more information see: https://dev.mysql.com/doc/refman/en/server-system-variables.html#sysvar_super_read_only.

Note: there are open sessions to 'localhost:<<<__mysql_sandbox_port1>>>'.
You may want to kill these sessions to prevent them from performing unexpected updates:

2 open session(s) of 'root@localhost'.

Do you want to disable super_read_only and continue? [y|N]:
Validating instance...

The instance 'localhost:<<<__mysql_sandbox_port1>>>' is valid for Cluster usage
You can now use it in an InnoDB Cluster.

//@<OUT> Configures the instance, read only set, no prompt
The instance 'localhost:<<<__mysql_sandbox_port2>>>' is valid for Cluster usage
You can now use it in an InnoDB Cluster.

//@<OUT> Configures the instance, no prompt
The instance 'localhost:<<<__mysql_sandbox_port3>>>' is valid for Cluster usage
You can now use it in an InnoDB Cluster.

//@<OUT> Creates Cluster succeeds, answers 'yes' on read only prompt
A new InnoDB cluster will be created on instance 'mysql://root@localhost:<<<__mysql_sandbox_port1>>>'.

The MySQL instance at 'localhost:<<<__mysql_sandbox_port1>>>' currently has the super_read_only
system variable set to protect it from inadvertent updates from applications.
You must first unset it to be able to perform any changes to this instance.
For more information see: https://dev.mysql.com/doc/refman/en/server-system-variables.html#sysvar_super_read_only.

Note: there are open sessions to 'localhost:<<<__mysql_sandbox_port1>>>'.
You may want to kill these sessions to prevent them from performing unexpected updates:

4 open session(s) of 'root@localhost'.

Do you want to disable super_read_only and continue? [y|N]:
Creating InnoDB cluster 'sample' on 'mysql://root@localhost:<<<__mysql_sandbox_port1>>>'...
Adding Seed Instance...

Cluster successfully created. Use Cluster.addInstance() to add MySQL instances.
At least 3 instances are needed for the cluster to be able to withstand up to
one server failure.

//@<OUT> Adds a read only instance
A new instance will be added to the InnoDB cluster. Depending on the amount of
data on the cluster this might take from a few seconds to several hours.

Adding instance to the cluster ...

The instance 'root@localhost:<<<__mysql_sandbox_port2>>>' was successfully added to the cluster.

//@<OUT> Adds other instance
A new instance will be added to the InnoDB cluster. Depending on the amount of
data on the cluster this might take from a few seconds to several hours.

Adding instance to the cluster ...

The instance 'root@localhost:<<<__mysql_sandbox_port3>>>' was successfully added to the cluster.

//@<OUT> Rejoins an instance
Rejoining the instance to the InnoDB cluster. Depending on the original
problem that made the instance unavailable, the rejoin operation might not be
successful and further manual steps will be needed to fix the underlying
problem.

Please monitor the output of the rejoin operation and take necessary action if
the instance cannot rejoin.

Rejoining instance to the cluster ...

The instance 'root@localhost:<<<__mysql_sandbox_port3>>>' was successfully rejoined on the cluster.

The instance 'localhost:<<<__mysql_sandbox_port3>>>' was successfully added to the MySQL Cluster.

//@<OUT> Kill sandbox 2
Killing MySQL instance...

Instance localhost:<<<__mysql_sandbox_port2>>> successfully killed.

//@<OUT> Kill sandbox 3
Killing MySQL instance...

Instance localhost:<<<__mysql_sandbox_port3>>> successfully killed.

//@<OUT> Kill sandbox 1
Killing MySQL instance...

Instance localhost:<<<__mysql_sandbox_port1>>> successfully killed.

//@<OUT> Start sandbox 1
Starting MySQL instance...

Instance localhost:<<<__mysql_sandbox_port1>>> successfully started.

//@<OUT> Start sandbox 2
Starting MySQL instance...

Instance localhost:<<<__mysql_sandbox_port2>>> successfully started.

//@<OUT> Start sandbox 3
Starting MySQL instance...

Instance localhost:<<<__mysql_sandbox_port3>>> successfully started.

//@<OUT> Reboot the cluster
Reconfiguring the cluster 'sample' from complete outage...

The instance 'localhost:<<<__mysql_sandbox_port2>>>' was part of the cluster configuration.
Would you like to rejoin it to the cluster? [y|N]:
The instance 'localhost:<<<__mysql_sandbox_port3>>>' was part of the cluster configuration.
Would you like to rejoin it to the cluster? [y|N]:
The MySQL instance at 'localhost:<<<__mysql_sandbox_port1>>>' currently has the super_read_only
system variable set to protect it from inadvertent updates from applications.
You must first unset it to be able to perform any changes to this instance.
For more information see: https://dev.mysql.com/doc/refman/en/server-system-variables.html#sysvar_super_read_only.

Note: there are open sessions to 'localhost:<<<__mysql_sandbox_port1>>>'.
You may want to kill these sessions to prevent them from performing unexpected updates:

1 open session(s) of 'root@localhost'.

Do you want to disable super_read_only and continue? [y|N]:

The cluster was successfully rebooted.