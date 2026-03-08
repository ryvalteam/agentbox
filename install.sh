#!/bin/bash
set -e

echo ""
echo "  ┌─────────────────────────────────────────┐"
echo "  │          AgentBox Installer              │"
echo "  │   One-click agent platform for VPS       │"
echo "  └─────────────────────────────────────────┘"
echo ""

# Check for Docker
if ! command -v docker &> /dev/null; then
  echo "[*] Docker not found. Installing Docker..."
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
  echo "[+] Docker installed."
else
  echo "[+] Docker found."
fi

# Check for Docker Compose
if ! docker compose version &> /dev/null; then
  echo "[!] Docker Compose (plugin) not found."
  echo "    Install it: https://docs.docker.com/compose/install/"
  exit 1
fi

echo "[+] Docker Compose found."

# Clone or update
INSTALL_DIR="/opt/agentbox"

if [ -d "$INSTALL_DIR" ]; then
  echo "[*] Updating existing installation..."
  cd "$INSTALL_DIR"
  git pull --ff-only 2>/dev/null || true
else
  echo "[*] Cloning AgentBox..."
  git clone https://github.com/your-org/agentbox.git "$INSTALL_DIR"
  cd "$INSTALL_DIR"
fi

# Create .env if it doesn't exist
if [ ! -f .env ]; then
  cp .env.example .env
  # Generate a random session secret
  SECRET=$(openssl rand -hex 32 2>/dev/null || head -c 64 /dev/urandom | base64 | tr -d '/+=' | head -c 64)
  sed -i "s/change-me-to-something-random/$SECRET/" .env
  echo "[+] Created .env with random session secret."
fi

# Build and start
echo "[*] Building and starting AgentBox..."
docker compose up -d --build

# Get the IP
IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "localhost")
PORT=$(grep -oP 'PORT=\K[0-9]+' .env 2>/dev/null || echo "3000")

echo ""
echo "  ┌─────────────────────────────────────────┐"
echo "  │        AgentBox is running!              │"
echo "  │                                          │"
echo "  │   http://${IP}:${PORT}                   │"
echo "  │                                          │"
echo "  │   Data stored in Docker volume:          │"
echo "  │   agentbox-data                          │"
echo "  │                                          │"
echo "  │   Commands:                              │"
echo "  │   docker compose logs -f   (view logs)   │"
echo "  │   docker compose restart   (restart)     │"
echo "  │   docker compose down      (stop)        │"
echo "  └─────────────────────────────────────────┘"
echo ""
