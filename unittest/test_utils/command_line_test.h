/* Copyright (c) 2014, 2017, Oracle and/or its affiliates. All rights reserved.

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

#ifndef UNITTEST_TEST_UTILS_COMMAND_LINE_TEST_H_
#define UNITTEST_TEST_UTILS_COMMAND_LINE_TEST_H_

#include <string>
#include "unittest/test_utils/shell_base_test.h"
#include "mysqlshdk/libs/utils/process_launcher.h"

#define MY_EXPECT_CMD_OUTPUT_CONTAINS(e) Shell_base_test::check_string_expectation(e,_output,true)
#define MY_EXPECT_CMD_OUTPUT_NOT_CONTAINS(e) Shell_base_test::check_string_expectation(e,_output,false)

extern "C" const char *g_argv0;

namespace tests {

  class Command_line_test : public Shell_base_test {
  public:
    virtual void SetUp();

  protected:
    std::string _mysqlsh_path;
    const char* _mysqlsh;
    std::string get_path_to_mysqlsh();
    std::string _output;
    int execute(const std::vector<const char *> &args);
  };

}
#endif  // UNITTEST_TEST_UTILS_COMMAND_LINE_TEST_H_