#!/usr/bin/env sh
set -eu

if [ "$#" -ne 1 ]; then
  echo "Usage: $0 <username>" >&2
  exit 2
fi

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
repository_dir=$(dirname "$script_dir")
secret_dir="$repository_dir/.secrets"
secret_file="$secret_dir/docs.htpasswd"

mkdir -p "$secret_dir"
umask 077

docker run --rm -i httpd:2.4-alpine htpasswd -nB "$1" > "$secret_file"
chmod 600 "$secret_file"

echo "Created $secret_file for user $1"
