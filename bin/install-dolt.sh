#!/bin/bash

# This script installs Dolt for Linux to be used in the test environment.
# It installs Dolt into the project's .dolt directory.
# Modified from https://github.com/dolthub/dolt/releases/download/v1.79.2/install.sh

if test -z "$BASH_VERSION"; then
  echo "Please run this script using bash." >&2
  exit 1
fi

set -euo pipefail

DOLT_VERSION='1.79.2'
RELEASES_BASE_URL="https://github.com/dolthub/dolt/releases/download/v$DOLT_VERSION"

# Directory setup
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
INSTALL_BASE_DIR="${DOLT_INSTALL_PATH:-$PROJECT_ROOT/.dolt}"

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -d|--dir)
      INSTALL_BASE_DIR="$2"
      shift # past argument
      shift # past value
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

INSTALL_BIN_DIR="$INSTALL_BASE_DIR/bin"

# Ensure Linux
if [ "$(uname)" != "Linux" ]; then
    echo "This script only supports Linux." >&2
    exit 1
fi

# Determine Architecture
ARCH="$(uname -m)"
if [ "$ARCH" == "x86_64" ]; then
    PLATFORM_TUPLE="linux-amd64"
elif [ "$ARCH" == "aarch64" ]; then
    PLATFORM_TUPLE="linux-arm64"
else
    echo "Unsupported architecture: $ARCH" >&2
    exit 1
fi

# Dependencies
for cmd in curl tar; do
    if ! command -v $cmd &> /dev/null; then
        echo "Missing dependency: $cmd" >&2
        exit 1
    fi
done

# Install
if [ -f "$INSTALL_BIN_DIR/dolt" ]; then
    echo "Dolt is already installed at $INSTALL_BIN_DIR/dolt"
    exit 0
fi

echo "Installing Dolt v$DOLT_VERSION..."
mkdir -p "$INSTALL_BIN_DIR"

FILE="dolt-$PLATFORM_TUPLE.tar.gz"
URL="$RELEASES_BASE_URL/$FILE"
TMP_DIR="$(mktemp -d)"

echo "Downloading $URL..."
curl -L -o "$TMP_DIR/$FILE" "$URL"
echo "Extracting..."
tar zxf "$TMP_DIR/$FILE" -C "$TMP_DIR"
install "$TMP_DIR/dolt-$PLATFORM_TUPLE/bin/dolt" "$INSTALL_BIN_DIR/dolt"

rm -rf "$TMP_DIR"

echo "Dolt installed to $INSTALL_BIN_DIR/dolt"
