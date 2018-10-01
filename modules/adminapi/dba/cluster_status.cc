/*
 * Copyright (c) 2018, Oracle and/or its affiliates. All rights reserved.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License, version 2.0,
 * as published by the Free Software Foundation.
 *
 * This program is also distributed with certain software (including
 * but not limited to OpenSSL) that is licensed under separate terms, as
 * designated in a particular file or component or in included license
 * documentation.  The authors of MySQL hereby grant you an additional
 * permission to link the program and your derivative works with the
 * separately licensed software that they have included with MySQL.
 * This program is distributed in the hope that it will be useful,  but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See
 * the GNU General Public License, version 2.0, for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin St, Fifth Floor, Boston, MA 02110-1301 USA
 */

#include "modules/adminapi/dba/cluster_status.h"

#include <map>
#include <memory>
#include <string>
#include <utility>
#include <vector>

#include "modules/adminapi/mod_dba_replicaset.h"
#include "modules/adminapi/mod_dba_sql.h"
#include "mysqlshdk/libs/innodbcluster/cluster_metadata.h"
#include "mysqlshdk/libs/mysql/group_replication.h"
#include "mysqlshdk/libs/mysql/instance.h"
#include "mysqlshdk/libs/utils/strformat.h"
#include "mysqlshdk/libs/utils/utils_string.h"

namespace mysqlsh {
namespace dba {

using shcore::Value;
using shcore::make_dict;

namespace {
template <typename R>
inline bool set_uint(shcore::Dictionary_t dict, const std::string &prop,
                     const R &row, const std::string &field) {
  if (row.has_field(field)) {
    if (row.is_null(field))
      (*dict)[prop] = Value::Null();
    else
      (*dict)[prop] = Value(row.get_uint(field));
    return true;
  }
  return false;
}

template <typename R>
inline bool set_secs(shcore::Dictionary_t dict, const std::string &prop,
                     const R &row, const std::string &field) {
  if (row.has_field(field)) {
    if (row.is_null(field)) {
      (*dict)[prop] = Value::Null();
    } else {
      (*dict)[prop] = Value(row.get_uint(field) / 1000000.0);
    }
    return true;
  }
  return false;
}

template <typename R>
inline bool set_string(shcore::Dictionary_t dict, const std::string &prop,
                       const R &row, const std::string &field) {
  if (row.has_field(field)) {
    if (row.is_null(field))
      (*dict)[prop] = Value::Null();
    else
      (*dict)[prop] = Value(row.get_string(field));
    return true;
  }
  return false;
}

template <typename R>
inline bool set_ts(shcore::Dictionary_t dict, const std::string &prop,
                   const R &row, const std::string &field) {
  if (row.has_field(field)) {
    if (row.is_null(field)) {
      (*dict)[prop] = Value::Null();
    } else {
      std::string ts = row.get_string(field);
      if (shcore::str_beginswith(ts, "0000-00-00 00:00:00"))
        (*dict)[prop] = Value("");
      else
        (*dict)[prop] = Value(ts);
    }
    return true;
  }
  return false;
}

}  // namespace

// Status of a member of a group
class Group_member_status {
 public:
  Group_member_status() { m_data = make_dict(); }

  void set_instance(mysqlshdk::mysql::Instance *instance) {
    m_instance = instance;
  }

  void set_connect_error(const std::string &err) {
    (*m_data)["shellConnectError"] = Value(err);
  }

  void feed_member_info(const mysqlshdk::gr::Member &member, bool extended,
                        bool no_quorum) {
    (*m_data)["readReplicas"] = Value(make_dict());

    if (extended) (*m_data)["memberId"] = Value(member.uuid);

    (*m_data)["status"] = Value(mysqlshdk::gr::to_string(member.state));
    if (member.state != mysqlshdk::gr::Member_state::ONLINE) {
      (*m_data)["mode"] = Value("n/a");
    } else {
      (*m_data)["mode"] =
          Value(member.role == mysqlshdk::gr::Member_role::PRIMARY && !no_quorum
                    ? "R/W"
                    : "R/O");
    }
  }

