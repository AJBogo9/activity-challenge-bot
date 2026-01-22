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
  }
}

provider "sops" {}

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
  image       = "coolify"
  server_type = "cx23"
  location    = "hel1"
  ssh_keys    = [data.hcloud_ssh_key.admin.id]
  firewall_ids = [hcloud_firewall.coolify_firewall.id]
  public_net {
    ipv4_enabled = true
    ipv6_enabled = true
  }
}

resource "hcloud_firewall" "coolify_firewall" {
  name = "coolify-firewall"
  
  # HTTP (Required for ACME/SSL)
  rule {
    direction = "in"
    protocol  = "tcp"
    port      = "80"
    source_ips = ["0.0.0.0/0", "::/0"]
  }

  # HTTPS (Web App)
  rule {
    direction = "in"
    protocol  = "tcp"
    port      = "443"
    source_ips = ["0.0.0.0/0", "::/0"]
  }

  # SSH (Keep open until VPN is verified!)
  rule {
    direction = "in"
    protocol  = "tcp"
    port      = "22"
    source_ips = ["0.0.0.0/0", "::/0"]
  }

  # VPN: WireGuard
  rule {
    direction = "in"
    protocol  = "udp"
    port      = "51820"
    source_ips = ["0.0.0.0/0", "::/0"]
  }

  # VPN: Tailscale
  rule {
    direction = "in"
    protocol  = "udp"
    port      = "41641"
    source_ips = ["0.0.0.0/0", "::/0"]
  }
}