// Assumptions: smart deployment functions available

function print_metadata_instance_addresses(session) {
    var res = session.runSql("select instance_name, addresses from mysql_innodb_cluster_metadata.instances").fetchAll();
    for (var i = 0; i < res.length; i++) {
        print(res[i][0] + " = " + res[i][1] + "\n");
    }
    print("\n");
}

function get_recovery_user(session) {
    var res = session.runSql(
        "SELECT user_name FROM mysql.slave_master_info " +
        "WHERE Channel_name = 'group_replication_recovery'");
    var row = res.fetchOne();
    return row[0];
}

function number_of_non_expiring_pwd_accounts(session, user) {
    // Account with non expiring password have password_lifetime = 0.
    var res = session.runSql(
        "SELECT COUNT(*)  FROM mysql.user u WHERE u.user = '" + user +
        "' AND password_lifetime = 0");
    var row = res.fetchOne();
    return row[0];
}

// WL#12049 AdminAPI: option to shutdown server when dropping out of the
// cluster
//
// In 8.0.12 and 5.7.24, Group Replication introduced an option to allow
// defining the behaviour of a cluster member whenever it drops the cluster
// unintentionally, i.e. not manually removed by the user (DBA). The
// behaviour defined can be either automatically shutting itself down or
// switching itself to super-read-only (current behaviour). The option is:
// group_replication_exit_state_action.
//
// In order to support defining such option, the AdminAPI was extended by
// introducing a new optional parameter, named 'exitStateAction', in the
// following functions:
//
// - dba.createCluster()
// - Cluster.addInstance()
//

//@ WL#12049: Initialization
testutil.deploySandbox(__mysql_sandbox_port1, "root", {report_host: hostname});
testutil.deploySandbox(__mysql_sandbox_port2, "root", {report_host: hostname});

shell.connect(__sandbox_uri1);

// Test the option on the addInstance() command
//@ WL#12049: Create cluster 1 {VER(>=5.7.24)}
var c = dba.createCluster('test', {clearReadOnly: true, gtidSetIsComplete: true})

//@ WL#12049: addInstance() errors using exitStateAction option {VER(>=5.7.24)}
// F1.2 - The exitStateAction option shall be a string value.
// NOTE: GR validates the value, which is an Enumerator, and accepts the values
// `ABORT_SERVER` or `READ_ONLY`, or 1 or 0.
c.addInstance(__sandbox_uri2, {exitStateAction: ""});

c.addInstance(__sandbox_uri2, {exitStateAction: " "});

c.addInstance(__sandbox_uri2, {exitStateAction: ":"});

c.addInstance(__sandbox_uri2, {exitStateAction: "AB"});

c.addInstance(__sandbox_uri2, {exitStateAction: "10"});

//@ WL#12049: Add instance using a valid exitStateAction 1 {VER(>=5.7.24)}
c.addInstance(__sandbox_uri2, {exitStateAction: "ABORT_SERVER"});

//@ WL#12049: Dissolve cluster 1 {VER(>=5.7.24)}
c.dissolve({force: true});

// Verify if exitStateAction is persisted on >= 8.0.12

// F2 - On a successful [dba.]createCluster() or [Cluster.]addInstance() call
// using the option exitStateAction, the GR sysvar
// group_replication_exit_state_action must be persisted using SET PERSIST at
// the target instance, if the MySQL Server instance version is >= 8.0.12.

//@ WL#12049: Create cluster 2 {VER(>=8.0.12)}
var c = dba.createCluster('test', {clearReadOnly: true, groupName: "ca94447b-e6fc-11e7-b69d-4485005154dc", exitStateAction: "READ_ONLY", gtidSetIsComplete: true});

//@ WL#12049: Add instance using a valid exitStateAction 2 {VER(>=8.0.12)}
c.addInstance(__sandbox_uri2, {exitStateAction: "READ_ONLY"})

session.close()
shell.connect(__sandbox_uri2);

//@<> WL#12049: exitStateAction must be persisted on mysql >= 8.0.12 {VER(>=8.0.12)}
EXPECT_EQ("READ_ONLY", get_sysvar(session,  "group_replication_exit_state_action", "PERSISTED"));

//@ WL#12049: Dissolve cluster 2 {VER(>=8.0.12)}
c.dissolve({force: true});

// Verify that group_replication_exit_state_action is not persisted when not used
// We need a clean instance for that because dissolve does not unset the previously set variables

//@ WL#12049: Initialize new instance
session.close();
testutil.destroySandbox(__mysql_sandbox_port1);
testutil.destroySandbox(__mysql_sandbox_port2);
testutil.deploySandbox(__mysql_sandbox_port1, "root", {report_host: hostname});
testutil.deploySandbox(__mysql_sandbox_port2, "root", {report_host: hostname});

shell.connect(__sandbox_uri1);

//@ WL#12049: Create cluster 3 {VER(>=8.0.12)}
var c = dba.createCluster('test', {groupName: "ca94447b-e6fc-11e7-b69d-4485005154dc", gtidSetIsComplete: true});

//@ WL#12049: Add instance without using exitStateAction {VER(>=8.0.12)}
c.addInstance(__sandbox_uri2)

//@<> BUG#28701263: DEFAULT VALUE OF EXITSTATEACTION TOO DRASTIC {VER(>=8.0.12)}
EXPECT_EQ("READ_ONLY", get_sysvar(session, "group_replication_exit_state_action"));

//@ WL#12049: Finalization
session.close();
testutil.destroySandbox(__mysql_sandbox_port1);
testutil.destroySandbox(__mysql_sandbox_port2);

// WL#11032 AdminAPI: Configure member weight for automatic primary election on
// failover
//
// In MySQL 8.0.2 and 5.7.20, Group Replication introduces an option to control
// the outcome of the primary election algorithm in single-primary mode. With
// this option, the user can influence the primary member election by providing
// a member weight value for each member node. That weight value is used for
// electing the primary member instead of the member uuid which is the default
// method used for the election.
//
// In order to support defining such option, the AdminAPI was extended by
// introducing a new optional parameter, named 'memberWeight', in the
// following functions:
//
// - dba.createCluster()
// - Cluster.addInstance()
//