  void feed_member_stats(shcore::Dictionary_t dict,
                         const mysqlshdk::db::Row_by_name &stats) {
    set_uint(dict, "inQueueCount", stats, "COUNT_TRANSACTIONS_IN_QUEUE");
    set_uint(dict, "checkedCount", stats, "COUNT_TRANSACTIONS_CHECKED");
    set_uint(dict, "conflictsDetectedCount", stats, "COUNT_CONFLICTS_DETECTED");
    set_string(dict, "committedAllMembers", stats,
               "TRANSACTIONS_COMMITTED_ALL_MEMBERS");
    set_string(dict, "lastConflictFree", stats,
               "LAST_CONFLICT_FREE_TRANSACTION");
    set_uint(dict, "inApplierQueueCount", stats,
             "COUNT_TRANSACTIONS_REMOTE_IN_APPLIER_QUEUE");
    set_uint(dict, "appliedCount", stats, "COUNT_TRANSACTIONS_REMOTE_APPLIED");
    set_uint(dict, "proposedCount", stats, "COUNT_TRANSACTIONS_LOCAL_PROPOSED");
    set_uint(dict, "rollbackCount", stats, "COUNT_TRANSACTIONS_LOCAL_ROLLBACK");
  }

  void feed_metadata_info(const ReplicaSet::Instance_info &info) {
    (*m_data)["address"] = Value(info.classic_endpoint);
    (*m_data)["role"] = Value(info.role);
  }

