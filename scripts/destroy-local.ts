import { spawnSync } from "bun";
import { join } from "path";
import { existsSync, rmSync } from "fs";

const CLUSTER_NAME = "activity-bot-local";
const REGISTRY_NAME = "talos-registry";
const TF_DIR = join(process.cwd(), "deployment/clusters/local-dev/terraform");

// Helper to run shell commands
function run(cmd: string[], cwd: string = process.cwd(), ignoreError = false) {
    const result = spawnSync(cmd, { cwd, stdio: ["ignore", "pipe", "pipe"] });
    if (result.exitCode !== 0 && !ignoreError) {
        throw new Error(`Command failed: ${cmd.join(" ")}\nStderr: ${result.stderr.toString()}`);
    }
    return {
        success: result.exitCode === 0,
        stdout: result.stdout.toString().trim(),
        stderr: result.stderr.toString().trim(),
    };
}

// Check docker access
const dockerCheck = run(["docker", "ps"], process.cwd(), true);
if (!dockerCheck.success) {
    console.error("Error: Docker cannot be accessed.");
    console.error("Docker output:", dockerCheck.stderr);
    console.error("Please ensure you have permissions (e.g., add user to 'docker' group) or run with sudo.");
    process.exit(1);
}

// Detect OpenTofu or Terraform
let tfCmd = "";
if (run(["which", "tofu"], process.cwd(), true).success) {
    tfCmd = "tofu";
} else if (run(["which", "terraform"], process.cwd(), true).success) {
    tfCmd = "terraform";
} else {
    console.warn("Warning: Neither tofu nor terraform found. Skipping resource destruction.");
}

if (tfCmd) {
    console.log(`Destroying Kubernetes resources with ${tfCmd}...`);
    if (existsSync(join(TF_DIR, ".terraform"))) {
        const destroy = spawnSync([tfCmd, "destroy", "-auto-approve"], { 
            cwd: TF_DIR,
            stdio: ["inherit", "inherit", "inherit"] 
        });
        if (destroy.exitCode !== 0) {
            console.warn("Warning: Terraform destroy failed, cluster might be gone already.");
        }
    } else {
        console.log("Terraform not initialized, skipping resource destruction.");
    }
}

console.log("Removing local registry...");
const registryCheck = run(["docker", "ps", "-aq", "-f", `name=${REGISTRY_NAME}`]);
if (registryCheck.stdout) {
    run(["docker", "rm", "-f", REGISTRY_NAME], process.cwd(), true);
}

console.log(`Destroying Talos cluster '${CLUSTER_NAME}'...`);
if (run(["which", "talosctl"], process.cwd(), true).success) {
    const destroyCluster = spawnSync(["talosctl", "cluster", "destroy", "--name", CLUSTER_NAME], { stdio: ["inherit", "inherit", "inherit"] });
    if (destroyCluster.exitCode !== 0) {
         console.warn("Warning: talosctl cluster destroy failed.");
    }
} else {
    console.warn("Warning: talosctl not found.");
}

console.log("Cleaning up local state files...");
rmSync(join(TF_DIR, ".terraform"), { recursive: true, force: true });
// Remove all files starting with terraform.tfstate
const files = spawnSync(["ls", TF_DIR]).stdout.toString().split("\n");
for (const file of files) {
    if (file.startsWith("terraform.tfstate")) {
        rmSync(join(TF_DIR, file), { force: true });
    }
}

console.log("Cleanup complete!");