//@ WL#11032: Initialization
testutil.deploySandbox(__mysql_sandbox_port1, "root", {report_host: hostname});
testutil.deploySandbox(__mysql_sandbox_port2, "root", {report_host: hostname});

shell.connect(__sandbox_uri1);

// Test the option on the addInstance() command
//@ WL#11032: Create cluster 1 {VER(>=5.7.20)}
var c = dba.createCluster('test', {clearReadOnly: true, gtidSetIsComplete: true})

//@ WL#11032: addInstance() errors using memberWeight option {VER(>=5.7.20)}
// F1.2 - The memberWeight option shall be an integer value.
c.addInstance(__sandbox_uri2, {memberWeight: ""});

c.addInstance(__sandbox_uri2, {memberWeight: true});

c.addInstance(__sandbox_uri2, {memberWeight: "AB"});

c.addInstance(__sandbox_uri2, {memberWeight: 10.5});

//@ WL#11032: Add instance using a valid value for memberWeight (25) {VER(>=5.7.20)}
c.addInstance(__sandbox_uri2, {memberWeight: 25});

//@ WL#11032: Dissolve cluster 1 {VER(>=5.7.20)}
c.dissolve({force: true});

// Verify if memberWeight is persisted on >= 8.0.11

// F2 - On a successful [dba.]createCluster() or [Cluster.]addInstance() call
// using the option memberWeight, the GR sysvar
// group_replication_member_weight must be persisted using SET PERSIST at
// the target instance, if the MySQL Server instance version is >= 8.0.11.

//@ WL#11032: Create cluster 2 {VER(>=8.0.11)}
var c = dba.createCluster('test', {clearReadOnly: true, groupName: "ca94447b-e6fc-11e7-b69d-4485005154dc", memberWeight: 75, gtidSetIsComplete: true});

//@ WL#11032: Add instance using a valid value for memberWeight (-50) {VER(>=8.0.11)}
c.addInstance(__sandbox_uri2, {memberWeight: -50})

//@<> WL#11032: memberWeight must be persisted on mysql >= 8.0.11 {VER(>=8.0.11)}
EXPECT_EQ("0", get_sysvar(__mysql_sandbox_port2, "group_replication_member_weight", "PERSISTED"));

//@ WL#11032: Dissolve cluster 2 {VER(>=8.0.11)}
c.dissolve({force: true});

// Verify that group_replication_member_weight is not persisted when not used
// We need a clean instance for that because dissolve does not unset the previously set variables

//@ WL#11032: Initialize new instance
session.close();
testutil.destroySandbox(__mysql_sandbox_port1);
testutil.destroySandbox(__mysql_sandbox_port2);
testutil.deploySandbox(__mysql_sandbox_port1, "root", {report_host: hostname});
testutil.deploySandbox(__mysql_sandbox_port2, "root", {report_host: hostname});

shell.connect(__sandbox_uri1);

//@ WL#11032: Create cluster 3 {VER(>=8.0.11)}
var c = dba.createCluster('test', {groupName: "ca94447b-e6fc-11e7-b69d-4485005154dc", gtidSetIsComplete: true});

//@ WL#11032: Add instance without using memberWeight {VER(>=8.0.11)}
c.addInstance(__sandbox_uri2)

//@<> WL#11032: memberWeight must not be persisted on mysql >= 8.0.11 if not set {VER(>=8.0.11)}
EXPECT_EQ("", get_sysvar(__mysql_sandbox_port2, "group_replication_member_weight", "PERSISTED"));

//@ WL#11032: Finalization
session.close();
testutil.destroySandbox(__mysql_sandbox_port1);
testutil.destroySandbox(__mysql_sandbox_port2);

// BUG#27084767: CREATECLUSTER()/ ADDINSTANCE() DOES NOT CORRECTLY SET AUTO_INCREMENT_OFFSET
//
// dba.createCluster() and addInstance() in single-primary mode, must set the following values:
//
// auto_increment_offset = 2
// auto_increment_increment = 1
//
// And in multi-primary mode:
//
// auto_increment_offset = 1 + server_id % 7
// auto_increment_increment = 7
//
// The value setting should not differ if the target instance is a sandbox or not

// Test with a sandbox

// Test in single-primary mode

//@ BUG#27084767: Initialize new instances
testutil.deploySandbox(__mysql_sandbox_port1, "root", {report_host: hostname});
testutil.deploySandbox(__mysql_sandbox_port2, "root", {report_host: hostname});

shell.connect(__sandbox_uri1);

//@ BUG#27084767: Create a cluster in single-primary mode
var c = dba.createCluster('test', {gtidSetIsComplete: true});

//@<> BUG#27084767: Verify the values of auto_increment_% in the seed instance
EXPECT_EQ(1, get_sysvar(session, "auto_increment_increment"));
EXPECT_EQ(2, get_sysvar(session, "auto_increment_offset"));

//@ BUG#27084767: Add instance to cluster in single-primary mode
c.addInstance(__sandbox_uri2)
testutil.waitMemberState(__mysql_sandbox_port2, "ONLINE");

//@<> BUG#27084767: Verify the values of auto_increment_%
EXPECT_EQ(1, get_sysvar(__mysql_sandbox_port2, "auto_increment_increment"));
EXPECT_EQ(2, get_sysvar(__mysql_sandbox_port2, "auto_increment_offset"));

// Test in multi-primary mode

//@ BUG#27084767: Dissolve the cluster
c.dissolve({force: true})
session.close();

shell.connect(__sandbox_uri1);

//@ BUG#27084767: Create a cluster in multi-primary mode
var c = dba.createCluster('test', {multiPrimary: true, force: true, clearReadOnly: true, gtidSetIsComplete: true});