  void collect_local_status(bool recovering) {
    using mysqlshdk::utils::Version;

    auto session = m_instance->get_session();
    auto version = m_instance->get_version();

    shcore::Dictionary_t recovery_node = shcore::make_dict();
    shcore::Dictionary_t applier_node = shcore::make_dict();
    shcore::Array_t recovery_workers = shcore::make_array();
    shcore::Array_t applier_workers = shcore::make_array();

#define TSDIFF(prefix, start, end) \
  "TIMESTAMPDIFF(MICROSECOND, " prefix "_" start ", " prefix "_" end ")"

#define TSDIFF_NOW(prefix, start) \
  "TIMESTAMPDIFF(MICROSECOND, " prefix "_" start ", NOW(6))"

    std::string sql;

    sql = "SELECT *";

    if (version >= Version(8, 0, 0)) {
      sql += ",";

      sql += TSDIFF("LAST_APPLIED_TRANSACTION", "ORIGINAL_COMMIT_TIMESTAMP",
                    "END_APPLY_TIMESTAMP");
      sql += " AS LAST_ORIGINAL_COMMIT_TO_END_APPLY_TIME,";
      sql += TSDIFF("LAST_APPLIED_TRANSACTION", "IMMEDIATE_COMMIT_TIMESTAMP",
                    "END_APPLY_TIMESTAMP");
      sql += " AS LAST_IMMEDIATE_COMMIT_TO_END_APPLY_TIME,";
      sql += TSDIFF("LAST_APPLIED_TRANSACTION", "START_APPLY_TIMESTAMP",
                    "END_APPLY_TIMESTAMP");
      sql += " AS LAST_APPLY_TIME,";

      sql += TSDIFF_NOW("APPLYING_TRANSACTION", "ORIGINAL_COMMIT_TIMESTAMP");
      sql += " AS CURRENT_ORIGINAL_COMMIT_TO_NOW_TIME,";
      sql += TSDIFF_NOW("APPLYING_TRANSACTION", "IMMEDIATE_COMMIT_TIMESTAMP");
      sql += " AS CURRENT_IMMEDIATE_COMMIT_TO_NOW_TIME";
    }
    sql += " FROM performance_schema.replication_applier_status_by_worker";

    // this can return multiple rows per channel for
    // multi-threaded applier, otherwise just one. If MT, we also
    // get stuff in the coordinator table
    auto result = session->query(sql);
    auto row = result->fetch_one_named();
    while (row) {
      std::string channel_name = row.get_string("CHANNEL_NAME");
      if (channel_name == "group_replication_recovery") {
        recovery_workers->push_back(applier_status(row));
      }
      if (channel_name == "group_replication_applier" &&
          row.get_string("SERVICE_STATE") != "OFF") {
        applier_workers->push_back(applier_status(row));
      }
      row = result->fetch_one_named();
    }

    sql = "SELECT *";
    if (version >= Version(8, 0, 0)) {
      sql += ",";
      sql += TSDIFF("LAST_PROCESSED_TRANSACTION", "ORIGINAL_COMMIT_TIMESTAMP",
                    "END_BUFFER_TIMESTAMP");
      sql += " AS LAST_ORIGINAL_COMMIT_TO_END_BUFFER_TIME,";
      sql += TSDIFF("LAST_PROCESSED_TRANSACTION", "IMMEDIATE_COMMIT_TIMESTAMP",
                    "END_BUFFER_TIMESTAMP");
      sql += " AS LAST_IMMEDIATE_COMMIT_TO_END_BUFFER_TIME,";
      sql += TSDIFF("LAST_PROCESSED_TRANSACTION", "START_BUFFER_TIMESTAMP",
                    "END_BUFFER_TIMESTAMP");
      sql += " AS LAST_BUFFER_TIME,";

      sql += TSDIFF_NOW("PROCESSING_TRANSACTION", "ORIGINAL_COMMIT_TIMESTAMP");
      sql += " AS CURRENT_ORIGINAL_COMMIT_TO_NOW_TIME,";
      sql += TSDIFF_NOW("PROCESSING_TRANSACTION", "IMMEDIATE_COMMIT_TIMESTAMP");
      sql += " AS CURRENT_IMMEDIATE_COMMIT_TO_NOW_TIME";
    }
    sql += " FROM performance_schema.replication_applier_status_by_coordinator";
    result = session->query(sql);
    row = result->fetch_one_named();
    while (row) {
      std::string channel_name = row.get_string("CHANNEL_NAME");
      if (channel_name == "group_replication_recovery") {
        (*recovery_node)["coordinator"] = coordinator_status(row);
      }
      if (channel_name == "group_replication_applier" &&
          row.get_string("SERVICE_STATE") != "OFF") {
        (*applier_node)["coordinator"] = coordinator_status(row);
      }
      row = result->fetch_one_named();
    }

    sql = "SELECT *";
    if (version >= Version(8, 0, 0)) {
      sql += ",";
      sql += TSDIFF("LAST_QUEUED_TRANSACTION", "ORIGINAL_COMMIT_TIMESTAMP",
                    "END_QUEUE_TIMESTAMP");
      sql += " AS LAST_ORIGINAL_COMMIT_TO_END_QUEUE_TIME,";
      sql += TSDIFF("LAST_QUEUED_TRANSACTION", "IMMEDIATE_COMMIT_TIMESTAMP",
                    "END_QUEUE_TIMESTAMP");
      sql += " AS LAST_IMMEDIATE_COMMIT_TO_END_QUEUE_TIME,";
      sql += TSDIFF("LAST_QUEUED_TRANSACTION", "START_QUEUE_TIMESTAMP",
                    "END_QUEUE_TIMESTAMP");
      sql += " AS LAST_QUEUE_TIME,";

      sql += TSDIFF_NOW("QUEUEING_TRANSACTION", "ORIGINAL_COMMIT_TIMESTAMP");
      sql += " AS CURRENT_ORIGINAL_COMMIT_TO_NOW_TIME,";
      sql += TSDIFF_NOW("QUEUEING_TRANSACTION", "IMMEDIATE_COMMIT_TIMESTAMP");
      sql += " AS CURRENT_IMMEDIATE_COMMIT_TO_NOW_TIME";
    }
    sql += " FROM performance_schema.replication_connection_status";
    result = session->query(sql);
    row = result->fetch_one_named();
    while (row) {
      std::string channel_name = row.get_string("CHANNEL_NAME");
      if (channel_name == "group_replication_recovery") {
        (*recovery_node)["connection"] = connection_status(row);
      }
      if (channel_name == "group_replication_applier" &&
          row.get_string("SERVICE_STATE") != "OFF") {
        (*applier_node)["connection"] = connection_status(row);
      }
      row = result->fetch_one_named();
    }

    if (!applier_workers->empty())
      (*applier_node)["workers"] = Value(applier_workers);
    if (!recovery_workers->empty() && recovering)
      (*recovery_node)["workers"] = Value(recovery_workers);

    if (!applier_node->empty()) (*m_data)["transactions"] = Value(applier_node);
    if (!recovery_node->empty() && recovering)
      (*m_data)["recovery"] = Value(recovery_node);
  }

  shcore::Dictionary_t as_json() const { return m_data; }

 private:
  mysqlshdk::mysql::Instance *m_instance;
  shcore::Dictionary_t m_data;

