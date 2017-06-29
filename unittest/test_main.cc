/* Copyright (c) 2015, 2017, Oracle and/or its affiliates. All rights reserved.

   This program is free software; you can redistribute it and/or modify
   it under the terms of the GNU General Public License as published by
   the Free Software Foundation; version 2 of the License.

   This program is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU General Public License for more details.

   You should have received a copy of the GNU General Public License
   along with this program; if not, write to the Free Software
   Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA */

#ifdef HAVE_PYTHON
#include "mysqlshdk/include/scripting/python_utils.h"
#endif

#include <mysql.h>
#include <fstream>
#include <iostream>
#include <stdlib.h>

#include "unittest/gtest_clean.h"
#include "shellcore/shell_core_options.h"

extern "C" {
  const char *g_argv0 = nullptr;
}
char *g_mppath = nullptr;

static void check_zombie_sandboxes() {
  int port = 3306;
  if (getenv("MYSQL_PORT")) {
    port = atoi(getenv("MYSQL_PORT"));
  }
  int sport1, sport2, sport3;

  const char *sandbox_port1 = getenv("MYSQL_SANDBOX_PORT1");
  if (sandbox_port1) {
    sport1 = atoi(getenv("MYSQL_SANDBOX_PORT1"));
  } else {
    sport1 = port + 10;
  }
  const char *sandbox_port2 = getenv("MYSQL_SANDBOX_PORT2");
  if (sandbox_port2) {
    sport2 = atoi(getenv("MYSQL_SANDBOX_PORT2"));
  } else {
    sport2 = port + 20;
  }
  const char *sandbox_port3 = getenv("MYSQL_SANDBOX_PORT3");
  if (sandbox_port3) {
    sport3 = atoi(getenv("MYSQL_SANDBOX_PORT3"));
  } else {
    sport3 = port + 30;
  }

  bool have_zombies = false;

  MYSQL mysql;
  mysql_init(&mysql);
  unsigned int tcp = MYSQL_PROTOCOL_TCP;
  mysql_options(&mysql, MYSQL_OPT_PROTOCOL, &tcp);
  // if connect succeeds or error is a server error, then there's a server
  if (mysql_real_connect(&mysql, "localhost", "root", "", NULL, sport1, NULL,
                         0) ||
      mysql_errno(&mysql) < 2000 || mysql_errno(&mysql) >= 3000) {
    std::cout << mysql_error(&mysql) << "  " << mysql_errno(&mysql) <<"\n";
    std::cout << "Server already running on port " << sport1 << "\n";
    have_zombies = true;
  }
  mysql_init(&mysql);
  mysql_options(&mysql, MYSQL_OPT_PROTOCOL, &tcp);
  if (mysql_real_connect(&mysql, "localhost", "root", "", NULL, sport2, NULL,
                         0) ||
      mysql_errno(&mysql) < 2000 || mysql_errno(&mysql) >= 3000) {
    std::cout << mysql_error(&mysql) << "  " << mysql_errno(&mysql) <<"\n";
    std::cout << "Server already running on port " << sport2 << "\n";
    have_zombies = true;
  }
  mysql_init(&mysql);
  mysql_options(&mysql, MYSQL_OPT_PROTOCOL, &tcp);
  if (mysql_real_connect(&mysql, "localhost", "root", "", NULL, sport3, NULL,
                         0) ||
      mysql_errno(&mysql) < 2000 || mysql_errno(&mysql) >= 3000) {
    std::cout << mysql_error(&mysql) << "  " << mysql_errno(&mysql) <<"\n";
    std::cout << "Server already running on port " << sport3 << "\n";
    have_zombies = true;
  }

  if (have_zombies) {
    std::cout << "WARNING: mysqld running on port reserved for sandbox tests\n";
    std::cout << "Sandbox ports: " << sport1 << ", " << sport2 << ", " << sport3
              << "\n";
    std::cout << "If they're left from a previous run, terminate them first\n";
    std::cout << "Or setenv TEST_SKIP_ZOMBIE_CHECK to skip this check\n";
    std::cout << "Or setenv MYSQL_SANDBOX_PORT1..3 to pick different ports for "
                 "test sandboxes\n";
    exit(1);
  }
}


std::string g_mppath;