// Reconnect the session before validating the values of auto_increment_%
// This must be done because 'SET PERSIST' changes the values globally (GLOBAL) and not per session
session.close();
shell.connect(__sandbox_uri1);

// Get the server_id to calculate the expected value of auto_increment_offset
var result = session.runSql("SELECT @@server_id");
var row = result.fetchOne();
var server_id = row[0];

var __expected_auto_inc_offset = 1 + server_id%7

//@<> BUG#27084767: Verify the values of auto_increment_% in the seed instance in multi-primary mode
EXPECT_EQ(7, get_sysvar(session, "auto_increment_increment"));
EXPECT_EQ(__expected_auto_inc_offset, get_sysvar(session, "auto_increment_offset"));

//@ BUG#27084767: Add instance to cluster in multi-primary mode
c.addInstance(__sandbox_uri2)
testutil.waitMemberState(__mysql_sandbox_port2, "ONLINE");

// Connect to the instance 2 to perform the auto_increment_% validations
session.close();
shell.connect(__sandbox_uri2);

// Get the server_id to calculate the expected value of auto_increment_offset
var result = session.runSql("SELECT @@server_id");
var row = result.fetchOne();
var server_id = row[0];

var __expected_auto_inc_offset = 1 + server_id%7

//@<> BUG#27084767: Verify the values of auto_increment_% multi-primary
EXPECT_EQ(7, get_sysvar(session, "auto_increment_increment"));
EXPECT_EQ(__expected_auto_inc_offset, get_sysvar(session, "auto_increment_offset"));

//@ BUG#27084767: Finalization
c.disconnect()
session.close();
testutil.destroySandbox(__mysql_sandbox_port1);
testutil.destroySandbox(__mysql_sandbox_port2);

// Test with non-sandbox instance

// Test in single-primary mode

//@ BUG#27084767: Initialize new non-sandbox instance
testutil.deployRawSandbox(__mysql_sandbox_port1, 'root', {report_host: hostname});
testutil.snapshotSandboxConf(__mysql_sandbox_port1);
testutil.deployRawSandbox(__mysql_sandbox_port2, 'root', {report_host: hostname});
testutil.snapshotSandboxConf(__mysql_sandbox_port2);
var sandbox_cnf1 = testutil.getSandboxConfPath(__mysql_sandbox_port1);
dba.configureInstance(__sandbox_uri1, {clusterAdmin:'root', mycnfPath: sandbox_cnf1});
testutil.stopSandbox(__mysql_sandbox_port1);
testutil.startSandbox(__mysql_sandbox_port1);
var sandbox_cnf2 = testutil.getSandboxConfPath(__mysql_sandbox_port2);
dba.configureInstance(__sandbox_uri2, {clusterAdmin:'root', mycnfPath: sandbox_cnf2});
testutil.stopSandbox(__mysql_sandbox_port2);
testutil.startSandbox(__mysql_sandbox_port2);

// Connect to instance1 to create the cluster
shell.connect(__hostname_uri1);

//@ BUG#27084767: Create a cluster in single-primary mode non-sandbox
var c = dba.createCluster('test', {gtidSetIsComplete: true});

//@<> BUG#27084767: Verify the values of auto_increment_% in the seed instance non-sandbox
EXPECT_EQ(1, get_sysvar(session, "auto_increment_increment"));
EXPECT_EQ(2, get_sysvar(session, "auto_increment_offset"));

//@ BUG#27084767: Add instance to cluster in single-primary mode non-sandbox
c.addInstance(__hostname_uri2)
testutil.waitMemberState(__mysql_sandbox_port2, "ONLINE");

//@<> BUG#27084767: Verify the values of auto_increment_% non-sandbox
EXPECT_EQ(1, get_sysvar(__mysql_sandbox_port2, "auto_increment_increment"));
EXPECT_EQ(2, get_sysvar(__mysql_sandbox_port2, "auto_increment_offset"));

// Test in multi-primary mode

//@ BUG#27084767: Dissolve the cluster non-sandbox
c.dissolve({force: true})

// Connect to instance1 to create the cluster
shell.connect(__hostname_uri1);

//@ BUG#27084767: Create a cluster in multi-primary mode non-sandbox
var c = dba.createCluster('test', {multiPrimary: true, force: true, clearReadOnly: true, gtidSetIsComplete: true});

// Reconnect the session before validating the values of auto_increment_%
// This must be done because 'SET PERSIST' changes the values globally (GLOBAL) and not per session
session.close();
shell.connect(__sandbox_uri1);

// Get the server_id to calculate the expected value of auto_increment_offset
var result = session.runSql("SELECT @@server_id");
var row = result.fetchOne();
var server_id = row[0];

var __expected_auto_inc_offset = 1 + server_id%7

//@<> BUG#27084767: Verify the values of auto_increment_% in multi-primary non-sandbox
EXPECT_EQ(7, get_sysvar(session, "auto_increment_increment"));
EXPECT_EQ(__expected_auto_inc_offset, get_sysvar(session, "auto_increment_offset"));

//@ BUG#27084767: Add instance to cluster in multi-primary mode non-sandbox
c.addInstance(__hostname_uri2)
testutil.waitMemberState(__mysql_sandbox_port2, "ONLINE");

// Connect to the instance 2 to perform the auto_increment_% validations
session.close();
shell.connect(__sandbox_uri2);

// Get the server_id to calculate the expected value of auto_increment_offset
var result = session.runSql("SELECT @@server_id");
var row = result.fetchOne();
var server_id = row[0];

var __expected_auto_inc_offset = 1 + server_id%7

//@<> BUG#27084767: Verify the values of auto_increment_% multi-primary non-sandbox
EXPECT_EQ(7, get_sysvar(__mysql_sandbox_port2, "auto_increment_increment"));
EXPECT_EQ(__expected_auto_inc_offset, get_sysvar(__mysql_sandbox_port2, "auto_increment_offset"));

//@ BUG#27084767: Finalization non-sandbox
c.disconnect();
session.close();
testutil.destroySandbox(__mysql_sandbox_port1);
testutil.destroySandbox(__mysql_sandbox_port2);

