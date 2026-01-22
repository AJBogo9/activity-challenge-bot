# Deployment Guide (Hetzner + OpenTofu + Coolify)

This guide provides a step-by-step walkthrough for deploying the Activity Challenge Bot using **OpenTofu** for infrastructure and **Coolify** for application management.

## 1. Infrastructure Launch (OpenTofu)

The project includes a `coolify-deployment` folder with OpenTofu (Terraform) configurations.

1.  **Configure Secrets:** Ensure your `secrets.sops.yaml` contains:
    *   `hcloud_token`: Your Hetzner API token.
    *   `tailscale_auth_key`: A Tailscale Auth Key (generated in the Tailscale Admin Console under **Settings > Keys**).
2.  **Initialize & Apply:**
    ```bash
    cd coolify-deployment
    tofu init
    tofu apply
    ```
3.  **Hetzner Image:** The configuration uses a standard **Ubuntu 24.04** image. Coolify and Tailscale are automatically installed during the first boot via a `user_data` script.

---

## 2. Server Initialization

1.  **SSH into the server:** Since Tailscale is automated, you can even SSH using the server's Tailscale IP if your local machine is also on the network.
2.  **Wait for Installation:** Check progress:
    ```bash
    tail -f /var/log/cloud-init-output.log
    ```
    Once complete, it will provide the **Coolify UI login credentials**.

---

## 3. Security: Tailscale (Automated)

Tailscale is now installed and authenticated automatically.
*   The server will appear in your Tailscale dashboard immediately after boot.
*   **Recommendation:** In Tailscale settings, disable **Key Expiry** for this server so it doesn't disconnect after 6 months.
*   **Firewall:** You can now safely restrict port `8000` (Coolify UI) to only be accessible via the `tailscale0` interface or specific Tailscale IPs.

---

## 4. Deploying the Application

Instead of manual resource creation, we use a `Docker Compose` approach for the Bot and its Database.

1.  **Log in to Coolify UI:** Go to `http://<your_server_ip>:8000`.
2.  **Create Project:** Click **Projects** -> **Add New**.
3.  **Deploy via Compose:**
    *   Click **+ New Resource**.
    *   Select **Docker Compose**.
    *   Paste the content of the `compose.yaml` found in the root of this repository.
    *   **Note:** Ensure you update the `environment` variables in the UI with your `BOT_TOKEN` and `WEBAPP_URL`.
4.  **Confirm Deployment:** Click **Deploy**. Coolify will pull the images and start both the bot and the Postgres database.

---

## 5. DNS Configuration (Cloudflare)

Finally, point your domain to the server so users can access the Web App.

1.  **Get Server IP:** Find your public IPv4 address in the Hetzner console or via `tofu output`.
2.  **Configure Cloudflare:**
    *   **A Record:** Set `example.com` (or your subdomain) to your **Server IP**.
    *   **Proxy Status:** Set to **Proxied** (Orange Cloud).
3.  **Hetzner Firewall:** The provided OpenTofu configuration automatically restricts incoming HTTP/HTTPS traffic to Cloudflare's official IP ranges. This means direct access to your server's IP will be blocked for anyone not using Cloudflare.
4.  **Coolify Domain:** In the Coolify UI, go to your Application settings and set the **Domain** to `https://example.com`.

---

## 6. Verification
*   **Bot:** Send `/start` to the bot in Telegram.
*   **Web App:** Visit `https://example.com` to see the dashboard.
*   **Logs:** Use the **Logs** tab in Coolify to monitor the Bun server and Bot activity.
