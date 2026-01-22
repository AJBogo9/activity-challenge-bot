terraform {
  required_providers {
    hcloud = {
      source  = "hetznercloud/hcloud"
      version = "~> 1.45"
    }
    sops = {
      source  = "carlpett/sops"
      version = "~> 1.0"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.16.0"
    }
  }
}

provider "sops" {}
provider "cloudflare" {}

data "cloudflare_ip_ranges" "cloudflare" {}

data "sops_file" "secrets" {
  source_file = "secrets.sops.yaml"
}

provider "hcloud" {
  token = data.sops_file.secrets.data["hcloud_token"]
}

# Key exists in Hetzner with fingerprint 19:ce:a0:d7:bd:64:c3:e6:13:c4:24:48:50:64:b9:02
data "hcloud_ssh_key" "admin" {
  fingerprint = "19:ce:a0:d7:bd:64:c3:e6:13:c4:24:48:50:64:b9:02"
}

resource "hcloud_server" "coolify" {
  name        = "coolify-server"
  image       = "ubuntu-24.04"
  server_type = "cx23"
  location    = "hel1"
  ssh_keys    = [data.hcloud_ssh_key.admin.id]
  firewall_ids = [hcloud_firewall.coolify_firewall.id]
  public_net {
    ipv4_enabled = true
    ipv6_enabled = true
  }

  user_data = <<-EOT
    #!/bin/bash
    # Install Coolify
    curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash

    # Install Tailscale
    curl -fsSL https://tailscale.com/install.sh | sh
    tailscale up --authkey=${data.sops_file.secrets.data["tailscale_auth_key"]}

    # --- REFINED SECURITY HARDENING ---
    ufw default deny incoming
    ufw default allow outgoing

    # 1. Allow Loopback and Tailscale
    ufw allow in on lo
    ufw allow in on tailscale0

    # 2. Allow SSH from ALL private/internal networks (for Coolify management)
    ufw allow from 10.0.0.0/8 to any port 22
    ufw allow from 172.16.0.0/12 to any port 22
    ufw allow from 192.168.0.0/16 to any port 22
    
    # 3. Allow HTTP/HTTPS publicly
    ufw allow 80/tcp
    ufw allow 443/tcp

    # 4. Explicitly block management and app ports from public access
    # (These will now be respected because of the Docker-UFW fix below)
    ufw deny 8000/tcp
    ufw deny 3001/tcp

    # 5. Fix Docker bypassing UFW
    # This ensures Docker traffic respects UFW rules
    echo "
    *filter
    :DOCKER-USER - [0:0]
    -A DOCKER-USER -j RETURN -s 10.0.0.0/8
    -A DOCKER-USER -j RETURN -s 172.16.0.0/12
    -A DOCKER-USER -j RETURN -s 192.168.0.0/16
    -A DOCKER-USER -j DROP -p tcp -m multiport --dports 8000,3001
    -A DOCKER-USER -j RETURN
    COMMIT
    " >> /etc/ufw/after.rules

    # Enable UFW
    ufw --force enable
  EOT
}

resource "hcloud_firewall" "coolify_firewall" {
  name = "coolify-firewall"
  
  # HTTP (Restricted to Cloudflare IPs)
  rule {
    direction = "in"
    protocol  = "tcp"
    port      = "80"
    source_ips = data.cloudflare_ip_ranges.cloudflare.ipv4_cidrs
  }

  rule {
    direction = "in"
    protocol  = "tcp"
    port      = "80"
    source_ips = data.cloudflare_ip_ranges.cloudflare.ipv6_cidrs
  }

  # HTTPS (Restricted to Cloudflare IPs)
  rule {
    direction = "in"
    protocol  = "tcp"
    port      = "443"
    source_ips = data.cloudflare_ip_ranges.cloudflare.ipv4_cidrs
  }

  rule {
    direction = "in"
    protocol  = "tcp"
    port      = "443"
    source_ips = data.cloudflare_ip_ranges.cloudflare.ipv6_cidrs
  }

  # VPN: Tailscale
  rule {
    direction = "in"
    protocol  = "udp"
    port      = "41641"
    source_ips = ["0.0.0.0/0", "::/0"]
  }
}