//@ BUG#27677227 cluster with x protocol disabled setup
WIPE_SHELL_LOG();
testutil.deploySandbox(__mysql_sandbox_port1, "root", {"mysqlx":"0", report_host: hostname});
testutil.deploySandbox(__mysql_sandbox_port2, "root", {"mysqlx":"0", report_host: hostname});
testutil.deploySandbox(__mysql_sandbox_port3, "root", {report_host: hostname});

shell.connect(__sandbox_uri1);
c = dba.createCluster('noxplugin', {gtidSetIsComplete: true});
c.addInstance(__sandbox_uri2);
c.addInstance(__sandbox_uri3);

var msg1 = "The X plugin is not enabled on instance '" + hostname + ":" + __mysql_sandbox_port1 + "'. No value will be assumed for the X protocol address.";
var msg2 = "The X plugin is not enabled on instance '" + hostname + ":" + __mysql_sandbox_port2 + "'. No value will be assumed for the X protocol address.";
EXPECT_SHELL_LOG_CONTAINS(msg1);
EXPECT_SHELL_LOG_CONTAINS(msg2);

//@<OUT> BUG#27677227 cluster with x protocol disabled, mysqlx should be NULL
print_metadata_instance_addresses(session);

//@ BUG#27677227 cluster with x protocol disabled cleanup
c.disconnect();
session.close();
testutil.destroySandbox(__mysql_sandbox_port1);
testutil.destroySandbox(__mysql_sandbox_port2);
testutil.destroySandbox(__mysql_sandbox_port3);

// BUG28056944: cannot add instance after removing its metadata
//@ BUG28056944 deploy sandboxes.
testutil.deploySandbox(__mysql_sandbox_port1, "root", {report_host: hostname});
testutil.deploySandbox(__mysql_sandbox_port2, "root", {report_host: hostname});

//@ BUG28056944 create cluster.
shell.connect(__hostname_uri1);
var c = dba.createCluster('test_cluster', {gtidSetIsComplete: true});
c.addInstance(__hostname_uri2);
testutil.waitMemberState(__mysql_sandbox_port2, "ONLINE");

//@<> BUG28056944 remove instance with wrong password and force = true.
var wrong_pwd_uri = "root:wrongpawd@" + hostname + ":" + __mysql_sandbox_port2;
c.removeInstance(wrong_pwd_uri, {force: true});

//@<> BUG28056944 Error adding instance already in group but not in Metadata.
c.addInstance(__hostname_uri2);

//@ BUG28056944 clean-up.
c.disconnect();
session.close();
testutil.destroySandbox(__mysql_sandbox_port1);
testutil.destroySandbox(__mysql_sandbox_port2);

// WL#12067 AdminAPI: Define failover consistency
//
// In 8.0.14, Group Replication introduces an option to specify the failover
// guarantees (eventual or read_your_writes) when a primary failover happens in
// single-primary mode). The new option defines the behavior of a new fencing
// mechanism when a new primary is being promoted in a group. The fencing will
// restrict connections from writing and reading from the new primary until it
// has applied all the pending backlog of changes that came from the old
// primary (read_your_writes). Applications will not see time going backward for
// a short period of time (during the new primary promotion).

// In order to support defining such option, the AdminAPI was extended by
// introducing a new optional parameter, named 'consistency', in the
// dba.createCluster function.
//
//@ WL#12067: Initialization {VER(>=8.0.14)}
testutil.deploySandbox(__mysql_sandbox_port1, "root", {report_host: hostname});
testutil.deploySandbox(__mysql_sandbox_port2, "root", {report_host: hostname});
testutil.deploySandbox(__mysql_sandbox_port3, "root", {report_host: hostname});
var s1 = mysql.getSession(__sandbox_uri1);
var s2 = mysql.getSession(__sandbox_uri2);

shell.connect(__sandbox_uri1);

// FR2 The value for group_replication_consistency must be the same on all cluster members that support the option
//@ WL#12067: TSF2_1 The value for group_replication_consistency must be the same on all cluster members (single-primary) {VER(>=8.0.14)}
var c = dba.createCluster('test', {consistency: "1", gtidSetIsComplete: true});
c.addInstance(__sandbox_uri2);
session.close();

//@<> WL#12067: TSF2_1 Confirm group_replication_consistency value is the same on all cluster members (single-primary) {VER(>=8.0.14)}
EXPECT_EQ("BEFORE_ON_PRIMARY_FAILOVER", get_sysvar(__mysql_sandbox_port1, "group_replication_consistency"));
EXPECT_EQ("BEFORE_ON_PRIMARY_FAILOVER", get_sysvar(__mysql_sandbox_port2, "group_replication_consistency"));

//@<> WL#12067: TSF2_1 Confirm group_replication_consistency value was persisted (single-primary) {VER(>=8.0.14)}
EXPECT_EQ("BEFORE_ON_PRIMARY_FAILOVER", get_sysvar(__mysql_sandbox_port1, "group_replication_consistency", "PERSISTED"));
EXPECT_EQ("BEFORE_ON_PRIMARY_FAILOVER", get_sysvar(__mysql_sandbox_port2, "group_replication_consistency", "PERSISTED"));

// BUG#30394258: CLUSTER.ADD_INSTANCE: THE OPTION GROUP_REPLICATION_CONSISTENCY CANNOT BE USED
// Regression test to ensure that when a consistency level of "BEFORE", "AFTER" or
// "BEFORE_AND_AFTER" was set in the cluster any instance will be successfully added

//@<> BUG#30394258: prepare {VER(>=8.0.14)}
 c.setOption("consistency", "BEFORE");

//@<> BUG#30394258: add instance to the cluster {VER(>=8.0.14)}
c.addInstance(__sandbox_uri3);

//@ WL#12067: Dissolve cluster 1{VER(>=8.0.14)}
c.dissolve({force: true});

