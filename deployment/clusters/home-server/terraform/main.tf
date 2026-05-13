terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3"
    }
  }
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

resource "random_id" "tunnel_secret" {
  byte_length = 32
}

resource "cloudflare_tunnel" "bot" {
  account_id = var.cloudflare_account_id
  name       = "activity-challenge-bot"
  secret     = random_id.tunnel_secret.b64_std
}

resource "cloudflare_tunnel_config" "bot" {
  account_id = var.cloudflare_account_id
  tunnel_id  = cloudflare_tunnel.bot.id

  config {
    ingress_rule {
      hostname = "${var.subdomain}.${var.domain}"
      service  = "http://app:3001"
    }
    ingress_rule {
      service = "http_status:404"
    }
  }
}

resource "cloudflare_record" "bot" {
  zone_id = var.cloudflare_zone_id
  name    = var.subdomain
  value   = "${cloudflare_tunnel.bot.id}.cfargotunnel.com"
  type    = "CNAME"
  proxied = true
}
