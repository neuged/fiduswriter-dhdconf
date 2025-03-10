#!/bin/bash

DIR="$(dirname $0)"
TARGET="static/assets/dhdconf.csljson"

set -e

"${DIR}/makejson.py" "${DIR}/dhdconf.csl" > "${DIR}/../${TARGET}"
echo "OK: ${TARGET}"