// FR2 The value for group_replication_consistency must be the same on all cluster members that support the option
//@ WL#12067: TSF2_2 The value for group_replication_consistency must be the same on all cluster members (multi-primary) {VER(>=8.0.14)}
shell.connect(__sandbox_uri1);
var c = dba.createCluster('test', { clearReadOnly:true, consistency: "1", multiPrimary:true, force: true, gtidSetIsComplete: true});
c.addInstance(__sandbox_uri2);
session.close();

//@<> WL#12067: TSF2_2 Confirm group_replication_consistency value is the same on all cluster members (multi-primary) {VER(>=8.0.14)}
EXPECT_EQ("BEFORE_ON_PRIMARY_FAILOVER", get_sysvar(__mysql_sandbox_port1, "group_replication_consistency"));
EXPECT_EQ("BEFORE_ON_PRIMARY_FAILOVER", get_sysvar(__mysql_sandbox_port2, "group_replication_consistency"));

//@<> WL#12067: TSF2_2 Confirm group_replication_consistency value was persisted (multi-primary) {VER(>=8.0.14)}
EXPECT_EQ("BEFORE_ON_PRIMARY_FAILOVER", get_sysvar(__mysql_sandbox_port1, "group_replication_consistency", "PERSISTED"));
EXPECT_EQ("BEFORE_ON_PRIMARY_FAILOVER", get_sysvar(__mysql_sandbox_port2, "group_replication_consistency", "PERSISTED"));

//@ WL#12067: Finalization {VER(>=8.0.14)}
testutil.destroySandbox(__mysql_sandbox_port1);
testutil.destroySandbox(__mysql_sandbox_port2);
testutil.destroySandbox(__mysql_sandbox_port3);

// WL#12050 AdminAPI: Define the timeout for evicting previously active cluster members
//
// In 8.0.13, Group Replication introduced an option to allow defining
// the timeout for evicting previously active nodes.  In order to support
// defining such option, the AdminAPI was extended by introducing a new
// optional parameter, named 'expelTimeout', in the dba.createCluster()
// function.

//@ WL#12050: Initialization {VER(>=8.0.13)}
testutil.deploySandbox(__mysql_sandbox_port1, "root", {report_host: hostname});
testutil.deploySandbox(__mysql_sandbox_port2, "root", {report_host: hostname});
var s1 = mysql.getSession(__sandbox_uri1);
var s2 = mysql.getSession(__sandbox_uri2);

shell.connect(__sandbox_uri1);

// FR2 The value for group_replication_member_expel_timeout must be the same on all cluster members that support the option
//@ WL#12050: TSF2_1 The value for group_replication_member_expel_timeout must be the same on all cluster members (single-primary) {VER(>=8.0.13)}
var c = dba.createCluster('test', {expelTimeout: 100, gtidSetIsComplete: true});
c.addInstance(__sandbox_uri2);
session.close();

//@<> WL#12050: TSF2_1 Confirm group_replication_member_expel_timeout value is the same on all cluster members (single-primary) {VER(>=8.0.13)}
EXPECT_EQ(100, get_sysvar(__mysql_sandbox_port1, "group_replication_member_expel_timeout"));
EXPECT_EQ(100, get_sysvar(__mysql_sandbox_port2, "group_replication_member_expel_timeout"));

//@<> WL#12050: TSF2_1 Confirm group_replication_member_expel_timeout value was persisted (single-primary) {VER(>=8.0.13)}
EXPECT_EQ("100", get_sysvar(__mysql_sandbox_port1, "group_replication_member_expel_timeout", "PERSISTED"));
EXPECT_EQ("100", get_sysvar(__mysql_sandbox_port2, "group_replication_member_expel_timeout", "PERSISTED"));

//@ WL#12050: Dissolve cluster 1 {VER(>=8.0.13)}
c.dissolve({force: true});

// FR2 The value for group_replication_member_expel_timeout must be the same on all cluster members that support the option
//@ WL#12050: TSF2_2 The value for group_replication_member_expel_timeout must be the same on all cluster members (multi-primary) {VER(>=8.0.13)}
shell.connect(__sandbox_uri1);
var c = dba.createCluster('test', { clearReadOnly:true, expelTimeout: 200, multiPrimary:true, force: true, gtidSetIsComplete: true});
c.addInstance(__sandbox_uri2);
session.close();

//@<> WL#12050: TSF2_2 Confirm group_replication_member_expel_timeout value is the same on all cluster members (multi-primary) {VER(>=8.0.13)}
EXPECT_EQ(200, get_sysvar(__mysql_sandbox_port1, "group_replication_member_expel_timeout"));
EXPECT_EQ(200, get_sysvar(__mysql_sandbox_port2, "group_replication_member_expel_timeout"));

//@<> WL#12050: TSF2_2 Confirm group_replication_member_expel_timeout value was persisted (multi-primary) {VER(>=8.0.13)}
EXPECT_EQ("200", get_sysvar(__mysql_sandbox_port1, "group_replication_member_expel_timeout", "PERSISTED"));
EXPECT_EQ("200", get_sysvar(__mysql_sandbox_port2, "group_replication_member_expel_timeout", "PERSISTED"));

//@ WL#12050: Finalization {VER(>=8.0.13)}
testutil.destroySandbox(__mysql_sandbox_port1);
testutil.destroySandbox(__mysql_sandbox_port2);


// WL#12066 AdminAPI: option to define the number of auto-rejoins
//
// In 8.0.16, Group Replication introduced an option to allow setting the
// number of auto-rejoin attempts an instance will do after being
// expelled from the group.  In order to support defining such option,
// the AdminAPI was extended by introducing a new optional parameter,
// named 'autoRejoinTries', in the dba.createCluster(),
// cluster.addInstance, cluster.setOption and cluster.setInstanceOption
// functions.

