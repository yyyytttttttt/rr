name: Security Scan

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  security:
    runs-on: ubuntu-latest
    timeout-minutes: 15

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Dependency audit (fail on high/critical)
        run: npm audit --audit-level=high

      # Надёжнее, чем `npx eslint .` (избегаем конфликтов ESLint flat/next-config)
      - name: Lint (Next)
        run: ./node_modules/.bin/next lint --max-warnings 0

      - name: IOC scan (crypto-miners, install hooks)
        run: node scripts/ioc-scan.js

      # Сканим ВСЕ tracked файлы, а не только diff (diff ломается на первом коммите / merge)
      - name: Secret grep (fail on hardcoded secrets)
        run: |
          set -e
          FILES="$(git ls-files | grep -Ev '(^\.env($|\.|/)|node_modules/|\.next/|dist/|build/)' | grep -E '\.(ts|js|json|mjs|yml|yaml)$' || true)"
          if [ -z "$FILES" ]; then
            echo "No files to scan."
            exit 0
          fi

          echo "$FILES" | xargs -I{} grep -nHIE \
            'AKIA[0-9A-Z]{16}|-----BEGIN (RSA|EC|PGP) PRIVATE|your-secret-key|password\s*=\s*["\x27][^"\x27]{8,}|NEXTAUTH_SECRET\s*=|DATABASE_URL\s*=|SMTP_PASS\s*=|CLOUDINARY_API_SECRET\s*=|STRIPE_(SECRET|WEBHOOK)_KEY\s*=|YOOKASSA_(SECRET|TOKEN)\s*=' \
            {} 2>/dev/null && \
            echo "SECRETS FOUND - fix before merge" && exit 1 || \
            echo "No secrets found"

      - name: TypeScript check
        run: ./node_modules/.bin/tsc -p tsconfig.json --noEmit --pretty false
