const addedCities = new Set();

function addCity() {
  let city = document.getElementById("cityInput").value.trim();
  if (!city) return;

  if (addedCities.has(city.toLowerCase())) {
    alert("City already added!");
    return;
  }

  fetchWeather(city);
  document.getElementById("cityInput").value = "";
}

function fetchWeather(city) {
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;

  fetch(url)
    .then(response => {
      if (!response.ok) throw new Error("City not found.");
      return response.json();
    })
    .then(data => {
      addedCities.add(data.name.toLowerCase());
      createWeatherCard(data);
    })
    .catch(error => {
      alert("Error: " + error.message);
    });
}

function createWeatherCard(data) {
  const emoji = getWeatherEmoji(data.weather[0].main);
  const card = document.createElement("div");
  card.className = "weather-card";
  card.innerHTML = `
    <div class="weather-emoji">${emoji}</div>
    <h2>${data.name}, ${data.sys.country}</h2>
    <div class="temp">${Math.round(data.main.temp)}°C</div>
    <div class="condition">${data.weather[0].main} (${data.weather[0].description})</div>
    <div class="details-row">
      <span>💧 ${data.main.humidity}%</span>
      <span>🔽 ${Math.round(data.main.temp_min)}°</span>
      <span>🔼 ${Math.round(data.main.temp_max)}°</span>
    </div>
  `;
  card.addEventListener('click', () => showCityDetails(data.coord.lat, data.coord.lon, data.name, data.sys.country));
  document.getElementById("citiesContainer").appendChild(card);
}

