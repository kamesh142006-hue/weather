# Weatherly

A simple, responsive weather dashboard made with Node.js, Express, HTML, CSS, and JavaScript. It includes a city search, browser location, current conditions, a 24-hour temperature chart, and a five-day forecast.

The browser talks to this app's Node.js server. The server uses your OpenWeatherMap API key to request weather data, so the key is not included in browser code.

## Files at a glance

```text
weather/
├── public/
│   ├── app.js       # Search, location, chart, and forecast behavior
│   ├── index.html   # Page structure
│   └── styles.css   # Layout, colors, and responsive styles
├── .env.example     # Example settings (no real API key)
├── .gitignore       # Prevents secrets and packages from being committed
├── package.json     # Node.js dependencies and commands
└── server.js        # Web server and secure weather API requests
```

## Step-by-step: run it on Windows

1. **Open the project folder in VS Code.** Choose **File > Open Folder...** and select the `weather` folder.
2. **Open a terminal.** In VS Code, select **Terminal > New Terminal**. Confirm the terminal is in the `weather` folder.
3. **Check Node.js.** Run `node --version` and `npm --version`. If Windows says the commands are not recognized, install the current Node.js LTS version, restart VS Code, and try again.
4. **Install this app's packages.** Run:

   ```powershell
   npm install
   ```

5. **Get an API key.** Create a free OpenWeatherMap account and create an API key. A new key may take a little while to become active.
6. **Create your private settings file.** In the terminal, run:

   ```powershell
   Copy-Item .env.example .env
   ```

   Open `.env` in VS Code and replace the example value with your key:

   ```text
   OPENWEATHER_API_KEY=your_real_key_goes_here
   PORT=3000
   ```

   Do not put the real key in `public/app.js`, screenshots, or GitHub. The `.env` file is ignored by Git.
7. **Start the website.** Run:

   ```powershell
   npm start
   ```

8. **Open the page.** Visit [http://localhost:3000](http://localhost:3000). Search for a city or select **Use my location**. Location access works on `localhost` and secure HTTPS websites.
9. **Stop the server.** Return to the terminal and press **Ctrl+C**.

For automatic server restarts while editing, use `npm run dev` instead of `npm start`.

## Push the project to GitHub

If this folder is not already a Git repository, open the VS Code terminal in `weather` and run:

```powershell
git init
git add .
git commit -m "Build weather dashboard"
```

Create an empty repository on GitHub, then connect and push (replace the URL with your repository URL):

```powershell
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
git push -u origin main
```

Before pushing, check that `.env` is not listed by `git status`. Never push your API key.

## If something goes wrong

- **`node` or `npm` is not recognized:** Install Node.js LTS and restart VS Code so its terminal reloads `PATH`.
- **The page says the key is missing:** Check that `.env` is in the same folder as `server.js`, then stop and restart the server.
- **The key is rejected:** Confirm it was copied correctly and has finished activating at OpenWeatherMap.
- **Location does not work:** Allow the browser's location permission, or search by city.

Weather data is supplied by OpenWeatherMap. Chart.js and the fonts are loaded from public CDNs, so the dashboard needs an internet connection.
