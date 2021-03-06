//@<OUT> Creates the sample cluster
A new InnoDB cluster will be created on instance 'localhost:<<<__mysql_sandbox_port1>>>'.

Validating instance configuration at localhost:<<<__mysql_sandbox_port1>>>...
NOTE: Instance detected as a sandbox.
Please note that sandbox instances are only suitable for deploying test clusters for use within the same host.

This instance reports its own address as <<<hostname>>>:<<<__mysql_sandbox_port1>>>

Instance configuration is suitable.
NOTE: Group Replication will communicate with other members using '<<<hostname>>>:<<<__mysql_sandbox_gr_port1>>>'. Use the localAddress option to override.

?{VER(<8.0.0)}
WARNING: Instance '<<<hostname>>>:<<<__mysql_sandbox_port1>>>' cannot persist Group Replication configuration since MySQL version <<<__version>>> does not support the SET PERSIST command (MySQL version >= 8.0.11 required). Please use the <Dba>.configureLocalInstance() command locally to persist the changes.
?{}
Creating InnoDB cluster 'sample' on '<<<hostname>>>:<<<__mysql_sandbox_port1>>>'...

Adding Seed Instance...
Cluster successfully created. Use Cluster.addInstance() to add MySQL instances.
At least 3 instances are needed for the cluster to be able to withstand up to
one server failure.

//@<OUT> upgradeMetadata, dryRrun upgrade required
InnoDB Cluster Metadata Upgrade

The cluster you are connected to is using an outdated metadata schema version 1.0.1 and needs to be upgraded to 2.0.0.

Without doing this upgrade, no AdminAPI calls except read only operations will be allowed.

NOTE: After the upgrade, this InnoDB Cluster/ReplicaSet can no longer be managed using older versions of MySQL Shell.

The grants for the MySQL Router accounts that were created automatically when bootstrapping need to be updated to match the new metadata version's requirements.
NOTE: No automatically created Router accounts were found.
WARNING: If MySQL Routers have been bootstrapped using custom accounts, the set of account privileges must be updated for them to match the following grants:

GRANT EXECUTE, SELECT ON mysql_innodb_cluster_metadata.* TO <user>@<host>
GRANT DELETE, INSERT, UPDATE ON mysql_innodb_cluster_metadata.routers TO <user>@<host>
GRANT DELETE, INSERT, UPDATE ON mysql_innodb_cluster_metadata.v2_routers TO <user>@<host>
GRANT SELECT ON performance_schema.global_variables TO <user>@<host>
GRANT SELECT ON performance_schema.replication_group_member_stats TO <user>@<host>
GRANT SELECT ON performance_schema.replication_group_members TO <user>@<host>

An upgrade of all cluster router instances is required. All router installations should be updated first before doing the actual metadata upgrade.

[[*]]
| Instance[[*]]| Version   | Last Check-in | R/O Port | R/W Port |
[[*]]
| <<<real_hostname>>>::[[*]]| <= 8.0.18 | NULL          | NULL     | NULL     |
[[*]]
There is 1 Router to be upgraded in order to perform the Metadata schema upgrade.

//@<OUT> Upgrades the metadata, no registered routers
InnoDB Cluster Metadata Upgrade

The cluster you are connected to is using an outdated metadata schema version 1.0.1 and needs to be upgraded to 2.0.0.

Without doing this upgrade, no AdminAPI calls except read only operations will be allowed.

NOTE: After the upgrade, this InnoDB Cluster/ReplicaSet can no longer be managed using older versions of MySQL Shell.

The grants for the MySQL Router accounts that were created automatically when bootstrapping need to be updated to match the new metadata version's requirements.
NOTE: No automatically created Router accounts were found.
WARNING: If MySQL Routers have been bootstrapped using custom accounts, the set of account privileges must be updated for them to match the following grants:

GRANT EXECUTE, SELECT ON mysql_innodb_cluster_metadata.* TO <user>@<host>
GRANT DELETE, INSERT, UPDATE ON mysql_innodb_cluster_metadata.routers TO <user>@<host>
GRANT DELETE, INSERT, UPDATE ON mysql_innodb_cluster_metadata.v2_routers TO <user>@<host>
GRANT SELECT ON performance_schema.global_variables TO <user>@<host>
GRANT SELECT ON performance_schema.replication_group_member_stats TO <user>@<host>
GRANT SELECT ON performance_schema.replication_group_members TO <user>@<host>

Upgrading metadata at '<<<hostname>>>:<<<__mysql_sandbox_port1>>>' from version 1.0.1 to version 2.0.0.
Creating backup of the metadata schema...
Step 1 of 1: upgrading from 1.0.1 to 2.0.0...
Removing metadata backup...
Upgrade process successfully finished, metadata schema is now on version 2.0.0

