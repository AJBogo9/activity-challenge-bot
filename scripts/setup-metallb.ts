import { spawnSync } from "bun";

function run(cmd: string[]) {
    console.log(`> ${cmd.join(" ")}`);
    const result = spawnSync(cmd, { stdio: ["inherit", "inherit", "inherit"] });
    if (result.exitCode !== 0) {
        throw new Error(`Command failed: ${cmd.join(" ")}`);
    }
}

async function setupMetalLB() {
    try {
        console.log("Installing MetalLB...");
        // Install MetalLB (using native manifests for simplicity in local dev)
        run(["kubectl", "apply", "-f", "https://raw.githubusercontent.com/metallb/metallb/v0.13.12/config/manifests/metallb-native.yaml"]);

        console.log("Waiting for MetalLB controller to be ready...");
        run(["kubectl", "wait", "--namespace", "metallb-system",
                "--for=condition=ready", "pod",
                "--selector=app=metallb",
                "--timeout=90s"]);

        console.log("Configuring MetalLB IP Pool (10.5.0.200-10.5.0.250)...");
        
        const config = `
apiVersion: metallb.io/v1beta1
kind: IPAddressPool
metadata:
  name: first-pool
  namespace: metallb-system
spec:
  addresses:
  - 10.5.0.200-10.5.0.250
---
apiVersion: metallb.io/v1beta1
kind: L2Advertisement
metadata:
  name: example
  namespace: metallb-system
`;
        
        // Write config to temporary file and apply
        const configPath = "/tmp/metallb-config.yaml";
        await Bun.write(configPath, config);
        run(["kubectl", "apply", "-f", configPath]);

        console.log("MetalLB setup complete!");
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

setupMetalLB();
