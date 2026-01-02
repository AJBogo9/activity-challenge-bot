import { spawnSync, write } from "bun";
import { join } from "path";
import { tmpdir } from "os";

const CLUSTER_NAME = "activity-bot-local";
const REGISTRY_NAME = "talos-registry";
const REGISTRY_PORT = 5000;
const NETWORK_NAME = CLUSTER_NAME;

// Helper to run shell commands
function run(cmd: string[], ignoreError = false) {
    const result = spawnSync(cmd, { stdio: ["ignore", "pipe", "pipe"] });
    if (result.exitCode !== 0 && !ignoreError) {
        throw new Error(`Command failed: ${cmd.join(" ")}\nStderr: ${result.stderr.toString()}`);
    }
    return {
        success: result.exitCode === 0,
        stdout: result.stdout.toString().trim(),
        stderr: result.stderr.toString().trim(),
    };
}

// Check dependencies
if (!run(["which", "talosctl"], true).success) {
    console.error("Error: talosctl is not installed.");
    process.exit(1);
}

if (!run(["which", "docker"], true).success) {
    console.error("Error: docker is not installed.");
    process.exit(1);
}

// Check docker access
const dockerCheck = run(["docker", "ps"], true);
if (!dockerCheck.success) {
    console.error("Error: Docker cannot be accessed.");
    console.error("Docker output:", dockerCheck.stderr);
    console.error("Please ensure you have permissions (e.g., add user to 'docker' group) or run with sudo.");
    console.error("If you recently added your user to the group, run 'newgrp docker' to apply changes.");
    console.error("\nNote: On Linux, you may also need to load the 'br_netfilter' module for Kubernetes networking:");
    console.error("sudo modprobe br_netfilter");
    process.exit(1);
}

console.log(`Creating Talos cluster '${CLUSTER_NAME}' in Docker...`);

// Check if cluster exists
const existingContainers = run(["docker", "ps", "-a", "--format", "{{.Names}}"]).stdout;
if (existingContainers.includes(`${CLUSTER_NAME}-controlplane-1`)) {
    console.log(`Cluster '${CLUSTER_NAME}' already exists.`);
} else {
    // Clean up old kubeconfig contexts
    run(["kubectl", "config", "delete-context", `admin@${CLUSTER_NAME}`], true);
    run(["kubectl", "config", "delete-cluster", CLUSTER_NAME], true);
    run(["kubectl", "config", "delete-user", `admin@${CLUSTER_NAME}`], true);

    // Create patch file
    const patchPath = join(tmpdir(), "registry-patch.yaml");
    const patchContent = `machine:
  registries:
    mirrors:
      "${REGISTRY_NAME}:${REGISTRY_PORT}":
        endpoints:
          - http://${REGISTRY_NAME}:${REGISTRY_PORT}
`;
    await write(patchPath, patchContent);

    try {
        const createCmd = [
            "talosctl", "cluster", "create", "docker",
            "--name", CLUSTER_NAME,
            "--workers", "0",
            "--config-patch", `@${patchPath}`
        ];
        // Use inherit stdio to show progress
        spawnSync(createCmd, { stdio: ["inherit", "inherit", "inherit"] });
    } finally {
        run(["rm", patchPath], true);
    }
}

console.log("Setting up local registry...");
const registryCheck = run(["docker", "ps", "-aq", "-f", `name=${REGISTRY_NAME}`]);
if (registryCheck.stdout) {
    const registryRunning = run(["docker", "ps", "-aq", "-f", "status=exited", "-f", `name=${REGISTRY_NAME}`]);
    if (registryRunning.stdout) {
        run(["docker", "start", REGISTRY_NAME]);
    }
} else {
    run(["docker", "run", "-d", "--restart=always", "-p", `${REGISTRY_PORT}:5000`, "--name", REGISTRY_NAME, "registry:2"]);
}

// Connect registry to network
const connectResult = run(["docker", "network", "connect", NETWORK_NAME, REGISTRY_NAME], true);
if (!connectResult.success) {
    console.log(`Registry might already be connected or network '${NETWORK_NAME}' not found.`);
    // Fallback
    const networkInspect = run(["docker", "network", "inspect", NETWORK_NAME], true);
    if (!networkInspect.success) {
        console.log(`Network '${NETWORK_NAME}' not found. Trying 'talos-default'...`);
        run(["docker", "network", "connect", "talos-default", REGISTRY_NAME], true);
    }
}

console.log("Waiting for cluster to be ready...");
await new Promise(resolve => setTimeout(resolve, 5000));

console.log("Untainting control plane...");
run(["kubectl", "taint", "nodes", "--all", "node-role.kubernetes.io/control-plane-"], true);

console.log("Cluster setup complete!");
console.log(`Registry available at localhost:${REGISTRY_PORT} (host) and ${REGISTRY_NAME}:${REGISTRY_PORT} (cluster)`);