int main(int argc, char **argv) {
  g_argv0 = argv[0];
#ifdef HAVE_V8
  extern void JScript_context_init();

  JScript_context_init();
#endif

  if (!getenv("MYSQL_URI")) {
    std::cerr << "WARNING: The MYSQL_URI MYSQL_PWD and MYSQL_PORT environment variables are not set\n";
    std::cerr << "Note: MYSQL_URI must not contain the port number\n";
    std::cerr << "Note: Use MYSQL_PORT to define the MySQL protocol port (if != 3306)\n";
    std::cerr << "Note: Use MYSQLX_PORT to define the XProtocol port (if != 33060)\n";
    exit(1);
  }

  // Override the configuration home for tests, to not mess with custom data
#ifdef WIN32
  _putenv_s("MYSQLSH_USER_CONFIG_HOME", ".");
#else
  setenv("MYSQLSH_USER_CONFIG_HOME", ".", 1);
#endif
  ::testing::InitGoogleTest(&argc, argv);

  // Helper code for DBA specific groups of tests;
  std::string flags = ::testing::GTEST_FLAG(filter);
  //::testing::FLAGS_gtest_break_on_failure = true;
  if (!flags.empty()) {
    std::string new_flags;

    if (flags == "DBA")
      new_flags = "Shell_py_dba_tests.*:Shell_js_dba_tests.*";
    else if (flags == "DBAJS")
      new_flags = "Shell_js_dba_tests.*";
    else if (flags == "DBAPY")
      new_flags = "Shell_py_dba_tests.*";
    else if (flags == "DBAJSNIG")
      new_flags = "Shell_js_dba_tests.no_interactive_deploy*:Shell_js_dba_tests.no_interactive_classic_global*";
    else if (flags == "DBAPYNIG")
      new_flags = "Shell_py_dba_tests.no_interactive_deploy*:Shell_py_dba_tests.no_interactive_classic_global*";
    else if (flags == "DBAJSNIGDBA")
      new_flags = "Shell_js_dba_tests.no_interactive_deploy*:Shell_js_dba_tests.no_interactive_classic_global_dba";
    else if (flags == "DBAPYNIGDBA")
      new_flags = "Shell_py_dba_tests.no_interactive_deploy*:Shell_py_dba_tests.no_interactive_classic_global_dba";
    else if (flags == "DBAJSNIC")
      new_flags = "Shell_js_dba_tests.no_interactive_deploy*:Shell_js_dba_tests.no_interactive_classic_custom*";
    else if (flags == "DBAPYNIC")
      new_flags = "Shell_py_dba_tests.no_interactive_deploy*:Shell_py_dba_tests.no_interactive_classic_custom*";
    else if (flags == "DBAJSNICDBA")
      new_flags = "Shell_js_dba_tests.no_interactive_deploy*:Shell_js_dba_tests.no_interactive_classic_custom_dba";
    else if (flags == "DBAPYNICDBA")
      new_flags = "Shell_py_dba_tests.no_interactive_deploy*:Shell_py_dba_tests.no_interactive_classic_custom_dba";
    else if (flags == "DBAJSNI")
      new_flags = "Shell_js_dba_tests.no_interactive_deploy*:Shell_js_dba_tests.no_interactive_classic_*";
    else if (flags == "DBAPYNI")
      new_flags = "Shell_py_dba_tests.no_interactive_deploy*:Shell_py_dba_tests.no_interactive_classic_*";
    else if (flags == "DBAJSIG")
      new_flags = "Shell_js_dba_tests.no_interactive_deploy*:Shell_js_dba_tests.interactive_classic_global*";
    else if (flags == "DBAPYIG")
      new_flags = "Shell_py_dba_tests.no_interactive_deploy*:Shell_py_dba_tests.interactive_classic_global*";
    else if (flags == "DBAJSIGDBA")
      new_flags = "Shell_js_dba_tests.no_interactive_deploy*:Shell_js_dba_tests.interactive_classic_global_dba";
    else if (flags == "DBAPYIGDBA")
      new_flags = "Shell_py_dba_tests.no_interactive_deploy*:Shell_py_dba_tests.interactive_classic_global_dba";
    else if (flags == "DBAJSIC")
      new_flags = "Shell_js_dba_tests.no_interactive_deploy*:Shell_js_dba_tests.interactive_classic_custom*";
    else if (flags == "DBAPYIC")
      new_flags = "Shell_py_dba_tests.no_interactive_deploy*:Shell_py_dba_tests.interactive_classic_custom*";
    else if (flags == "DBAJSICDBA")
      new_flags = "Shell_js_dba_tests.no_interactive_deploy*:Shell_js_dba_tests.interactive_classic_custom_dba";
    else if (flags == "DBAPYICDBA")
      new_flags = "Shell_py_dba_tests.no_interactive_deploy*:Shell_py_dba_tests.interactive_classic_custom_dba";
    else if (flags == "DBAJSI")
      new_flags = "Shell_js_dba_tests.no_interactive_deploy*:Shell_js_dba_tests.interactive_classic_*";
    else if (flags == "DBAPYI")
      new_flags = "Shell_py_dba_tests.no_interactive_deploy*:Shell_py_dba_tests.interactive_classic_*";
    else if (flags == "ALLBUTDBA")
      new_flags = "*:-Shell_py_dba_tests.*:Shell_js_dba_tests.*";

    if (!new_flags.empty())
      ::testing::GTEST_FLAG(filter) = new_flags.c_str();
  }

  const char *generate_option = "--generate_test_groups=";
  if (argc > 1 && strncmp(argv[1], generate_option, strlen(generate_option)) == 0) {
    const char *path = strchr(argv[1], '=') + 1;
    std::ofstream f(path);

    std::cout << "Updating " << path << "...\n";
    f << "# Automatically generated, use make testgroups to update\n";

    ::testing::UnitTest *ut = ::testing::UnitTest::GetInstance();
    for (int i = 0; i < ut->total_test_case_count(); i++) {
      const char *name = ut->GetTestCase(i)->name();
      f << "add_test(" << name << " run_unit_tests --gtest_filter=" << name << ".*)\n";
    }
    return 0;
  }

  // Check for leftover sandbox servers
  if (!getenv("TEST_SKIP_ZOMBIE_CHECK")) {
    check_zombie_sandboxes();
  }

  std::string mppath;
  char *p = strrchr(argv[0], '/');
  if (p) {
    g_mppath = std::string(argv[0], p - argv[0]);
  } else {
    p = strrchr(argv[0], '\\');
    g_mppath = std::string(argv[0], p - argv[0]);
  }
#ifndef _WIN32
  // On linux, we need to tell the UTs where the mysqlprovision executable is
  g_mppath.append("/../mysqlprovision");
  (*shcore::Shell_core_options::get())[SHCORE_GADGETS_PATH] = shcore::Value(g_mppath);
#endif
  g_mppath = strdup(mppath.c_str());

  int ret_val = RUN_ALL_TESTS();

  return ret_val;
}
