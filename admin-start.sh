#!/usr/bin/env bash
# MyAKTA172 Admin preview launcher. Cabang audit sahaja; aplikasi utama tidak berubah.
set -euo pipefail
cd "$(dirname "$0")"
port=8000
preview="http://127.0.0.1:${port}/admin-preview.html"
if ! curl --max-time 2 -fsS "$preview" >/dev/null 2>&1; then
  nohup python3 -m http.server "$port" --bind 0.0.0.0 >/tmp/myakta172-admin-preview.log 2>&1 </dev/null &
  for _ in {1..20}; do
    if curl --max-time 2 -fsS "$preview" >/dev/null 2>&1; then break; fi
    sleep .25
  done
fi
if ! curl --max-time 2 -fsS "$preview" >/dev/null 2>&1; then
  echo "Port 8000 tidak boleh digunakan. Semak tab PORTS atau /tmp/myakta172-admin-preview.log"
  exit 1
fi
url="http://localhost:${port}/admin-preview.html"
if [[ -n "${CODESPACE_NAME:-}" ]]; then
  url="https://${CODESPACE_NAME}-${port}.app.github.dev/admin-preview.html"
fi
printf '\nDashboard Admin MyAKTA172 sedia dibuka.\nKlik pautan ini (tidak perlu taip nama fail):\n%s\n\n' "$url"
if [[ -n "${CODESPACE_NAME:-}" ]] && command -v code >/dev/null 2>&1; then
  # Codespaces/VS Code Remote mungkin menyokong openExternal. Jika tidak, pautan di atas tetap tersedia.
  (code --openExternal "$url" >/dev/null 2>&1 || true) &
fi
