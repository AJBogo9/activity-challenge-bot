import { spawnSync } from "bun";

async function syncNgrok() {
    console.log("🔍 Fetching ngrok public URL...");
    
    try {
        const res = await fetch("http://localhost:4040/api/tunnels");
        const data: any = await res.json();
        const tunnel = data.tunnels[0]; // Take the first active tunnel
        
        if (!tunnel) {
            console.error("❌ No ngrok tunnels found. Please run: ngrok http 10.5.0.200:3001");
            return;
        }

        const publicUrl = tunnel.public_url;
        console.log(`✅ Found ngrok URL: ${publicUrl}`);

        // 1. Update .env
        const envFile = Bun.file(".env");
        if (await envFile.exists()) {
            let content = await envFile.text();
            content = content.replace(/WEBAPP_URL=.*/, `WEBAPP_URL=${publicUrl}`);
            await Bun.write(".env", content);
            console.log("📝 Updated .env");
        }

        // 2. Update Kubernetes Secret
        console.log("☸️  Updating Kubernetes secret...");
        spawnSync([
            "kubectl", "patch", "secret", "bot-secrets",
            "-n", "bot-system",
            "-p", JSON.stringify({ stringData: { WEBAPP_URL: publicUrl } })
        ]);

        // 3. Restart the bot to apply the new URL
        console.log("🔄 Restarting bot deployment...");
        spawnSync([
            "kubectl", "rollout", "restart", "deployment/activity-challenge-bot",
            "-n", "bot-system"
        ]);

        console.log("\n✨ Done! Your Telegram Mini App is now linked to:");
        console.log(`🔗 ${publicUrl}`);

    } catch (e) {
        console.error("❌ Error: Could not connect to ngrok local API.");
        console.error("Make sure ngrok is running on this machine.");
    }
}

syncNgrok();