  static void collect_last_error(shcore::Dictionary_t dict,
                                 const mysqlshdk::db::Row_ref_by_name &row,
                                 const std::string &prefix = "LAST_",
                                 const std::string &key_prefix = "last") {
    if (row.has_field(prefix + "ERROR_NUMBER") &&
        row.get_uint(prefix + "ERROR_NUMBER") != 0) {
      set_uint(dict, key_prefix + "Errno", row, prefix + "ERROR_NUMBER");
      set_string(dict, key_prefix + "Error", row, prefix + "ERROR_MESSAGE");
      set_ts(dict, key_prefix + "ErrorTimestamp", row,
             prefix + "ERROR_TIMESTAMP");
    }
  }

  static Value collect_last(const mysqlshdk::db::Row_ref_by_name &row,
                            const std::string &prefix,
                            const std::string &what) {
    shcore::Dictionary_t tx = shcore::make_dict();

    set_string(tx, "transaction", row, prefix + "_TRANSACTION");
    set_ts(tx, "originalCommitTimestamp", row,
           prefix + "_TRANSACTION_ORIGINAL_COMMIT_TIMESTAMP");

    set_ts(tx, "immediateCommitTimestamp", row,
           prefix + "_TRANSACTION_IMMEDIATE_COMMIT_TIMESTAMP");
    set_ts(tx, "startTimestamp", row,
           prefix + "_TRANSACTION_START_" + what + "_TIMESTAMP");
    set_ts(tx, "endTimestamp", row,
           prefix + "_TRANSACTION_END_" + what + "_TIMESTAMP");

    set_secs(tx, "originalCommitToEndTime", row,
             "LAST_ORIGINAL_COMMIT_TO_END_" + what + "_TIME");
    set_secs(tx, "immediateCommitToEndTime", row,
             "LAST_IMMEDIATE_COMMIT_TO_END_" + what + "_TIME");
    set_secs(tx, shcore::str_lower(what) + "Time", row,
             "LAST_" + what + "_TIME");

    set_uint(tx, "retries", row, prefix + "_TRANSACTION_RETRIES_COUNT");

    collect_last_error(tx, row, prefix + "_TRANSACTION_LAST_TRANSIENT_",
                       "lastTransient");
    return Value(tx);
  }

  static Value collect_current(const mysqlshdk::db::Row_ref_by_name &row,
                               const std::string &prefix,
                               const std::string &what) {
    if (row.has_field(prefix + "_TRANSACTION")) {
      std::string gtid = row.get_string(prefix + "_TRANSACTION");
      if (!gtid.empty()) {
        shcore::Dictionary_t tx = shcore::make_dict();
        (*tx)["transaction"] = Value(gtid);
        set_ts(tx, "originalCommitTimestamp", row,
               prefix + "_TRANSACTION_ORIGINAL_COMMIT_TIMESTAMP");
        set_ts(tx, "immediateCommitTimestamp", row,
               prefix + "_TRANSACTION_IMMEDIATE_COMMIT_TIMESTAMP");
        set_ts(tx, "startTimestamp", row,
               prefix + "_TRANSACTION_START_" + what + "_TIMESTAMP");

        set_secs(tx, "originalCommitToNowTime", row,
                 "CURRENT_ORIGINAL_COMMIT_TO_NOW_TIME");
        set_secs(tx, "immediateCommitToNowTime", row,
                 "CURRENT_IMMEDIATE_COMMIT_TO_NOW_TIME");

        set_uint(tx, "retries", row, prefix + "_TRANSACTION_RETRIES_COUNT");

        collect_last_error(tx, row, prefix + "_TRANSACTION_LAST_TRANSIENT_",
                           "lastTransient");
        return Value(tx);
      }
    }
    return Value();
  }

  Value connection_status(const mysqlshdk::db::Row_ref_by_name &row) {
    shcore::Dictionary_t dict = shcore::make_dict();

    // lookup label of the server
    // (*dict)["source"] = string_from_row(("SOURCE_UUID"));
    set_uint(dict, "threadId", row, "THREAD_ID");

    set_string(dict, "receivedTransactionSet", row, "RECEIVED_TRANSACTION_SET");

    collect_last_error(dict, row);

    set_ts(dict, "lastHeartbeatTimestamp", row, "LAST_HEARTBEAT_TIMESTAMP");
    set_uint(dict, "receivedHeartbeats", row, "COUNT_RECEIVED_HEARTBEATS");

    auto last = collect_last(row, "LAST_QUEUED", "QUEUE");
    if (!last.as_map()->empty()) (*dict)["lastQueued"] = Value(last);

    if (auto v = collect_current(row, "QUEUEING", "QUEUE"))
      (*dict)["currentlyQueueing"] = v;

    return Value(dict);
  }

