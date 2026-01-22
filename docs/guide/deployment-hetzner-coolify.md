# Deployment Guide (Hetzner + OpenTofu + Coolify)

This guide provides a step-by-step walkthrough for deploying the Activity Challenge Bot using **OpenTofu** for infrastructure and **Coolify** for application management.

## 1. Infrastructure Launch (OpenTofu)

The project includes a `coolify-deployment` folder with OpenTofu (Terraform) configurations.

1.  **Configure Secrets:** Ensure your `secrets.sops.yaml` contains your `hcloud_token`.
2.  **Initialize & Apply:**
    ```bash
    cd coolify-deployment
    tofu init
    tofu apply
    ```
3.  **Hetzner Image:** The configuration uses the pre-built `coolify` image available on Hetzner. This image is optimized for running Coolify out of the box.

---

## 2. Server Initialization

1.  **SSH into the server:**
    ```bash
    ssh root@<your_server_ip>
    ```
2.  **Auto-Setup:** On the first login, the Hetzner Coolify image will automatically trigger the setup script. Wait for the process to complete. It will provide you with the **Coolify UI login credentials** and the URL (usually `http://<your_server_ip>:8000`).

---

## 3. Security: Install Tailscale

To secure your management dashboard, it is highly recommended to use Tailscale.

1.  **Install Tailscale on the server:**
    ```bash
    curl -fsSL https://tailscale.com/install.sh | sh
    tailscale up
    ```
2.  **Authenticate:** Follow the link provided in the terminal to add the server to your Tailscale network.
3.  **Firewall:** Once Tailscale is working, you can restrict port `8000` (Coolify UI) to only be accessible via your Tailscale IP.

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

Finally, point your domain to the server so users can access the Web App and the Bot can receive webhooks (if configured).

1.  **Get Server IP:** Find your public IPv4 address in the Hetzner console or via `tofu output`.
2.  **Configure Cloudflare:**
    *   **A Record:** Set `example.com` (or your subdomain) to your **Server IP**.
    *   **Proxy Status:** Set to **DNS Only** (Grey Cloud) initially to allow Coolify's Let's Encrypt to issue SSL certificates.
3.  **Coolify Domain:** In the Coolify UI, go to your Application settings and set the **Domain** to `https://example.com`.

---

## 6. Verification
*   **Bot:** Send `/start` to the bot in Telegram.
*   **Web App:** Visit `https://example.com` to see the dashboard.
*   **Logs:** Use the **Logs** tab in Coolify to monitor the Bun server and Bot activity.
