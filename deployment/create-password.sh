#!/usr/bin/env bash
set -euo pipefail

if [[ "$#" -ne 1 ]]; then
  echo "Usage: $0 <username>" >&2
  exit 2
fi

username="$1"
if [[ -z "${username}" || "${username}" == *:* ]]; then
  echo "Username must be non-empty and must not contain a colon." >&2
  exit 2
fi

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
repository_dir=$(dirname "$script_dir")
secret_dir="$repository_dir/.secrets"
secret_file="$secret_dir/docs.htpasswd"
temporary_file="$secret_dir/docs.htpasswd.tmp.$$"

mkdir -p "$secret_dir"
umask 077
trap 'rm -f "$temporary_file"' EXIT

read -r -s -p "Password for ${username}: " password
printf '\n' >&2
read -r -s -p "Confirm password: " confirmation
printf '\n' >&2

if [[ -z "${password}" ]]; then
  echo "Password must not be empty." >&2
  exit 2
fi
if [[ "${password}" != "${confirmation}" ]]; then
  echo "Passwords do not match." >&2
  exit 2
fi
if [[ "${#password}" -gt 256 ]]; then
  echo "Password must be no more than 256 characters." >&2
  exit 2
fi

printf '%s\n' "${password}" \
  | docker run --rm -i httpd:2.4-alpine htpasswd -niB "${username}" > "$temporary_file"
unset password confirmation
mv "$temporary_file" "$secret_file"
chmod 600 "$secret_file"

echo "Created $secret_file for user ${username}"
