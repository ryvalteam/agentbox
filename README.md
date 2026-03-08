# AgentBox

Open-source AI agent platform for small businesses. Designed for VPS hosters to offer one-click deploy.

## What It Does

AgentBox lets small businesses create and manage AI agents — virtual employees that know your business. Each agent gets:

- **Instructions** — how to behave, tone, rules
- **Repeatable Tasks** — workflows it can execute
- **Sources** — data feeds it pulls from
- **References/Docs** — SOPs, guides, documentation it can consult
- **Knowledge Base** — shared company info across all agents
- **Chat** — talk to your agents directly

## Quick Deploy (Docker)

```bash
git clone https://github.com/Seahawk-Media/agentbox.git
cd agentbox
cp .env.example .env
docker compose up -d --build
```

Open `http://your-server-ip:3000`

**Default login:** `admin` / `admin` — change this immediately in Settings.

## One-Click VPS Install

```bash
curl -fsSL https://raw.githubusercontent.com/Seahawk-Media/agentbox/main/install.sh | bash
```

## For VPS Hosters

### What Your Clients Get

- Simple web UI to set up AI agents
- No technical knowledge needed
- Secure login, rate-limited API
- Works with OpenAI and Anthropic

### Production Setup

1. Deploy with Docker on any VPS (1GB RAM minimum)
2. Point a domain to the VPS
3. Set up SSL with the included `nginx.conf`:
   ```bash
   cp nginx.conf /etc/nginx/sites-available/agentbox
   # Edit server_name to your domain
   ln -s /etc/nginx/sites-available/agentbox /etc/nginx/sites-enabled/
   certbot --nginx -d your-domain.com
   systemctl reload nginx
   ```
4. Set `ADMIN_PASSWORD` in `.env` before first boot
5. Hand the URL + credentials to your client

### Monitoring

Health check endpoint (no auth required):
```
GET /api/health
```

### Resource Requirements

- **Minimum:** 1 vCPU, 1GB RAM, 10GB disk
- **Recommended:** 2 vCPU, 2GB RAM, 20GB disk
- SQLite database — no external DB needed

## Security

- Password-hashed authentication (PBKDF2-SHA512)
- Session tokens with 7-day expiry
- Rate limiting (10 login attempts per 15 min, 100 API requests per min)
- Security headers (XSS, CSRF, clickjacking protection)
- No default ports exposed beyond 3000

## Tech Stack

- **Backend:** Node.js + Express + SQLite
- **Frontend:** React + React Router
- **AI:** OpenAI and Anthropic API support
- **Deploy:** Docker + Docker Compose

## License

MIT
