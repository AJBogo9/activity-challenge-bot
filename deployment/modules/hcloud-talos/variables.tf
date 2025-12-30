variable "node_name" {
    type = string
}

variable "server_type" {
    type = string
}

variable "talos_image_id" {
    type = string
}

variable "location" {
    type = string
}

variable "cluster_name" {
    type = string
}

variable "role" {
    type = string
}

variable "talos_config" {
    type = string
    default = ""
}
