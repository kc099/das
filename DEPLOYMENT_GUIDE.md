# Deployment Guide: DAS Frontend & Nginx

This guide covers deploying the React frontend (`das`) and configuring Nginx to serve it and act as a reverse proxy for the `edgesync` backend.

## Step 1: Build the React Application

1.  **Prerequisites:** Ensure Node.js and npm are installed on your server.
    ```bash
    # Example for Ubuntu
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install -y nodejs
    ```
2.  **Navigate to the `das` directory:**
    ```bash
    cd /path/to/your/project/das
    ```
3.  **Install dependencies:**
    ```bash
    npm install
    ```
4.  **Create a production build:**
    ```bash
    npm run build
    ```
    This command creates a `build/` directory containing the optimized, static assets for your frontend. This is the directory Nginx will serve.

## Step 2: Nginx Configuration

Nginx will handle all incoming HTTP/HTTPS traffic. It will:
-   Serve the static files (HTML, CSS, JS) for the React app.
-   Forward all API requests (e.g., `/api/...`) to the Daphne backend.
-   Handle WebSocket connections (e.g., `/ws/...`) and proxy them to Daphne.

1.  **Install Nginx:**
    ```bash
    sudo apt install -y nginx
    ```
2.  **Create an Nginx configuration file:**
    ```bash
    sudo nano /etc/nginx/sites-available/das-app
    ```
3.  **Add the following server block.** This is the core of the configuration.

    ```nginx
    server {
        listen 80;
        # Replace with your domain name
        server_name your-domain.com www.your-domain.com;

        # Path to the React app's build directory
        root /path/to/your/project/das/build;

        # Serve the main index.html for any route to let React Router handle it
        location / {
            try_files $uri /index.html;
        }

        # Reverse proxy for API calls to the Daphne backend
        location /api/ {
            proxy_pass http://127.0.0.1:8001; # Assumes Daphne runs on port 8001
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Reverse proxy for WebSocket connections
        location /ws/ {
            proxy_pass http://127.0.0.1:8001; # Same Daphne instance
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
        }
    }
    ```

4.  **Enable the site and restart Nginx:**
    ```bash
    sudo ln -s /etc/nginx/sites-available/das-app /etc/nginx/sites-enabled/
    # Test the configuration for errors
    sudo nginx -t
    # Restart Nginx to apply changes
    sudo systemctl restart nginx
    ```

## Step 3: (Recommended) Enable HTTPS

Once your site is working, secure it with a free SSL certificate from Let's Encrypt.

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```