//@<OUT> Upgrades the metadata, up to date
NOTE: Installed metadata at '<<<hostname>>>:<<<__mysql_sandbox_port1>>>' is up to date (version 2.0.0).

//@<OUT> Upgrades the metadata from a slave instance
InnoDB Cluster Metadata Upgrade

The cluster you are connected to is using an outdated metadata schema version 1.0.1 and needs to be upgraded to 2.0.0.

Without doing this upgrade, no AdminAPI calls except read only operations will be allowed.

NOTE: After the upgrade, this InnoDB Cluster/ReplicaSet can no longer be managed using older versions of MySQL Shell.

The grants for the MySQL Router accounts that were created automatically when bootstrapping need to be updated to match the new metadata version's requirements.
NOTE: No automatically created Router accounts were found.
WARNING: If MySQL Routers have been bootstrapped using custom accounts, the set of account privileges must be updated for them to match the following grants:

GRANT EXECUTE, SELECT ON mysql_innodb_cluster_metadata.* TO <user>@<host>
GRANT DELETE, INSERT, UPDATE ON mysql_innodb_cluster_metadata.routers TO <user>@<host>
GRANT DELETE, INSERT, UPDATE ON mysql_innodb_cluster_metadata.v2_routers TO <user>@<host>
GRANT SELECT ON performance_schema.global_variables TO <user>@<host>
GRANT SELECT ON performance_schema.replication_group_member_stats TO <user>@<host>
GRANT SELECT ON performance_schema.replication_group_members TO <user>@<host>

Upgrading metadata at '<<<hostname>>>:<<<__mysql_sandbox_port1>>>' from version 1.0.1 to version 2.0.0.
Creating backup of the metadata schema...
Step 1 of 1: upgrading from 1.0.1 to 2.0.0...
Removing metadata backup...
Upgrade process successfully finished, metadata schema is now on version 2.0.0


//@<OUT> WL13386-TSFR1_5 Upgrades the metadata, upgrade done by unregistering 10 routers and no router accounts
InnoDB Cluster Metadata Upgrade

The cluster you are connected to is using an outdated metadata schema version 1.0.1 and needs to be upgraded to 2.0.0.

Without doing this upgrade, no AdminAPI calls except read only operations will be allowed.

NOTE: After the upgrade, this InnoDB Cluster/ReplicaSet can no longer be managed using older versions of MySQL Shell.

The grants for the MySQL Router accounts that were created automatically when bootstrapping need to be updated to match the new metadata version's requirements.
NOTE: No automatically created Router accounts were found.
WARNING: If MySQL Routers have been bootstrapped using custom accounts, the set of account privileges must be updated for them to match the following grants:

GRANT EXECUTE, SELECT ON mysql_innodb_cluster_metadata.* TO <user>@<host>
GRANT DELETE, INSERT, UPDATE ON mysql_innodb_cluster_metadata.routers TO <user>@<host>
GRANT DELETE, INSERT, UPDATE ON mysql_innodb_cluster_metadata.v2_routers TO <user>@<host>
GRANT SELECT ON performance_schema.global_variables TO <user>@<host>
GRANT SELECT ON performance_schema.replication_group_member_stats TO <user>@<host>
GRANT SELECT ON performance_schema.replication_group_members TO <user>@<host>

An upgrade of all cluster router instances is required. All router installations should be updated first before doing the actual metadata upgrade.

[[*]]
| Instance[[*]]| Version   | Last Check-in | R/O Port | R/W Port |
[[*]]
| <<<real_hostname>>>::[[*]]| <= 8.0.18 | NULL          | NULL     | NULL     |
| <<<real_hostname>>>::eighth[[*]]| <= 8.0.18 | NULL          | NULL     | NULL     |
| <<<real_hostname>>>::fifth[[*]]| <= 8.0.18 | NULL          | NULL     | NULL     |
| <<<real_hostname>>>::fourth[[*]]| <= 8.0.18 | NULL          | NULL     | NULL     |
| <<<real_hostname>>>::nineth[[*]]| <= 8.0.18 | NULL          | NULL     | NULL     |
| <<<real_hostname>>>::second[[*]]| <= 8.0.18 | NULL          | NULL     | NULL     |
| <<<real_hostname>>>::seventh[[*]]| <= 8.0.18 | NULL          | NULL     | NULL     |
| <<<real_hostname>>>::sixth[[*]]| <= 8.0.18 | NULL          | NULL     | NULL     |
| <<<real_hostname>>>::tenth[[*]]| <= 8.0.18 | NULL          | NULL     | NULL     |
| <<<real_hostname>>>::third[[*]]| <= 8.0.18 | NULL          | NULL     | NULL     |
[[*]]
There are 10 Routers to upgrade. Please upgrade them and select Continue when done.

  1) Re-check for outdated Routers and continue with the metadata upgrade.
  2) Unregister the remaining Routers.
  3) Abort the operation.
  4) Help

