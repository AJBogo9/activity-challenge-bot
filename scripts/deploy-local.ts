import { spawnSync } from "bun";
import { existsSync } from "fs";
import { join } from "path";

// Configuration
const REGISTRY_HOST = "localhost";
const REGISTRY_CLUSTER_NAME = "talos-registry";
const REGISTRY_PORT = 5000;
const IMAGE_NAME = "activity-challenge-bot";
const TAG = "local";

const HOST_IMAGE = `${REGISTRY_HOST}:${REGISTRY_PORT}/${IMAGE_NAME}:${TAG}`;
const CLUSTER_IMAGE = `${REGISTRY_CLUSTER_NAME}:${REGISTRY_PORT}/${IMAGE_NAME}:${TAG}`;

// Deployment directory
const DEPLOY_DIR = join(process.cwd(), "deployment/clusters/local-dev/terraform");

// Helper to run shell commands
function run(cmd: string[], cwd: string = process.cwd(), env: NodeJS.ProcessEnv = process.env) {
  console.log(`> ${cmd.join(" ")}`);
  const result = spawnSync(cmd, {
    cwd,
    stdio: ["inherit", "inherit", "inherit"],
    env,
  });

  if (result.exitCode !== 0) {
    console.error(`Command failed with exit code ${result.exitCode}`);
    process.exit(result.exitCode || 1);
  }
}

// Detect OpenTofu or Terraform
let tfCmd = "tofu";
const tofuCheck = spawnSync(["which", "tofu"]);
if (tofuCheck.exitCode !== 0) {
    const tfCheck = spawnSync(["which", "terraform"]);
    if (tfCheck.exitCode !== 0) {
        console.error("Error: Neither tofu nor terraform found.");
        process.exit(1);
    }
    tfCmd = "terraform";
}

// Check docker access
const dockerCheck = spawnSync(["docker", "ps"], { stdio: "ignore" });
if (dockerCheck.status !== 0) {
    console.error("Error: Docker cannot be accessed.");
    console.error("Please ensure you have permissions (e.g., add user to 'docker' group) or run with sudo.");
    console.error("If you recently added your user to the group, run 'newgrp docker' to apply changes.");
    process.exit(1);
}

console.log("Building Docker image...");
run(["docker", "build", "-f", "Containerfile", "-t", HOST_IMAGE, "."]);

console.log("Pushing image to local registry...");
run(["docker", "push", HOST_IMAGE]);

console.log(`Deploying with ${tfCmd}...`);

// Initialize if needed
if (!existsSync(join(DEPLOY_DIR, ".terraform"))) {
  run([tfCmd, "init"], DEPLOY_DIR);
}

// Prepare Terraform variables from process.env (loaded from .env by Bun)
const tfVars: string[] = [];

const envMap: Record<string, string> = {
  BOT_TOKEN: "bot_token",
  POSTGRES_USER: "postgres_user",
  POSTGRES_PASSWORD: "postgres_password",
  POSTGRES_DB: "postgres_db",
  COMPETITION_START_DATE: "competition_start_date",
  COMPETITION_END_DATE: "competition_end_date",
  MB_ENCRYPTION_SECRET_KEY: "mb_encryption_secret_key",
};

for (const [envKey, tfVar] of Object.entries(envMap)) {
  const value = process.env[envKey];
  if (value) {
    // We pass -var='key=value'
    tfVars.push("-var", `${tfVar}=${value}`);
  }
}

// Add the image variable
tfVars.push("-var", `bot_image=${CLUSTER_IMAGE}`);

// Run apply
run([tfCmd, "apply", "-auto-approve", ...tfVars], DEPLOY_DIR);

console.log("Restarting deployment to pick up new image...");
run(["kubectl", "rollout", "restart", "deployment/activity-challenge-bot", "-n", "bot-system"]);

console.log("Deployment complete!");