//@ WL#12066: Initialization {VER(>=8.0.16)}
testutil.deploySandbox(__mysql_sandbox_port1, "root", {report_host: hostname});
testutil.snapshotSandboxConf(__mysql_sandbox_port1);
testutil.deploySandbox(__mysql_sandbox_port2, "root", {report_host: hostname});
testutil.snapshotSandboxConf(__mysql_sandbox_port2);
testutil.deploySandbox(__mysql_sandbox_port3, "root", {report_host: hostname});
var s1 = mysql.getSession(__sandbox_uri1);
var s2 = mysql.getSession(__sandbox_uri2);
var s3 = mysql.getSession(__sandbox_uri3);
shell.connect(__sandbox_uri1);
var c = dba.createCluster('test', {autoRejoinTries: 2, gtidSetIsComplete: true});

// FR1 - A new option autoRejoinTries shall be added to the [dba.]createCluster() and [cluster.]addInstance() to allow users to set the Group Replication (GR) system variable group_replication_autorejoin_tries.
//@ WL#12066: TSF1_4 Validate that an exception is thrown if the value specified is not an unsigned integer. {VER(>=8.0.16)}
c.addInstance(__sandbox_uri2, {autoRejoinTries: -5});

//@ WL#12066: TSF1_5 Validate that an exception is thrown if the value  is not in the range 0 to 2016. {VER(>=8.0.16)}
c.addInstance(__sandbox_uri2, {autoRejoinTries: 2017});

//@ WL#12066: TSF1_1, TSF6_1 Validate that the functions [dba.]createCluster() and [cluster.]addInstance() support a new option named autoRejoinTries. {VER(>=8.0.16)}
c.addInstance(__sandbox_uri2, {autoRejoinTries: 2016});
c.addInstance(__sandbox_uri3);
session.close();

//@<> WL#12066: TSF1_3, TSF1_6 Validate that when calling the functions [dba.]createCluster() and [cluster.]addInstance(), the GR variable group_replication_autorejoin_tries is persisted with the value given by the user on the target instance.{VER(>=8.0.16)}
EXPECT_EQ(2, get_sysvar(__mysql_sandbox_port1, "group_replication_autorejoin_tries"));
EXPECT_EQ(2016, get_sysvar(__mysql_sandbox_port2, "group_replication_autorejoin_tries"));
EXPECT_EQ(0, get_sysvar(__mysql_sandbox_port3, "group_replication_autorejoin_tries"));

//@<> WL#12066: TSF1_3, TSF1_6 Confirm group_replication_autorejoin_tries value was persisted {VER(>=8.0.16)}
EXPECT_EQ("2", get_sysvar(__mysql_sandbox_port1, "group_replication_autorejoin_tries", "PERSISTED"));
EXPECT_EQ("2016", get_sysvar(__mysql_sandbox_port2, "group_replication_autorejoin_tries", "PERSISTED"));
EXPECT_EQ("", get_sysvar(__mysql_sandbox_port3, "group_replication_autorejoin_tries", "PERSISTED"));

//@ WL#12066: Finalization {VER(>=8.0.16)}
// NOTE: re-use the cluster for the next test. Remove only instances 2 and 3
c.removeInstance(__sandbox_uri2);
c.removeInstance(__sandbox_uri3);
testutil.destroySandbox(__mysql_sandbox_port3);

// BUG#29305551: ADMINAPI FAILS TO DETECT INSTANCE IS RUNNING ASYNCHRONOUS REPLICATION
//
// dba.checkInstance() reports that a target instance which is running the Slave
// SQL and IO threads is valid to be used in an InnoDB cluster.
//
// As a consequence, the AdminAPI fails to detects that an instance has
// asynchronous replication running and both addInstance() and rejoinInstance()
// fail with useless/unfriendly errors on this scenario. There's not even
// information on how to overcome the issue.

//@<> BUG#29305551: Initialization {VER(<8.0)}
testutil.deploySandbox(__mysql_sandbox_port1, "root", {report_host: hostname});
testutil.snapshotSandboxConf(__mysql_sandbox_port1);
testutil.deploySandbox(__mysql_sandbox_port2, "root", {report_host: hostname});
testutil.snapshotSandboxConf(__mysql_sandbox_port2);
shell.connect(__sandbox_uri1);
var c = dba.createCluster('test', {gtidSetIsComplete: true});
session.close();

//@<> BUG#29305551: Setup asynchronous replication
// Create Replication user
shell.connect(__sandbox_uri1);
session.runSql("CREATE USER 'repl'@'%' IDENTIFIED BY 'password' REQUIRE SSL");
session.runSql("GRANT REPLICATION SLAVE ON *.* TO 'repl'@'%';");

// Set async channel on instance2
session.close();
shell.connect(__sandbox_uri2);

session.runSql("CHANGE MASTER TO MASTER_HOST='" + hostname + "', MASTER_PORT=" + __mysql_sandbox_port1 + ", MASTER_USER='repl', MASTER_PASSWORD='password', MASTER_AUTO_POSITION=1, MASTER_SSL=1");
session.runSql("START SLAVE");

//@ AddInstance async replication error
c.addInstance(__sandbox_uri2);

//@ BUG#29305551: Finalization
session.close();
testutil.destroySandbox(__mysql_sandbox_port1);
testutil.destroySandbox(__mysql_sandbox_port2);

// BUG#29809560: addinstance() does not validate if server_id is unique in the cluster
//@ BUG#29809560: deploy sandboxes.
testutil.deploySandbox(__mysql_sandbox_port1, "root", {report_host: hostname});
testutil.deploySandbox(__mysql_sandbox_port2, "root", {report_host: hostname});

//@ BUG#29809560: set the same server id an all instances.
shell.connect(__hostname_uri1);
session.runSql("SET GLOBAL server_id = 666");
session.close();
shell.connect(__hostname_uri2);
session.runSql("SET GLOBAL server_id = 666");
session.close();

//@ BUG#29809560: create cluster.
shell.connect(__hostname_uri1);
var c = dba.createCluster('test', {gtidSetIsComplete: true});

//@<> BUG#29809560: add instance fails because server_id is not unique.
c.addInstance(__hostname_uri2);