Please select an option: Unregistering a Router implies it will not be used in the Cluster, do you want to continue? [y/N]: Upgrading metadata at '<<<hostname>>>:<<<__mysql_sandbox_port1>>>' from version 1.0.1 to version 2.0.0.
Creating backup of the metadata schema...
Step 1 of 1: upgrading from 1.0.1 to 2.0.0...
Removing metadata backup...
Upgrade process successfully finished, metadata schema is now on version 2.0.0

//@<OUT> WL13386-TSFR1_5 Upgrades the metadata, upgrade done by unregistering more than 10 routers with router accounts
InnoDB Cluster Metadata Upgrade

The cluster you are connected to is using an outdated metadata schema version 1.0.1 and needs to be upgraded to 2.0.0.

Without doing this upgrade, no AdminAPI calls except read only operations will be allowed.

NOTE: After the upgrade, this InnoDB Cluster/ReplicaSet can no longer be managed using older versions of MySQL Shell.

The grants for the MySQL Router accounts that were created automatically when bootstrapping need to be updated to match the new metadata version's requirements.
Updating Router accounts...
NOTE: 2 Router accounts have been updated.
WARNING: If MySQL Routers have been bootstrapped using custom accounts, the set of account privileges must be updated for them to match the following grants:

GRANT EXECUTE, SELECT ON mysql_innodb_cluster_metadata.* TO <user>@<host>
GRANT DELETE, INSERT, UPDATE ON mysql_innodb_cluster_metadata.routers TO <user>@<host>
GRANT DELETE, INSERT, UPDATE ON mysql_innodb_cluster_metadata.v2_routers TO <user>@<host>
GRANT SELECT ON performance_schema.global_variables TO <user>@<host>
GRANT SELECT ON performance_schema.replication_group_member_stats TO <user>@<host>
GRANT SELECT ON performance_schema.replication_group_members TO <user>@<host>

An upgrade of all cluster router instances is required. All router installations should be updated first before doing the actual metadata upgrade.

[[*]]
| Instance[[*]]| Version   | Last Check-in | R/O Port | R/W Port |
[[*]]
| <<<real_hostname>>>::[[*]]| <= 8.0.18 | NULL          | NULL     | NULL     |
| <<<real_hostname>>>::eighth[[*]]| <= 8.0.18 | NULL          | NULL     | NULL     |
| <<<real_hostname>>>::eleventh[[*]]| <= 8.0.18 | NULL          | NULL     | NULL     |
| <<<real_hostname>>>::fifth[[*]]| <= 8.0.18 | NULL          | NULL     | NULL     |
| <<<real_hostname>>>::fourth[[*]]| <= 8.0.18 | NULL          | NULL     | NULL     |
| <<<real_hostname>>>::nineth[[*]]| <= 8.0.18 | NULL          | NULL     | NULL     |
| <<<real_hostname>>>::second[[*]]| <= 8.0.18 | NULL          | NULL     | NULL     |
| <<<real_hostname>>>::seventh[[*]]| <= 8.0.18 | NULL          | NULL     | NULL     |
| <<<real_hostname>>>::sixth[[*]]| <= 8.0.18 | NULL          | NULL     | NULL     |
| ...[[*]]| ...       | ...           | ...      | ...      |
[[*]]
There are 11 Routers to upgrade. Please upgrade them and select Continue when done.

  1) Re-check for outdated Routers and continue with the metadata upgrade.
  2) Unregister the remaining Routers.
  3) Abort the operation.
  4) Help

Please select an option: The metadata upgrade has been aborted.

//@<OUT> Second upgrade attempt should succeed
InnoDB Cluster Metadata Upgrade

The cluster you are connected to is using an outdated metadata schema version 1.0.1 and needs to be upgraded to 2.0.0.

Without doing this upgrade, no AdminAPI calls except read only operations will be allowed.

NOTE: After the upgrade, this InnoDB Cluster/ReplicaSet can no longer be managed using older versions of MySQL Shell.

The grants for the MySQL Router accounts that were created automatically when bootstrapping need to be updated to match the new metadata version's requirements.
Updating Router accounts...
NOTE: 2 Router accounts have been updated.
WARNING: If MySQL Routers have been bootstrapped using custom accounts, the set of account privileges must be updated for them to match the following grants:

