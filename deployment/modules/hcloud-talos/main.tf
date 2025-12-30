resource "hcloud_server" "node" {
    name = var.node_name
    server_type = var.server_type
    image = var.talos_image_id
    location = var.location
    public_net = {
        ipv4_enabled = true
        ipv6_enabled = true
    }
}

labels = {
    "cluster" = var.cluster_name
    "role" = var.role
}

user_data = var.talos_config