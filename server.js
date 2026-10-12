require("dotenv").config();

const express = require("express");
const path = require("path");

const app = express();
const port = Number(process.env.PORT) || 3000;
const apiKey = process.env.OPENWEATHER_API_KEY;
const publicDirectory = path.join(__dirname, "public");

app.use(express.static(publicDirectory));

async function fetchOpenWeather(url) {
  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.message || "The weather service returned an error.");
    error.status = response.status;
    throw error;
  }

  return data;
}

app.get("/api/weather", async (req, res) => {
  if (!apiKey) {
    return res.status(503).json({
      error: "Add your OpenWeatherMap API key to the .env file, then restart the server."
    });
  }

  const city = typeof req.query.city === "string" ? req.query.city.trim() : "";
  const latitude = Number(req.query.lat);
  const longitude = Number(req.query.lon);
  const hasCoordinates = req.query.lat !== undefined || req.query.lon !== undefined;

  if (hasCoordinates) {
    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return res.status(400).json({ error: "A valid latitude and longitude are required." });
    }
  } else if (!city) {
    return res.status(400).json({ error: "Enter a city name or use your current location." });
  }

  try {
    let coordinates;

    if (hasCoordinates) {
      coordinates = { lat: latitude, lon: longitude };
    } else {
      const geocodingUrl = new URL("https://api.openweathermap.org/geo/1.0/direct");
      geocodingUrl.search = new URLSearchParams({
        q: city,
        limit: "1",
        appid: apiKey
      });
      const matches = await fetchOpenWeather(geocodingUrl);

      if (matches.length === 0) {
        return res.status(404).json({ error: `We couldn't find "${city}". Check the spelling and try again.` });
      }

      coordinates = { lat: matches[0].lat, lon: matches[0].lon };
    }

    const currentUrl = new URL("https://api.openweathermap.org/data/2.5/weather");
    currentUrl.search = new URLSearchParams({
      lat: String(coordinates.lat),
      lon: String(coordinates.lon),
      units: "metric",
      appid: apiKey
    });

    const forecastUrl = new URL("https://api.openweathermap.org/data/2.5/forecast");
    forecastUrl.search = new URLSearchParams({
      lat: String(coordinates.lat),
      lon: String(coordinates.lon),
      units: "metric",
      appid: apiKey
    });

    const [current, forecast] = await Promise.all([
      fetchOpenWeather(currentUrl),
      fetchOpenWeather(forecastUrl)
    ]);

    res.json({
      location: `${current.name}, ${current.sys.country}`,
      timezoneOffset: current.timezone,
      current: {
        temperature: current.main.temp,
        feelsLike: current.main.feels_like,
        humidity: current.main.humidity,
        windSpeed: current.wind.speed,
        description: current.weather[0].description,
        icon: current.weather[0].icon
      },
      forecast: forecast.list.map((entry) => ({
        time: entry.dt,
        temperature: entry.main.temp,
        description: entry.weather[0].description,
        icon: entry.weather[0].icon,
        precipitation: entry.pop
      }))
    });
  } catch (error) {
    console.error("Weather request failed:", error.message);

    if (error.status === 401) {
      return res.status(502).json({
        error: "OpenWeatherMap did not accept the API key. Check your key and try again."
      });
    }

    if (error.status) {
      return res.status(502).json({
        error: "The weather service is temporarily unavailable. Please try again shortly."
      });
    }

    return res.status(502).json({
      error: "Could not connect to the weather service. Check your internet connection and try again."
    });
  }
});

app.listen(port, () => {
  console.log(`Weather dashboard running at http://localhost:${port}`);

  if (!apiKey) {
    console.warn("OpenWeatherMap API key not set. Copy .env.example to .env and add your key.");
  }
});
