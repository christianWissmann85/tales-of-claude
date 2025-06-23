# 📡 Ngrok Guide for Tales of Claude

## What is ngrok?

ngrok is a tool that creates a secure tunnel from your local development server to the internet. Think of it as a temporary, public web address for the version of the game running on your own computer. This lets anyone access your local Tales of Claude game from anywhere in the world!

### Why Use ngrok for Testing?

When you run `npm run dev`, your game only works on your machine at `http://localhost:5173`. With ngrok, you can instantly share a working version of your changes.

- **Instant Feedback:** Team members can test your new features without waiting for a deployment.
- **Live Collaboration:** Perfect for quick feedback sessions and pair programming.
- **Bypass Firewalls:** It just works, even on restricted networks.
- **Realistic Testing:** Test on actual mobile devices or different operating systems.

### How It Works (ASCII Diagram)

```
Your Computer          ngrok Cloud           Team Member
[Vite Dev Server] --> [Public URL] -------> [Their Browser]
localhost:5173        https://xxx.ngrok.app    Anywhere!
```

## Installation

### Windows
1.  Download the `.zip` file from the [ngrok download page](https://ngrok.com/download).
2.  Unzip the file. You will have a single `ngrok.exe` file.
3.  Move `ngrok.exe` to a folder that is in your system's PATH (like `C:\Windows`) or simply run it from the folder where you unzipped it.
4.  Open a new Command Prompt or PowerShell and test the installation:
    `ngrok version`

### macOS
The easiest way to install ngrok is with Homebrew.
```bash
# Using Homebrew (recommended)
brew install ngrok

# Test installation
ngrok version
```
Alternatively, you can download it from the [ngrok download page](https://ngrok.com/download).

### Linux
For Debian/Ubuntu-based systems, you can use `apt`.
```bash
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | \
  sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null && \
  echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | \
  sudo tee /etc/apt/sources.list.d/ngrok.list && \
  sudo apt update && sudo apt install ngrok
```
For other distributions, download the archive from the [ngrok download page](https://ngrok.com/download), unzip it, and move the `ngrok` binary to `/usr/local/bin/`.

## One-Time Setup: Authenticate Your Agent

To get the most out of ngrok (like longer session times and fewer restrictions), you need to connect your agent to your free ngrok account. This is a one-time setup.

1.  **Sign up:** Go to the [ngrok dashboard](https://dashboard.ngrok.com/signup) and create a free account.
2.  **Get your authtoken:** On the dashboard, navigate to **Your Authtoken** on the left-hand menu.
3.  **Connect your agent:** Copy the command from the dashboard and run it in your terminal. It will look like this:
    ```bash
    ngrok config add-authtoken YOUR_TOKEN_HERE
    ```
    You only need to do this once per computer. Your agent is now authenticated!

## Basic Usage with Vite

### Step 1: Start Your Dev Server
In your first terminal window, navigate to the project directory and start the Vite development server.
```bash
cd tales-of-claude
npm run dev
```
Vite will tell you the server is running, usually on port `5173`. Keep this terminal open!

### Step 2: Start ngrok
Open a **new** terminal window or tab. Start ngrok and point it to the port Vite is using.
```bash
ngrok http 5173
```

### Step 3: Find and Share Your URL
ngrok will display a session status screen in your terminal. Look for the `Forwarding` line with an `https` address.

```
Session Status                online
Account                       Your Name (Plan: Free)
Version                       3.x.x
Region                        United States (us)
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://random-name-123.ngrok-free.app -> http://localhost:5173

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```
The `https://random-name-123.ngrok-free.app` URL is the public link you share with your team!

## Sharing with the Team

1.  Copy the **HTTPS** URL from the `Forwarding` line.
2.  Paste it into the team chat or your pull request.
3.  Briefly describe what you want them to test.
4.  **Important:** This URL is temporary and will change every time you restart ngrok.

**Example Message:**
> "Hey team! Testing the new minimap feature. Please check it out on mobile and desktop: `https://random-name-123.ngrok-free.app`
> This link will be active for the next couple of hours."

## Security Best Practices

### DO:
- ✅ Always share the `https` URL, not `http`.
- ✅ Close your ngrok tunnel (`Ctrl+C`) as soon as you are done testing.
- ✅ Be aware that free tunnels are public. Anyone with the link can access your local server.

### DON'T:
- ❌ Never commit ngrok URLs to git.
- ❌ Don't leave tunnels running unattended or overnight.
- ❌ Avoid testing features with sensitive data on public tunnels.

### For Extra Security (Paid Feature):
You can add a password to your tunnel to restrict access.
```bash
# Add basic auth protection
ngrok http 5173 --basic-auth="tales-claude:test1234"
```

## Common Commands Cheat Sheet

```bash
# Start a basic tunnel for our Vite project
ngrok http 5173

# Start a tunnel on a different port
ngrok http 3000

# See the status of your running tunnels
ngrok status

# Stop all running ngrok tunnels
killall ngrok  # macOS / Linux
taskkill /f /im ngrok.exe  # Windows

# Inspect all traffic in your browser (very useful for debugging!)
# Just open http://localhost:4040 while ngrok is running
```

## Troubleshooting

### "Connection refused" or "502 Bad Gateway"
This means ngrok can't connect to your local server.
-   **Is `npm run dev` still running?** Check your first terminal window.
-   **Did you use the correct port?** Make sure the port in `ngrok http 5173` matches the port Vite is using.
-   Try restarting both the Vite server and ngrok.

### "My teammate sees a warning page"
-   This is expected on the free tier. It's an anti-phishing measure.
-   Tell them to click the blue **"Visit Site"** button to proceed. They only have to do this once per tunnel.

### "Tunnel not found" or Link Expired
-   Free tunnels expire after a few hours of inactivity.
-   Restart ngrok (`Ctrl+C` and run the command again) to get a new URL. Authenticating your agent (see setup) provides longer session times.

### "Port `5173` is already in use"
Another application is using that port. You can either find and stop it, or just use a different port.
```bash
# Terminal 1: Start Vite on a new port
npm run dev -- --port 5174

# Terminal 2: Point ngrok to the new port
ngrok http 5174
```

## Quick Start Recipe

```bash
# Terminal 1: Start the game
cd tales-of-claude
npm run dev

# Terminal 2: Start the tunnel
ngrok http 5173

# Copy the https://... URL from Terminal 2
# Share with the team
# When finished, press Ctrl+C in both terminals
```

## 💡 Pro Tips & Key Takeaways

Keep these points in mind for a smooth workflow:

1.  **Keep Both Terminals Visible:** You'll want to see both your Vite server logs and the ngrok traffic inspector at the same time.
2.  **The Free Tier is Enough:** For our current testing needs, the free tier is perfect.
3.  **When in Doubt, Restart:** If something seems broken, the fastest fix is often to stop both processes (`Ctrl+C`) and start them again.
4.  **Label Your Links:** If you're sharing multiple links for different branches, make sure to label them clearly in chat. They all look the same!
5.  **Set a Timer:** Tunnels on the free plan can time out. If you're in a long feedback session, be prepared to restart ngrok and share a new link.

## Advanced Features (Paid Tiers)

If our needs grow, ngrok offers powerful paid features:
-   **Reserved Subdomains:** Get a permanent URL like `tales-of-claude.ngrok.app`.
-   **IP Whitelisting:** Restrict access to specific IP addresses (e.g., our office or team members' homes).
-   **OAuth Integration:** Protect your tunnel by requiring login with a Google or GitHub account.
-   **Higher Limits:** More concurrent connections and longer-lived tunnels.

## Useful Resources

-   [ngrok Official Documentation](https://ngrok.com/docs)
-   [Vite Server Options](https://vitejs.dev/config/server-options.html)
-   [Our CLAUDE.md](../CLAUDE.md) - Project overview
-   [Team Chat] - Ask for help anytime!

## Final Notes

Remember, ngrok is for **development and testing only**. When we're ready to launch Tales of Claude to the public, we'll use a proper hosting service like Vercel or Netlify. For now, ngrok is the best tool for letting us collaborate and build amazing things together.

If you discover any new tricks or solutions, please add them to this guide!

---

*Made with 🚀 by the Infrastructure Documentation Agent*  
*Part of the REVOLUTION workflow*

*"Tunnels connect not just servers, but teammates!"*