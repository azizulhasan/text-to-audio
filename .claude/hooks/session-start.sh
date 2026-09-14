#!/bin/bash
# SessionStart hook — prepares Claude Code on the web sessions for this plugin.
#   1. npm toolchain (Laravel Mix, gulp, @wordpress/scripts) for the dashboard,
#      block and player bundles.
#   2. WP-CLI, which the translation pipeline shells out to (npm run makepot).
set -euo pipefail

# Local machines have their own setup; only run in remote sessions.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}"

echo "[session-start] node $(node -v), npm $(npm -v), $(php -r 'echo "php " . PHP_VERSION;')"

# npm install (not ci) so the cached container layer is reused across sessions.
echo "[session-start] installing npm dependencies..."
npm install --no-audit --no-fund

# Composer has no runtime requires — vendor/ (the PSR-4 autoloader) is committed —
# so there is nothing to install, just confirm class loading will work.
if [ ! -f vendor/autoload.php ]; then
  echo "[session-start] WARNING: vendor/autoload.php missing; PSR-4 autoload will fail." >&2
fi

# WP-CLI: "npm run makepot" / "npm run i18n:sync" call `wp i18n make-pot`.
# The container runs as root, so the shim forces WP_CLI_ALLOW_ROOT.
if ! command -v wp >/dev/null 2>&1; then
  echo "[session-start] installing WP-CLI..."
  if curl -fsSL -o /usr/local/bin/wp-cli.phar \
      https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar; then
    cat > /usr/local/bin/wp <<'SHIM'
#!/bin/bash
export WP_CLI_ALLOW_ROOT=1
exec php /usr/local/bin/wp-cli.phar "$@"
SHIM
    chmod +x /usr/local/bin/wp
  else
    echo "[session-start] WARNING: WP-CLI download failed; 'npm run makepot' will not work." >&2
  fi
fi

echo "[session-start] done."
