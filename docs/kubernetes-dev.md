# Kubernetes Local Development ☸️

This guide explains how to set up and use the local Kubernetes development environment for the Activity Challenge Bot using **Talos Linux** in Docker and **OpenTofu/Terraform**.

## Prerequisites

Ensure you have the following installed:
- **Docker**
- **Bun**
- **talosctl**
- **OpenTofu** (or Terraform)
- **kubectl**

## Quick Start

### 1. Set Up the Cluster
This will create a single-node Talos cluster in Docker and set up a local registry.
```bash
bun run cluster:setup
```

### 2. Deploy the Bot
Builds the image, pushes it to the local registry, and deploys using OpenTofu.
```bash
bun run cluster:deploy
```

### 3. Monitor Logs
```bash
bun run cluster:logs
```

## Troubleshooting

### br_netfilter Error
> **Note:** When running Kubernetes with Flannel inside Docker, you may encounter this error:
> `Failed to check br_netfilter: stat /proc/sys/net/bridge/bridge-nf-call-iptables: no such file or directory`
>
> This happens because the host Linux kernel does not have the **`br_netfilter`** module enabled. To resolve this, load the module by running:
>
> ```bash
> sudo modprobe br_netfilter
> ```

### Registry Connection Issues
If the registry cannot be connected to the cluster network, ensure Docker has permissions and the `talos-registry` container is not conflicting with an old instance. You can run `bun run cluster:destroy` to wipe the state.

## Available Commands

- `bun run cluster:setup`: Create the cluster and local registry.
- `bun run cluster:deploy`: Build, push, and deploy/update the bot.
- `bun run cluster:logs`: Tail the bot logs.
- `bun run cluster:shell`: Open a shell inside the bot container.
- `bun run cluster:destroy`: Tear down the cluster and clean up all resources.