  Value coordinator_status(const mysqlshdk::db::Row_ref_by_name &row) {
    shcore::Dictionary_t dict = shcore::make_dict();

    set_uint(dict, "threadId", row, "THREAD_ID");

    collect_last_error(dict, row);

    auto last = collect_last(row, "LAST_PROCESSED", "BUFFER");
    if (!last.as_map()->empty()) (*dict)["lastProcessed"] = Value(last);

    if (auto v = collect_current(row, "PROCESSING", "BUFFER"))
      (*dict)["currentlyProcessing"] = v;

    return Value(dict);
  }

  Value applier_status(const mysqlshdk::db::Row_ref_by_name &row) {
    shcore::Dictionary_t dict = shcore::make_dict();
    set_uint(dict, "threadId", row, "THREAD_ID");

    collect_last_error(dict, row);

    auto last = collect_last(row, "LAST_APPLIED", "APPLY");
    if (!last.as_map()->empty()) (*dict)["lastApplied"] = Value(last);

    set_string(dict, "lastSeen", row, "LAST_SEEN_TRANSACTION");

    if (auto v = collect_current(row, "APPLYING", "APPLY"))
      (*dict)["currentlyApplying"] = v;

    return Value(dict);
  }
};

// Status of the group
class Group_status {
 public:
  Group_status(const std::shared_ptr<ReplicaSet> &replicaset)
      : m_replicaset(replicaset) {
    m_data = make_dict();

    m_instances = m_replicaset->get_instances();
  }

  void set_master_session(
      const std::shared_ptr<mysqlshdk::db::ISession> &master_session) {
    m_master_session = master_session;
  }

  void collect_status(bool query_members, bool extended) {
    auto group_session = m_replicaset->get_cluster()->get_group_session();

    if (query_members) {
      connect_to_members();
    }

    // Get the primary UUID value to determine GR mode:
    // UUID (not empty) -> single-primary or "" (empty) -> multi-primary
    std::string gr_primary_uuid =
        mysqlshdk::gr::get_group_primary_uuid(group_session, nullptr);

    std::string topology_mode =
        !gr_primary_uuid.empty()
            ? mysqlshdk::gr::to_string(
                  mysqlshdk::gr::Topology_mode::SINGLE_PRIMARY)
            : mysqlshdk::gr::to_string(
                  mysqlshdk::gr::Topology_mode::MULTI_PRIMARY);

    (*m_data)["name"] = Value(m_replicaset->get_name());
    (*m_data)["topologyMode"] = shcore::Value(topology_mode);

    if (extended)
      (*m_data)["groupName"] = Value(m_replicaset->get_group_name());

    mysqlshdk::mysql::Instance group_instance(group_session);

    auto ssl_mode = group_instance.get_sysvar_string(
        "group_replication_ssl_mode", mysqlshdk::mysql::Var_qualifier::GLOBAL);
    if (ssl_mode)
      (*m_data)["ssl"] = Value(*ssl_mode);
    else
      (*m_data)["ssl"] = Value::Null();

    bool single_primary;
    std::vector<mysqlshdk::gr::Member> member_info(
        mysqlshdk::gr::get_members(group_instance, &single_primary));

    check_group_status(group_instance, member_info);

    bool has_primary = false;
    mysqlshdk::mysql::Instance primary_instance;
    {
      if (single_primary) {
        // In single primary mode we need to add the "primary" field
        (*m_data)["primary"] = Value("?");
        for (const auto &member : member_info) {
          if (member.role == mysqlshdk::gr::Member_role::PRIMARY) {
            const ReplicaSet::Instance_info *primary =
                instance_with_uuid(member.uuid);
            if (primary) {
              auto s = m_member_sessions.find(primary->classic_endpoint);
              if (s != m_member_sessions.end()) {
                has_primary = true;
                primary_instance = mysqlshdk::mysql::Instance(s->second);
              }
              (*m_data)["primary"] = Value(primary->classic_endpoint);
            }
            break;
          }
        }
      }
    }

    (*m_data)["topology"] = Value(
        get_topology(member_info, has_primary ? &primary_instance : nullptr,
                     query_members, extended));
  }

