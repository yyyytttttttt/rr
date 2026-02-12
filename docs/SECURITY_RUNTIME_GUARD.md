# Runtime Security Guard

## What to Monitor

| Signal | Threshold | Action |
|--------|-----------|--------|
| CPU usage | >80% sustained >5 min | Kill container, alert |
| Memory | >450 MB (limit 512 MB) | Alert, check OOM |
| Process count | >50 pids in container | Alert (pids_limit=100) |
| Outbound connections | New external IPs on port 3333/4444/14444 | Block + alert (stratum ports) |
| DNS queries | Queries to pool.* / *.mine.* domains | Block + alert |

## Container Hardening (active settings)

- `security_opt: no-new-privileges:true` — процесс не может повысить привилегии
- `read_only: true` + `tmpfs: /tmp` — запись только во временную ФС
- `pids_limit: 100` — форк-бомба / майнер не запустит тысячи воркеров
- `deploy.resources.limits: cpus=1.5, memory=512M` — майнер ограничен CPU/RAM
- `USER nextjs (uid 1001)` — non-root, нет доступа к системным файлам
- `cap_drop: ALL` — нет Linux capabilities

## Supply Chain Checks

```bash
# Run before every deploy:
node scripts/ioc-scan.js

# Audit dependencies:
npm audit --audit-level=high

# Check for unexpected install hooks:
cat package.json | grep -E '"(pre|post)install"'
```

## Server Checks (run on host)

```bash
# 1. Process/CPU anomalies
docker stats --no-stream
docker top <container_id> -eo pid,user,%cpu,%mem,comm

# 2. Network: check for miner stratum connections
ss -tnp | grep -E ':3333|:4444|:14444|:8080|:9090'
docker exec <container_id> sh -c 'ss -tnp 2>/dev/null || netstat -tnp'

# 3. Container security config
docker inspect <container_id> --format '{{json .HostConfig.SecurityOpt}}'
docker inspect <container_id> --format '{{json .HostConfig.CapDrop}}'
docker inspect <container_id> --format '{{json .HostConfig.ReadonlyRootfs}}'
docker inspect <container_id> --format '{{json .HostConfig.Binds}}'
# Must NOT show /var/run/docker.sock or host paths

# 4. Dokploy panel access
ss -tlnp | grep ':3000'
# If exposed on 0.0.0.0:3000 — restrict to 127.0.0.1 (SSH tunnel only)

# 5. Swarm ports (if using Docker Swarm)
ss -tlnp | grep -E ':2377|:7946|:4789'
# Must be firewalled from internet (allow only VPN/internal)

# 6. Docker socket protection
ls -la /var/run/docker.sock
# Must NOT be mounted into app container

# 7. IOC log check
docker logs <container_id> 2>&1 | grep -iE 'xmrig|stratum|mining|cryptonight|hashrate'

# 8. fail2ban status (if installed)
fail2ban-client status sshd 2>/dev/null || echo "fail2ban not installed — INSTALL IT"
```

## CI Checks (GitHub Actions / pre-deploy)

```bash
# Already in .github/workflows/security.yml:
npm audit --audit-level=high
node scripts/ioc-scan.js
npx tsc --noEmit --pretty false
grep -rn 'error\.message\|e\.message' src/app/api --include='*.ts' --include='*.js' && exit 1 || true
grep -rn 'throw error\|throw e\b' src/app/api --include='*.ts' --include='*.js' && exit 1 || true
```

## Dokploy / Swarm Hardening

1. **Dokploy panel**: NEVER expose port 3000 to internet. Access via SSH tunnel only:
   ```bash
   ssh -L 3000:127.0.0.1:3000 user@server
   # Then open http://localhost:3000 in browser
   ```
2. **Docker socket**: never mount into any application container
3. **Swarm ports**: firewall 2377/7946/4789 — allow only from trusted IPs
4. **SSH**: key-only auth, no root login, fail2ban enabled
5. **Updates**: `apt update && apt upgrade` weekly, or enable unattended-upgrades

## Incident Response

1. `docker stats` — найди контейнер с аномальным CPU
2. `docker exec <id> ps aux` — проверь список процессов
3. `docker stop <id>` — немедленная остановка
4. Проверь `node_modules/.bin` и `tmp/` на новые исполняемые файлы
5. Ротируй все секреты из `.env.local`
6. `docker logs <id> 2>&1 | grep -iE 'xmrig|stratum|mining'` — ищи следы
7. Проверь Dokploy UI на неизвестные деплои / изменения
8. Смени пароль Dokploy и SSH ключи если есть подозрение на компрометацию
