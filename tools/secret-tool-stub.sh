#!/bin/sh
# secret-tool stub for the Tizen Studio 6.1 CLI, used by the tools image.
#
# Tizen Studio's `tizen security-profiles` stores and looks up profile
# passwords through tools/certificate-encryptor/secret-tool, a Go binary that
# needs a desktop keyring over D-Bus. The tools pod has no keyring, so the
# real binary fails and the CLI reports "CertificationException: Invaild
# password". The Dockerfile replaces that binary with this stub.
#
# The CLI calls it as:
#   secret-tool store  --label=... -p <pw> keyfile <dir>/author.pwd tool certificate-manager
#   secret-tool lookup --label=... keyfile <dir>/distributor.pwd tool certificate-manager
#
# `lookup` prints the password from the environment (no trailing newline):
# TIZEN_DISTRIBUTOR_PASSWORD when any argument mentions "distributor",
# otherwise TIZEN_AUTHOR_PASSWORD. Anything else (store) exits 0 silently,
# so nothing is persisted and no password is ever written to stdout or logs.

set -eu

[ "${1:-}" = lookup ] || exit 0

for arg in "$@"; do
  case $arg in
    *distributor*)
      printf '%s' "${TIZEN_DISTRIBUTOR_PASSWORD:-}"
      exit 0
      ;;
  esac
done

printf '%s' "${TIZEN_AUTHOR_PASSWORD:-}"
