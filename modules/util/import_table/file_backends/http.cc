/*
 * Copyright (c) 2019, Oracle and/or its affiliates. All rights reserved.
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

#include "modules/util/import_table/file_backends/http.h"

#include <algorithm>
#include "mysqlshdk/libs/rest/rest_service.h"
#include "mysqlshdk/libs/utils/utils_file.h"
#include "mysqlshdk/libs/utils/utils_general.h"
#include "mysqlshdk/libs/utils/utils_path.h"
#include "mysqlshdk/libs/utils/utils_string.h"

using Rest_service = mysqlshdk::rest::Rest_service;
using Headers = mysqlshdk::rest::Headers;
using Response = mysqlshdk::rest::Response;

namespace mysqlsh {
namespace import_table {

Http_get::Http_get(const std::string &uri) : m_uri(uri) {
  m_rest = std::make_unique<Rest_service>(m_uri, true);
  m_rest->set_timeout(30000);  // todo(kg): default 2s was not enough, 30s is
                               // ok? maybe we could make it configurable
  auto response = m_rest->head(std::string{});
  if (response.status == Response::Status_code::OK) {
    m_file_size = std::stoul(response.headers["content-length"]);
    m_open_status_code = response.status;
    if (response.headers["Accept-Ranges"] != "bytes") {
      throw std::runtime_error(
          "Target server does not support partial requests.");
    }
  } else {
    throw std::runtime_error(Response::status_code(response.status));
  }
}

void Http_get::open() { m_offset = 0; }

bool Http_get::is_open() {
  return m_open_status_code == Response::Status_code::OK;
}

void Http_get::close() {}

size_t Http_get::file_size() { return m_file_size; }

std::string Http_get::file_name() { return m_uri; }

off64_t Http_get::seek(off64_t offset) {
  const off64_t fsize = file_size();
  m_offset = std::min(offset, fsize);
  return m_offset;
}

ssize_t Http_get::read(void *buffer, size_t length) {
  if (!(length > 0)) return 0;
  const off64_t fsize = file_size();
  if (m_offset >= fsize) return 0;

  const size_t first = m_offset;
  const size_t last_unbounded = m_offset + length - 1;
  // http range request is both sides inclusive
  const size_t last = std::min(file_size() - 1, last_unbounded);
  const std::string range =
      "bytes=" + std::to_string(first) + "-" + std::to_string(last);
  Headers h{{"range", range}};

  auto response = m_rest->get(std::string{}, h);
  if (Response::Status_code::PARTIAL_CONTENT == response.status) {
    const auto &content = response.body.get_string();
    std::copy(content.data(), content.data() + content.size(),
              reinterpret_cast<uint8_t *>(buffer));
    m_offset += content.size();
    return content.size();
  } else if (Response::Status_code::OK == response.status) {
    throw std::runtime_error("Range requests are not supported.");
  } else if (Response::Status_code::RANGE_NOT_SATISFIABLE == response.status) {
    throw std::runtime_error("Range request " + std::to_string(first) + "-" +
                             std::to_string(last) + " is out of bounds.");
  }
  return 0;
}

}  // namespace import_table
}  // namespace mysqlsh