  shcore::Dictionary_t as_json() { return m_data; }

 private:
  std::shared_ptr<ReplicaSet> m_replicaset;
  std::vector<ReplicaSet::Instance_info> m_instances;
  std::map<std::string, std::shared_ptr<mysqlshdk::db::ISession>>
      m_member_sessions;
  std::map<std::string, std::string> m_member_connect_errors;
  std::shared_ptr<mysqlshdk::db::ISession> m_master_session;
  shcore::Dictionary_t m_data;
  bool m_no_quorum = false;

  void connect_to_members() {
    auto group_session = m_replicaset->get_cluster()->get_group_session();

    mysqlshdk::db::Connection_options group_session_copts(
        group_session->get_connection_options());

    for (const auto &inst : m_instances) {
      mysqlshdk::db::Connection_options opts(inst.classic_endpoint);
      if (opts.uri_endpoint() == group_session_copts.uri_endpoint()) {
        m_member_sessions[inst.classic_endpoint] = group_session;
      } else {
        opts.set_login_options_from(group_session_copts);

        try {
          m_member_sessions[inst.classic_endpoint] =
              mysqlshdk::db::mysql::open_session(opts);
        } catch (mysqlshdk::db::Error &e) {
          m_member_connect_errors[inst.classic_endpoint] = e.format();
        }
      }
    }
  }

  shcore::Dictionary_t get_topology(
      const std::vector<mysqlshdk::gr::Member> &member_info,
      const mysqlshdk::mysql::Instance *primary_instance, bool query_members,
      bool extended) {
    Member_stats_map member_stats = query_member_stats();

    shcore::Dictionary_t dict = make_dict();

    auto get_member = [&member_info](const std::string &uuid) {
      for (const auto &m : member_info) {
        if (m.uuid == uuid) return m;
      }
      return mysqlshdk::gr::Member();
    };

    for (const auto &inst : m_instances) {
      Group_member_status member;
      mysqlshdk::gr::Member minfo(get_member(inst.uuid));

      if (query_members) {
        mysqlshdk::mysql::Instance instance(
            m_member_sessions[inst.classic_endpoint]);

        if (instance.get_session()) {
          member.set_instance(&instance);

          member.collect_local_status(minfo.state ==
                                      mysqlshdk::gr::Member_state::RECOVERING);
        } else {
          member.set_connect_error(
              m_member_connect_errors[inst.classic_endpoint]);
        }
      }

      member.feed_metadata_info(inst);
      member.feed_member_info(minfo, extended, m_no_quorum);

      if (extended && member_stats.find(inst.uuid) != member_stats.end()) {
        shcore::Dictionary_t mdict = member.as_json();

        auto dict_for = [mdict](const std::string &key) {
          if (mdict->has_key(key)) {
            return mdict->get_map(key);
          } else {
            shcore::Dictionary_t dict = shcore::make_dict();
            (*mdict)[key] = Value(dict);
            return dict;
          }
        };

        if (member_stats[inst.uuid].first) {
          member.feed_member_stats(dict_for("recovery"),
                                   member_stats[inst.uuid].first);
        }
        if (member_stats[inst.uuid].second) {
          member.feed_member_stats(dict_for("transactions"),
                                   member_stats[inst.uuid].second);
        }
      }

      (*dict)[inst.name] = Value(member.as_json());
    }

    return dict;
  }