//@ BUG#29809560: clean-up.
c.disconnect();
session.close();
testutil.destroySandbox(__mysql_sandbox_port1);
testutil.destroySandbox(__mysql_sandbox_port2);

// BUG#28855764: user created by shell expires with default_password_lifetime
//@ BUG#28855764: deploy sandboxes.
testutil.deploySandbox(__mysql_sandbox_port1, "root", {report_host: hostname});
testutil.deploySandbox(__mysql_sandbox_port2, "root", {report_host: hostname});

//@ BUG#28855764: create cluster.
shell.connect(__hostname_uri1);
var c = dba.createCluster('test', {gtidSetIsComplete: true});

//@ BUG#28855764: add instance an instance to the cluster
c.addInstance(__hostname_uri2);

//@ BUG#28855764: get recovery user for instance 2.
session.close();
shell.connect(__hostname_uri2);
var recovery_user_2 = get_recovery_user(session);

//@ BUG#28855764: get recovery user for instance 1.
session.close();
shell.connect(__hostname_uri1);
var recovery_user_1 = get_recovery_user(session);

//@<> BUG#28855764: Passwords for recovery users never expire (password_lifetime=0).
print("Number of accounts for '" + recovery_user_1 + "': " + number_of_non_expiring_pwd_accounts(session, recovery_user_1) + "\n");
print("Number of accounts for '" + recovery_user_2 + "': " + number_of_non_expiring_pwd_accounts(session, recovery_user_2) + "\n");

//@ BUG#28855764: clean-up.
c.disconnect();
session.close();
testutil.destroySandbox(__mysql_sandbox_port1);
testutil.destroySandbox(__mysql_sandbox_port2);

// WL#12773 AdminAPI: Simplification of internal recovery accounts

//@<> WL#12773: Initialization
testutil.deploySandbox(__mysql_sandbox_port1, "root", {report_host: hostname, server_id: 11111});
testutil.deploySandbox(__mysql_sandbox_port2, "root", {report_host: hostname, server_id: 22222});
testutil.deploySandbox(__mysql_sandbox_port3, "root", {report_host: hostname, server_id: 33333});
shell.connect(__sandbox_uri1);
var c = dba.createCluster('test', {gtidSetIsComplete: true});

// FR1 - A new auto-generated recovery account must be created whenever creating a cluster and joining an instance to a cluster
//@<> WL#12773: FR1.1 - The account user-name shall be mysql_innodb_cluster_<server_id>
c.addInstance(__sandbox_uri2);
testutil.waitMemberState(__mysql_sandbox_port2, "ONLINE");
var result = session.runSql("SELECT COUNT(*) FROM mysql.user WHERE User = 'mysql_innodb_cluster_22222'");
var number = result.fetchOne()[0];
EXPECT_EQ(1, number);

//@<> WL#12773: FR1.2 - The host-name shall be %
result = session.runSql("SELECT Host FROM mysql.user WHERE User = 'mysql_innodb_cluster_22222'");
var user_host = result.fetchOne()[0];
EXPECT_EQ("%", user_host);

//@ WL#12773: FR4 - The ipWhitelist shall not change the behavior defined by FR1
result = session.runSql("SELECT COUNT(*) FROM mysql.user");
var old_account_number = result.fetchOne()[0];
c.addInstance(__sandbox_uri3, {ipWhitelist:"192.168.2.1/15,127.0.0.1," + hostname_ip});
testutil.waitMemberState(__mysql_sandbox_port3, "ONLINE");
print(get_all_gr_recovery_accounts(session));

result = session.runSql("SELECT COUNT(*) FROM mysql.user");
var new_account_number = result.fetchOne()[0];
EXPECT_EQ(old_account_number + 1, new_account_number);

//@<> WL#12773: Cleanup
session.close();
testutil.destroySandbox(__mysql_sandbox_port1);
testutil.destroySandbox(__mysql_sandbox_port2);
testutil.destroySandbox(__mysql_sandbox_port3);

// BUG#25503159: addInstance() does not drop recovery user when it fails
//@<> BUG#25503159: deploy sandboxes.
testutil.deploySandbox(__mysql_sandbox_port1, "root", {report_host: hostname});
testutil.deploySandbox(__mysql_sandbox_port2, "root", {report_host: hostname});

//@<> BUG#25503159: create cluster.
shell.connect(__hostname_uri1);
var c = dba.createCluster('test', {gtidSetIsComplete: true});
//var c = dba.createCluster('test');

//@ BUG#25503159: number of recovery users before executing addInstance().
var num_recovery_users = number_of_gr_recovery_accounts(session);
print("Number of recovery user before addInstance(): " + num_recovery_users + "\n");

//@ BUG#25503159: add instance fail (using an invalid localaddress).
c.addInstance(__hostname_uri2, {localAddress: "invalid_host"});

//@<> BUG#25503159: number of recovery users is the same.
var num_recovery_users_after = number_of_gr_recovery_accounts(session);
EXPECT_EQ(num_recovery_users, num_recovery_users_after);

// BUG#30281908: MYSQL SHELL CRASHED WHILE ADDING A INSTANCE TO INNODB CLUSTER
// This bug was caused by a segmentation fault in the post-clone restart handling
// that did not cover the timeout waiting for the instance to start after clone restarts it.
// To test it, we change the sandbox configuration file to introduce a bogus setting which will
// cause the failure of the instance restart, simulating then a timeout.

//@ BUG#30281908: add instance using clone and simulating a restart timeout {VER(>= 8.0.16)}
testutil.changeSandboxConf(__mysql_sandbox_port2, "foo", "bar");
c.addInstance(__sandbox_uri2, {interactive:true, recoveryMethod:"clone"});

//@<> BUG#30281908: restart the instance manually {VER(>= 8.0.16)}
testutil.removeFromSandboxConf(__mysql_sandbox_port2, "foo");
testutil.startSandbox(__mysql_sandbox_port2);
testutil.waitMemberState(__mysql_sandbox_port2, "ONLINE");

