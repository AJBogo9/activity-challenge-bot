output "tunnel_token" {
  value       = cloudflare_tunnel.bot.tunnel_token
  sensitive   = true
  description = "Set this as CLOUDFLARE_TUNNEL_TOKEN in your .env file."
}

output "webapp_url" {
  value       = "https://${var.subdomain}.${var.domain}"
  description = "Set this as WEBAPP_URL in your .env file."
}