GRANT EXECUTE, SELECT ON mysql_innodb_cluster_metadata.* TO <user>@<host>
GRANT DELETE, INSERT, UPDATE ON mysql_innodb_cluster_metadata.routers TO <user>@<host>
GRANT DELETE, INSERT, UPDATE ON mysql_innodb_cluster_metadata.v2_routers TO <user>@<host>
GRANT SELECT ON performance_schema.global_variables TO <user>@<host>
GRANT SELECT ON performance_schema.replication_group_member_stats TO <user>@<host>
GRANT SELECT ON performance_schema.replication_group_members TO <user>@<host>

An upgrade of all cluster router instances is required. All router installations should be updated first before doing the actual metadata upgrade.

[[*]]
| Instance[[*]]| Version   | Last Check-in | R/O Port | R/W Port |
[[*]]
| <<<real_hostname>>>::[[*]]| <= 8.0.18 | NULL          | NULL     | NULL     |
| <<<real_hostname>>>::eighth[[*]]| <= 8.0.18 | NULL          | NULL     | NULL     |
| <<<real_hostname>>>::eleventh[[*]]| <= 8.0.18 | NULL          | NULL     | NULL     |
| <<<real_hostname>>>::fifth[[*]]| <= 8.0.18 | NULL          | NULL     | NULL     |
| <<<real_hostname>>>::fourth[[*]]| <= 8.0.18 | NULL          | NULL     | NULL     |
| <<<real_hostname>>>::nineth[[*]]| <= 8.0.18 | NULL          | NULL     | NULL     |
| <<<real_hostname>>>::second[[*]]| <= 8.0.18 | NULL          | NULL     | NULL     |
| <<<real_hostname>>>::seventh[[*]]| <= 8.0.18 | NULL          | NULL     | NULL     |
| <<<real_hostname>>>::sixth[[*]]| <= 8.0.18 | NULL          | NULL     | NULL     |
| ...[[*]]| ...       | ...           | ...      | ...      |
[[*]]
There are 11 Routers to upgrade. Please upgrade them and select Continue when done.

  1) Re-check for outdated Routers and continue with the metadata upgrade.
  2) Unregister the remaining Routers.
  3) Abort the operation.
  4) Help

Please select an option: Unregistering a Router implies it will not be used in the Cluster, do you want to continue? [y/N]: Upgrading metadata at '<<<hostname>>>:<<<__mysql_sandbox_port1>>>' from version 1.0.1 to version 2.0.0.
Creating backup of the metadata schema...
Step 1 of 1: upgrading from 1.0.1 to 2.0.0...
Removing metadata backup...
Upgrade process successfully finished, metadata schema is now on version 2.0.0

//@<OUT> Test Migration from 1.0.1 to 2.0.0
InnoDB Cluster Metadata Upgrade

The cluster you are connected to is using an outdated metadata schema version 1.0.1 and needs to be upgraded to 2.0.0.

Without doing this upgrade, no AdminAPI calls except read only operations will be allowed.

NOTE: After the upgrade, this InnoDB Cluster/ReplicaSet can no longer be managed using older versions of MySQL Shell.

The grants for the MySQL Router accounts that were created automatically when bootstrapping need to be updated to match the new metadata version's requirements.
Updating Router accounts...
NOTE: 3 Router accounts have been updated.
WARNING: If MySQL Routers have been bootstrapped using custom accounts, the set of account privileges must be updated for them to match the following grants:

GRANT EXECUTE, SELECT ON mysql_innodb_cluster_metadata.* TO <user>@<host>
GRANT DELETE, INSERT, UPDATE ON mysql_innodb_cluster_metadata.routers TO <user>@<host>
GRANT DELETE, INSERT, UPDATE ON mysql_innodb_cluster_metadata.v2_routers TO <user>@<host>
GRANT SELECT ON performance_schema.global_variables TO <user>@<host>
GRANT SELECT ON performance_schema.replication_group_member_stats TO <user>@<host>
GRANT SELECT ON performance_schema.replication_group_members TO <user>@<host>

An upgrade of all cluster router instances is required. All router installations should be updated first before doing the actual metadata upgrade.

[[*]]
| Instance[[*]]| Version   | Last Check-in | R/O Port | R/W Port |
[[*]]
| <<<real_hostname>>>::[[*]]| <= 8.0.18 | NULL          | NULL     | NULL     |
[[*]]
There is 1 Router to upgrade. Please upgrade it and select Continue when done.

  1) Re-check for outdated Routers and continue with the metadata upgrade.
  2) Unregister the remaining Routers.
  3) Abort the operation.
  4) Help

Please select an option: Unregistering a Router implies it will not be used in the Cluster, do you want to continue? [y/N]: Upgrading metadata at '<<<hostname>>>:<<<__mysql_sandbox_port1>>>' from version 1.0.1 to version 2.0.0.
Creating backup of the metadata schema...
Step 1 of 1: upgrading from 1.0.1 to 2.0.0...
Removing metadata backup...
Upgrade process successfully finished, metadata schema is now on version 2.0.0

