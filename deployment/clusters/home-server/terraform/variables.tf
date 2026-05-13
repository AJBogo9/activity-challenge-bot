variable "cloudflare_api_token" {
  type      = string
  sensitive = true
  description = "Cloudflare API token. Needs permissions: Account > Cloudflare Tunnel > Edit, Zone > DNS > Edit."
}

variable "cloudflare_account_id" {
  type      = string
  description = "Cloudflare account ID. Found in the URL when logged in to dash.cloudflare.com."
}

variable "cloudflare_zone_id" {
  type      = string
  description = "Zone ID for your domain. Found on the domain's overview page in the Cloudflare dashboard."
}

variable "domain" {
  type      = string
  description = "Your root domain, e.g. yourdomain.com"
}

variable "subdomain" {
  type      = string
  description = "Subdomain to expose the app on, e.g. 'bot' produces bot.yourdomain.com"
}
