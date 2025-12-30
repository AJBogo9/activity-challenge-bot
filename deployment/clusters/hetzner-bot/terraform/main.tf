terraform {
    required_providers {
        hcloud = {
            source  = "hetznercloud/hcloud"
            version = "~> 1.45"
        }
    }
}

provider "hcloud" {
    token = var.hcloud_token
}
    
data "hcloud_image" "talos" {
    with_selector = "os=talos"
    most_recent = true
}

resource "hcloud_server" "node_01" {
    name = "node-01"
    image = data.hcloud_image.talos.id
    server_type = "cpx22"
    location = "nbg1"
    public_net {
        ipv4_enabled = true
    }
}
    