//@ BUG#30281908: complete the process with .rescan() {VER(>= 8.0.16)}
testutil.expectPrompt("Would you like to add it to the cluster metadata? [Y/n]:", "y");
c.rescan({interactive:true});

//@<> BUG#25503159: clean-up.
c.disconnect();
session.close();
testutil.destroySandbox(__mysql_sandbox_port1);
testutil.destroySandbox(__mysql_sandbox_port2);

//@<> Initialization canonical IPv6 addresses supported WL#12758 {VER(>= 8.0.14)}
testutil.deploySandbox(__mysql_sandbox_port1, "root", {report_host: "::1"});
testutil.deploySandbox(__mysql_sandbox_port2, "root", {report_host: "::1"});
shell.connect(__sandbox_uri1);
var cluster = dba.createCluster("cluster", {gtidSetIsComplete: true});

//@<> canonical IPv6 addresses are supported on addInstance WL#12758 {VER(>= 8.0.14)}
cluster.addInstance(__sandbox_uri2);
testutil.waitMemberState(__mysql_sandbox_port2, "ONLINE");
// Bug #30548843 Validate that IPv6 values stored on metadata for mysqlx are valid
print_metadata_instance_addresses(session);

//@<> Cleanup canonical IPv6 addresses supported WL#12758 {VER(>= 8.0.14)}
session.close();
testutil.destroySandbox(__mysql_sandbox_port1);
testutil.destroySandbox(__mysql_sandbox_port2);

//@<> Initialization sandbox WL#12758 IPv6 addresses supported {VER(>= 8.0.14)}
testutil.deploySandbox(__mysql_sandbox_port1, "root", {report_host: "::1"});
testutil.deploySandbox(__mysql_sandbox_port2, "root");
shell.connect(__sandbox_uri1);
var cluster = dba.createCluster("cluster", {gtidSetIsComplete: true});

//@<> IPv6 addresses are supported on localAddress, groupSeeds and ipWhitelist WL#12758 {VER(>= 8.0.14)}
var local_address = "[::1]:" + __mysql_sandbox_gr_port2;
var ip_white_list = "::1, 127.0.0.1";
var group_seeds = "[::1]:" + __mysql_sandbox_gr_port1; + ", [::1]:" + __mysql_sandbox_gr_port2;
cluster.addInstance(__sandbox_uri2, {ipWhitelist:ip_white_list, groupSeeds:group_seeds, localAddress:local_address});
testutil.waitMemberState(__mysql_sandbox_port2, "ONLINE");
shell.connect(__sandbox_uri2);
EXPECT_EQ(local_address, get_sysvar(session, "group_replication_local_address"));
EXPECT_EQ(ip_white_list, get_sysvar(session, "group_replication_ip_whitelist"));
EXPECT_EQ(group_seeds, get_sysvar(session, "group_replication_group_seeds"));

//@<> Cleanup WL#12758 IPv6 addresses supported {VER(>= 8.0.14)}
session.close();
testutil.destroySandbox(__mysql_sandbox_port1);
testutil.destroySandbox(__mysql_sandbox_port2);

//@<> Initialization canonical IPv6 addresses are not supported below 8.0.14 WL#12758 {VER(< 8.0.14)}
testutil.deploySandbox(__mysql_sandbox_port1, "root");
testutil.deploySandbox(__mysql_sandbox_port2, "root", {report_host: "::1"});
shell.connect(__sandbox_uri1);
var cluster = dba.createCluster("cluster", {gtidSetIsComplete: true});

//@ canonical IPv6 addresses are not supported below 8.0.14 WL#12758 {VER(< 8.0.14)}
cluster.addInstance(__sandbox_uri2);

//@<> Cleanup canonical IPv6 addresses are not supported below 8.0.14 WL#12758 {VER(< 8.0.14)}
session.close();
testutil.destroySandbox(__mysql_sandbox_port1);
testutil.destroySandbox(__mysql_sandbox_port2);

//@<> Initialization IPv6 addresses are not supported below 8.0.14 WL#12758 {VER(< 8.0.14)}
testutil.deploySandbox(__mysql_sandbox_port1, "root");
testutil.deploySandbox(__mysql_sandbox_port2, "root");
shell.connect(__sandbox_uri1);
var cluster = dba.createCluster("cluster", {gtidSetIsComplete: true});

//@ IPv6 local_address is not supported below 8.0.14 WL#12758 {VER(< 8.0.14)}
var local_address = "[::1]:" + __mysql_sandbox_gr_port1;
cluster.addInstance(__sandbox_uri2, {localAddress: local_address});

//@ IPv6 on ipWhitelist is not supported below 8.0.14 WL#12758 {VER(< 8.0.14)}
cluster.addInstance(__sandbox_uri2, {ipWhitelist: "::1, 127.0.0.1"});

//@ IPv6 on groupSeeds is not supported below 8.0.14 - 1 WL#12758 {VER(< 8.0.14)}
var group_seeds = "127.0.0.1:" + __mysql_sandbox_gr_port1 + ", [::1]:" + __mysql_sandbox_gr_port2;
cluster.addInstance(__sandbox_uri2, {groupSeeds: group_seeds});

//@ IPv6 on groupSeeds is not supported below 8.0.14 - 2 WL#12758 {VER(< 8.0.14)}
var group_seeds = "127.0.0.1:" + __mysql_sandbox_gr_port1 + ", [::1]:" + __mysql_sandbox_gr_port2 + " , [fe80::7e36:f49a:63c8:8ad6]:" + __mysql_sandbox_gr_port1;
cluster.addInstance(__sandbox_uri2, {groupSeeds:group_seeds});

//@<> Cleanup IPv6 addresses are not supported below 8.0.14 WL#12758 {VER(< 8.0.14)}
session.close();
testutil.destroySandbox(__mysql_sandbox_port1);
testutil.destroySandbox(__mysql_sandbox_port2);