async function showCityDetails(lat, lon, name, country) {
  const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKeyWeatherAPI}&q=${lat},${lon}&days=3&aqi=no&alerts=yes`;
  const res = await fetch(url);
  const data = await res.json();

  // Weather alerts
  let alertsHtml = '';
  if (data.alerts && data.alerts.alert && data.alerts.alert.length > 0) {
    alertsHtml = `<div class="details-block"><h3>⚠️ Alerts</h3><ul>` +
      data.alerts.alert.map(a => `<li><b>${a.headline}</b>: ${a.desc}</li>`).join('') +
      `</ul></div>`;
  }

  // Today's hourly forecast (emojis)
  let hourlyHtml = '<div class="details-block"><h3>Today\'s Hourly Forecast</h3><div class="hourly-scroll">';
  if (data.forecast && data.forecast.forecastday && data.forecast.forecastday[0]) {
    const hours = data.forecast.forecastday[0].hour;
    for (let i = 0; i < 24; i++) {
      const hour = hours[i];
      const date = new Date(hour.time);
      const emoji = getWeatherEmoji(hour.condition.text);
      hourlyHtml += `
        <div style="text-align:center; min-width:60px;">
          <span style="font-size:2rem">${emoji}</span>
          <div style="font-size:1rem">${Math.round(hour.temp_c)}°C</div>
          <div style="font-size:0.9rem">${date.getHours()}h</div>
        </div>
      `;
    }
  } else {
    hourlyHtml += `<div>Hourly forecast unavailable.</div>`;
  }
  hourlyHtml += '</div></div>';

  // 3-day forecast (max/min)
  let dailyHtml = '<div class="details-block"><h3>3-Day Forecast</h3>';
  if (data.forecast && data.forecast.forecastday) {
    for (let i = 0; i < Math.min(3, data.forecast.forecastday.length); i++) {
      const day = data.forecast.forecastday[i];
      const date = new Date(day.date);
      dailyHtml += `
        <div class="details-row-emoji">
          <span>${getWeatherEmoji(day.day.condition.text)}</span>
          <div>
            <b>${date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })}</b><br>
            <span style="color:#f59e42;">${Math.round(day.day.maxtemp_c)}°C</span> /
            <span style="color:#60a5fa;">${Math.round(day.day.mintemp_c)}°C</span>
            <span style="font-size:1.1rem; color:#6b7280;">${day.day.condition.text}</span>
          </div>
        </div>
      `;
    }
  } else {
    dailyHtml += `<div>Daily forecast unavailable.</div>`;
  }
  dailyHtml += '</div>';

  // Details (including wind)
  const feelsLike = data.current ? Math.round(data.current.feelslike_c) : null;
  const temp = data.current ? Math.round(data.current.temp_c) : null;
  const wind = data.current ? data.current.wind_kph : null;
  const gust = data.current ? data.current.gust_kph : null;
  const windDir = data.current ? data.current.wind_degree : null;
  const uv = data.current ? data.current.uv : null;
  const humidity = data.current ? data.current.humidity : null;
  const dew = (data.current && humidity !== null) ? Math.round(getDewPoint(temp, humidity)) : null;

  const detailsHtml = `
    <div class="details-block">
      <h3>Details</h3>
      <div class="details-list">
        <div class="details-list-item">
          <span class="emoji">🌡</span>
          Temperature<br>
          <b>${feelsLike !== null ? feelsLike + "°C" : "N/A"}</b>
          <div class="details-desc">${feelsLike !== null && temp !== null && wind !== null ? getFeelsLikeDescription(feelsLike, temp, wind) : ""}</div>
        </div>
        <div class="details-list-item">
          <span class="emoji">༄｡°</span>Wind<br>
          <div style="margin-top:0.3em;">
            <div style="background:#f3f4f6;border-radius:8px;padding:0.3em 0.6em;margin-bottom:0.3em;">
              <b>Speed:</b> ${wind !== null ? wind + " km/h" : "N/A"}
            </div>
            <div style="background:#f3f4f6;border-radius:8px;padding:0.3em 0.6em;margin-bottom:0.3em;">
              <b>Gusts:</b> ${gust !== null ? gust + " km/h" : "N/A"}
            </div>
            <div style="background:#f3f4f6;border-radius:8px;padding:0.3em 0.6em;">
              <b>Direction:</b> ${windDir !== null ? getWindDirection(windDir) + ` (${windDir}°)` : "N/A"}
            </div>
          </div>
        </div>
        <div class="details-list-item">
          <span class="emoji">☀︎</span>
          UV<br>
          <b>${uv !== null ? uv : "N/A"}</b>
          <div class="details-desc">${uv !== null ? getUVDescription(uv) : ""}</div>
        </div>
        <div class="details-list-item">
          <span class="emoji">💧</span>
          Humidity<br>
          <b>${humidity !== null ? humidity + "%" : "N/A"}</b>
          <div class="details-desc">${dew !== null ? `Dew point: ${dew}°C` : ""}</div>
        </div>
        <div class="details-list-item">
          <span class="emoji">👁</span>
          Visibility<br>
          <b>${data.current ? data.current.vis_km + " km" : "N/A"}</b>
          <div class="details-desc">${data.current ? getVisibilityDescription(data.current.vis_km) : ""}</div>
        </div>
        <div class="details-list-item">
          <span class="emoji">🌨</span>
          Precipitation<br>
          <b>${data.current ? data.current.precip_mm + " mm" : "N/A"}</b>
        </div>
        <div class="details-list-item">
          <span class="emoji">🧭</span>
          Pressure<br>
          <b>${data.current ? data.current.pressure_mb + " hPa" : "N/A"}</b>
          ${data.current ? getPressureBar(data.current.pressure_mb) : ""}
        </div>
      </div>
    </div>
  `;

  // Wind Map (Windy.com)
  const mapHtml = `
    <div class="details-block">
      <h3>Wind Map</h3>
      <iframe
        width="100%"
        height="250"
        style="border-radius:16px;border:none;overflow:hidden;"
        src="https://embed.windy.com/embed2.html?lat=${lat}&lon=${lon}&zoom=7&level=surface&overlay=wind&menu=&message=true&marker=true"
        loading="lazy"
        referrerpolicy="no-referrer"
        allowfullscreen
      ></iframe>
    </div>
  `;

  // Mount panel
  document.getElementById('detailsPanel').innerHTML = `
    <div class="details-content">
      <button class="close-btn" onclick="closeDetailsPanel()">&times;</button>
      <h2 style="text-align:center; margin-bottom:1.5rem;">${name}, ${country}</h2>
      ${alertsHtml}
      ${hourlyHtml}
      ${dailyHtml}
      ${detailsHtml}
      ${mapHtml}
    </div>
  `;
  document.getElementById('detailsPanel').classList.add('active');
}

function closeDetailsPanel() {
  document.getElementById('detailsPanel').classList.remove('active');
}

// Emoji function (updated for text):
function getWeatherEmoji(text) {
  text = text.toLowerCase();
  if (text.includes('clear')) return '☀️';
  if (text.includes('sun')) return '☀️';
  if (text.includes('cloud')) return '☁️';
  if (text.includes('rain')) return '🌧️';
  if (text.includes('drizzle')) return '🌦️';
  if (text.includes('thunder')) return '⛈️';
  if (text.includes('snow')) return '❄️';
  if (text.includes('mist') || text.includes('fog')) return '🌫️';
  return '🌡️';
}

function getFeelsLikeDescription(feels, temp, wind) {
  if (feels < temp) return `Feels cooler due to wind (${wind} km/h)`;
  if (feels > temp) return `Feels warmer than actual`;
  return `Feels like actual temperature`;
}

function getUVDescription(uv) {
  if (uv < 3) return "Low";
  if (uv < 6) return "Moderate";
  if (uv < 8) return "High";
  if (uv < 11) return "Very high";
  return "Extreme";
}

function getWindDirection(deg) {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(deg / 45) % 8];
}

function getDewPoint(temp, humidity) {
  // Magnus formula (simplified)
  const a = 17.27, b = 237.7;
  const alpha = ((a * temp) / (b + temp)) + Math.log(humidity/100);
  return (b * alpha) / (a - alpha);
}

function getVisibilityDescription(vis) {
  if (vis >= 10) return "Excellent visibility";
  if (vis >= 5) return "Good visibility";
  if (vis >= 2) return "Moderate visibility";
  return "Low visibility";
}

function getPressureBar(pressure) {
  // 1013 hPa is average sea level pressure
  let percent = Math.min(Math.max((pressure - 980) / (1040 - 980), 0), 1);
  let color = percent > 0.5 ? "#60a5fa" : "#f59e42";
  let label = pressure < 1013 ? "Low" : pressure > 1025 ? "High" : "Normal";
  return `
    <div style="height:8px;width:90%;background:#e5e7eb;border-radius:4px;margin:0.3em auto 0.2em auto;overflow:hidden;">
      <div style="width:${percent*100}%;height:100%;background:${color};transition:width 0.5s"></div>
    </div>
    <div class="details-desc">${label}</div>
  `;
}

// The API keys come from config.js, which is not on GitHub