  void check_group_status(const mysqlshdk::mysql::Instance &instance,
                          const std::vector<mysqlshdk::gr::Member> &members) {
    int unreachable_in_group;
    int total_in_group;
    bool has_quorum = mysqlshdk::gr::has_quorum(instance, &unreachable_in_group,
                                                &total_in_group);
    m_no_quorum = !has_quorum;

    // count inconsistencies in the group vs metadata
    int missing_from_group = 0;
    int missing_from_md = 0;

    for (const auto &inst : m_instances) {
      if (std::find_if(members.begin(), members.end(),
                       [&inst](const mysqlshdk::gr::Member &member) {
                         return member.uuid == inst.uuid;
                       }) == members.end()) {
        missing_from_group++;
      }
    }
    for (const auto &member : members) {
      if (std::find_if(
              m_instances.begin(), m_instances.end(),
              [&member](const mysqlshdk::innodbcluster::Instance_info &inst) {
                return member.uuid == inst.uuid;
              }) != m_instances.end()) {
        missing_from_md++;
      }
    }

    size_t online_count = total_in_group - unreachable_in_group;
    size_t number_of_failures_tolerated =
        online_count > 0 ? (online_count - 1) / 2 : 0;

    ReplicaSetStatus::Status rs_status;
    std::string desc_status;

    if (!has_quorum) {
      rs_status = ReplicaSetStatus::NO_QUORUM;
      desc_status = "Cluster has no quorum as visible from '" +
                    instance.descr() +
                    "' and cannot process write transactions.";
    } else {
      if (number_of_failures_tolerated == 0) {
        rs_status = ReplicaSetStatus::OK_NO_TOLERANCE;

        desc_status = "Cluster is NOT tolerant to any failures.";
      } else {
        if (missing_from_group + unreachable_in_group > 0)
          rs_status = ReplicaSetStatus::OK_PARTIAL;
        else
          rs_status = ReplicaSetStatus::OK;

        if (number_of_failures_tolerated == 1)
          desc_status = "Cluster is ONLINE and can tolerate up to ONE failure.";
        else
          desc_status = "Cluster is ONLINE and can tolerate up to " +
                        std::to_string(number_of_failures_tolerated) +
                        " failures.";
      }
    }

    if (m_instances.size() > online_count) {
      if (m_instances.size() - online_count == 1)
        desc_status.append(" 1 member is not active");
      else
        desc_status.append(" " +
                           std::to_string(m_instances.size() - online_count) +
                           " members are not active");
    }

    (*m_data)["statusText"] = shcore::Value(desc_status);
    (*m_data)["status"] = shcore::Value(ReplicaSetStatus::describe(rs_status));
  }

  // member_id -> (recovery, applier)
  using Member_stats_map =
      std::map<std::string, std::pair<mysqlshdk::db::Row_by_name,
                                      mysqlshdk::db::Row_by_name>>;

  Member_stats_map query_member_stats() {
    Member_stats_map stats;
    auto group_session = m_replicaset->get_cluster()->get_group_session();

    auto member_stats = group_session->query(
        "SELECT * FROM performance_schema.replication_group_member_stats");

    while (auto row = member_stats->fetch_one_named()) {
      std::string channel = row.get_string("CHANNEL_NAME");
      if (channel == "group_replication_applier")
        stats[row.get_string("MEMBER_ID")].second =
            mysqlshdk::db::Row_by_name(row);
      else if (channel == "group_replication_recovery")
        stats[row.get_string("MEMBER_ID")].first =
            mysqlshdk::db::Row_by_name(row);
    }

    return stats;
  }

  const ReplicaSet::Instance_info *instance_with_uuid(const std::string &uuid) {
    for (const auto &i : m_instances) {
      if (i.uuid == uuid) return &i;
    }
    return nullptr;
  }
};

/** Gather information about the cluster into a JSON object.
 *
 * @param cluster - the cluster object to gather information for
 * @param query_members - if true, will connect to each member of the group
 *    to collect more information. Implies extended = true.
 * @param extended - if true, include additional information about the group
 * @returns a dictionary object with the information collected
 */
shcore::Dictionary_t cluster_status(Cluster *cluster, bool query_members,
                                    bool extended) {
  mysqlshdk::mysql::Instance target_instance(cluster->get_group_session());

  shcore::Dictionary_t dict = make_dict();

  (*dict)["clusterName"] = Value(cluster->get_name());

  cluster->get_default_replicaset()->sanity_check();

  {
    Group_status group(cluster->get_default_replicaset());
    group.collect_status(query_members, extended);

    (*dict)["defaultReplicaSet"] = Value(group.as_json());
  }

  std::string addr = target_instance.get_canonical_hostname();
  addr += ":";
  addr += std::to_string(target_instance.get_canonical_port());
  (*dict)["groupInformationSourceMember"] = Value(addr);

  // metadata server, if its a different one
  if (cluster->metadata()->get_session() != cluster->get_group_session()) {
    auto mdsession = cluster->metadata()->get_session();
    mysqlshdk::mysql::Instance md_instance(mdsession);
    (*dict)["metadataServer"] =
        Value(md_instance.get_canonical_hostname() + ":" +
              std::to_string(md_instance.get_canonical_port()));
  }

  return dict;
}

}  // namespace dba
}  // namespace mysqlsh
