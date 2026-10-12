const searchForm = document.querySelector("#search-form");
const cityInput = document.querySelector("#city-input");
const searchButton = searchForm.querySelector("button");
const locationButton = document.querySelector("#location-button");
const errorMessage = document.querySelector("#error-message");
const chartCanvas = document.querySelector("#temperature-chart");

let temperatureChart;

function weatherIconUrl(icon) {
  return `https://openweathermap.org/img/wn/${encodeURIComponent(icon)}@2x.png`;
}

function formatTemperature(value) {
  return `${Math.round(value)}°`;
}

function localDate(timestamp, timezoneOffset) {
  return new Date((timestamp + timezoneOffset) * 1000);
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.hidden = false;
}

function clearError() {
  errorMessage.textContent = "";
  errorMessage.hidden = true;
}

function setLoading(isLoading) {
  searchButton.disabled = isLoading;
  locationButton.disabled = isLoading;
  searchButton.textContent = isLoading ? "Loading..." : "Search";
}

async function loadWeather(parameters) {
  clearError();
  setLoading(true);

  const query = new URLSearchParams(parameters);

  try {
    const response = await fetch(`/api/weather?${query}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Could not load the weather. Please try again.");
    }

    renderWeather(data);
  } catch (error) {
    showError(error.message || "Could not load the weather. Please try again.");
  } finally {
    setLoading(false);
  }
}

function renderWeather(data) {
  document.querySelector("#location-name").textContent = data.location;
  document.querySelector("#temperature").innerHTML = `${Math.round(data.current.temperature)}<span>°</span>`;
  document.querySelector("#condition").textContent = data.current.description;
  document.querySelector("#feels-like").textContent = formatTemperature(data.current.feelsLike);
  document.querySelector("#humidity").textContent = `${data.current.humidity}%`;
  document.querySelector("#wind-speed").textContent = `${data.current.windSpeed} m/s`;

  const currentIcon = document.querySelector("#current-icon");
  currentIcon.src = weatherIconUrl(data.current.icon);
  currentIcon.alt = data.current.description;
  currentIcon.hidden = false;

  renderChart(data.forecast, data.timezoneOffset);
  renderForecast(data.forecast, data.timezoneOffset);
}

function renderChart(forecast, timezoneOffset) {
  const nextHours = forecast.slice(0, 8);
  const labels = nextHours.map((entry) => {
    const date = localDate(entry.time, timezoneOffset);
    return `${String(date.getUTCHours()).padStart(2, "0")}:00`;
  });

  if (temperatureChart) {
    temperatureChart.destroy();
  }

  temperatureChart = new Chart(chartCanvas, {
    type: "line",
    data: {
      labels,
      datasets: [{
        data: nextHours.map((entry) => Math.round(entry.temperature)),
        borderColor: "#a7e9d2",
        backgroundColor: (context) => {
          const { chart } = context;
          const { ctx, chartArea } = chart;

          if (!chartArea) {
            return "rgba(167, 233, 210, 0.16)";
          }

          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, "rgba(167, 233, 210, 0.22)");
          gradient.addColorStop(1, "rgba(167, 233, 210, 0)");
          return gradient;
        },
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
        pointBackgroundColor: "#a7e9d2",
        tension: 0.38,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          displayColors: false,
          callbacks: { label: (context) => `${context.parsed.y}°C` }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: { color: "#92a0a8", maxTicksLimit: 5, font: { size: 10 } }
        },
        y: {
          grid: { color: "rgba(220, 239, 237, 0.07)" },
          border: { display: false },
          ticks: {
            color: "#92a0a8",
            maxTicksLimit: 4,
            font: { size: 10 },
            callback: (value) => `${value}°`
          }
        }
      }
    }
  });
}

function renderForecast(forecast, timezoneOffset) {
  const days = new Map();

  forecast.forEach((entry) => {
    const date = localDate(entry.time, timezoneOffset);
    const key = `${date.getUTCFullYear()}-${date.getUTCMonth()}-${date.getUTCDate()}`;

    if (!days.has(key)) {
      days.set(key, { date, entry });
    }
  });

  const forecastList = document.querySelector("#forecast-list");
  forecastList.replaceChildren();

  [...days.values()].slice(0, 5).forEach(({ date, entry }, index) => {
    const card = document.createElement("div");
    card.className = "forecast-day";

    const dayName = document.createElement("span");
    dayName.className = "forecast-name";
    dayName.textContent = index === 0
      ? "Today"
      : new Intl.DateTimeFormat(undefined, { weekday: "short", timeZone: "UTC" }).format(date);

    const icon = document.createElement("img");
    icon.src = weatherIconUrl(entry.icon);
    icon.alt = "";
    icon.loading = "lazy";

    const condition = document.createElement("span");
    condition.className = "forecast-condition";
    condition.textContent = entry.description;

    const temperature = document.createElement("strong");
    temperature.className = "forecast-temperature";
    temperature.textContent = `${Math.round(entry.temperature)}°C`;

    card.append(dayName, icon, condition, temperature);
    forecastList.append(card);
  });
}

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const city = cityInput.value.trim();

  if (!city) {
    showError("Type a city name to see its weather.");
    cityInput.focus();
    return;
  }

  loadWeather({ city });
});

locationButton.addEventListener("click", () => {
  clearError();

  if (!navigator.geolocation) {
    showError("Your browser does not support location. Search for a city instead.");
    return;
  }

  setLoading(true);
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => loadWeather({ lat: coords.latitude, lon: coords.longitude }),
    (error) => {
      setLoading(false);
      if (error.code === error.PERMISSION_DENIED) {
        showError("Location permission was denied. Allow location access or search for a city.");
      } else if (error.code === error.TIMEOUT) {
        showError("Finding your location took too long. Please try again or search for a city.");
      } else {
        showError("Could not get your location. Search for a city instead.");
      }
    },
    { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
  );
});

loadWeather({ city: "London" });
