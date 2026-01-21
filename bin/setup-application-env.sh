#!/bin/bash
set -e

# Base Directory for the Test Environment
# Can be overridden by env var
TEST_ENV_ROOT="${WP_TEST_ENV_DIR:-/tmp/better-preview-plugin-tests}"

# Subdirectories
WP_CORE_DIR="$TEST_ENV_ROOT/wordpress"
WP_TESTS_DIR="$TEST_ENV_ROOT/wordpress-tests-lib"
DOLT_DIR="$TEST_ENV_ROOT/dolt"
DOLT_DATA_DIR="$TEST_ENV_ROOT/dolt_data"
DOLT_REPO_DIR="$DOLT_DATA_DIR/wordpress_test"
DOLT_BIN="$DOLT_DIR/bin/dolt"

# Database Config
DB_PORT=${DOLT_PORT:-3306}

# Paths relative to this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

echo "Setting up WordPress Test Environment in $TEST_ENV_ROOT..."

mkdir -p "$TEST_ENV_ROOT"

# 1. Install Dolt
if [ ! -f "$DOLT_BIN" ]; then
    echo "Installing Dolt binary to $DOLT_DIR..."
    bash "$SCRIPT_DIR/install-dolt.sh" -d "$DOLT_DIR"
else
    echo "Dolt binary found at $DOLT_BIN"
fi

# 2. Install WordPress Core
if [ ! -d "$WP_CORE_DIR" ]; then
    if [ -n "$WP_VERSION" ]; then
        echo "Downloading WordPress version $WP_VERSION..."
        WP_URL="https://wordpress.org/wordpress-$WP_VERSION.tar.gz"
    else
        echo "Downloading latest WordPress..."
        WP_URL="https://wordpress.org/latest.tar.gz"
    fi

    # Silence output for cleaner logs
    curl -sL "$WP_URL" | tar xz -C "$TEST_ENV_ROOT"
else
    echo "WordPress already installed in $WP_CORE_DIR"
fi

# 3. Install WordPress Test Library
if [ ! -d "$WP_TESTS_DIR" ]; then
    echo "Cloning WordPress Test Library..."
    mkdir -p "$WP_TESTS_DIR"
    cd "$WP_TESTS_DIR"
    git init -q
    git remote add origin https://github.com/WordPress/wordpress-develop.git
    git config core.sparseCheckout true
    echo "tests/phpunit/includes" >> .git/info/sparse-checkout
    echo "tests/phpunit/data" >> .git/info/sparse-checkout
    git pull --depth=1 origin trunk -q
    echo "Rearranging Test Library..."
    mv tests/phpunit/includes .
    mv tests/phpunit/data .
    rm -rf tests
    cd - > /dev/null
else
    echo "WordPress Test Library already installed."
fi

# 4. Initialize Dolt DB Repo
if [ ! -d "$DOLT_REPO_DIR" ]; then
    echo "Initializing Dolt Database in $DOLT_REPO_DIR..."
    mkdir -p "$DOLT_REPO_DIR"
    cd "$DOLT_REPO_DIR"
    "$DOLT_BIN" config --global --add user.email "test@example.com"
    "$DOLT_BIN" config --global --add user.name "Test User"

    "$DOLT_BIN" init
else
    echo "Dolt Database Repo already exists."
fi

# 5. Create wp-tests-config.php
CONFIG_FILE="$WP_TESTS_DIR/wp-tests-config.php"
# echo "Creating $CONFIG_FILE..."

cat > "$CONFIG_FILE" <<EOF
<?php
/* Path to the WordPress codebase you'd like to test. */
define( 'ABSPATH', '$WP_CORE_DIR/' );

define( 'WP_DEFAULT_THEME', 'default' );
define( 'WP_TESTS_FORCE_KNOWN_BUGS', false );
define( 'WP_TESTS_DOMAIN', 'example.org' );
define( 'WP_TESTS_EMAIL', 'admin@example.org' );
define( 'WP_TESTS_TITLE', 'Test Blog' );
define( 'WP_PHP_BINARY', 'php' );

/*
 * Database Configuration for Dolt
 */
define( 'DB_NAME', 'wordpress_test' );
define( 'DB_USER', 'root' );
define( 'DB_PASSWORD', '' );
define( 'DB_HOST', '127.0.0.1:$DB_PORT' );
define( 'DB_CHARSET', 'utf8' );
define( 'DB_COLLATE', '' );

\$table_prefix = 'wptests_';
EOF

echo "Environment setup complete in $TEST_ENV_ROOT"
