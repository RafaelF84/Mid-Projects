const apiKey = "4e51deb1077084e38482986828c3f282";
const addedCities = new Set();

function addCity() {
  let city = document.getElementById("cityInput").value.trim();
  if (!city) return;

  if (addedCities.has(city.toLowerCase())) {
    alert("Cidade já adicionada!");
    return;
  }

  fetchWeather(city);
  document.getElementById("cityInput").value = "";
}

function fetchWeather(city) {
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;

  fetch(url)
    .then(response => {
      if (!response.ok) throw new Error("Cidade não encontrada.");
      return response.json();
    })
    .then(data => {
      addedCities.add(data.name.toLowerCase());
      createWeatherCard(data);
    })
    .catch(error => {
      alert("Erro: " + error.message);
    });
}

function createWeatherCard(data) {
  const card = document.createElement("div");
  card.className = "weather-card";
  card.innerHTML = `
    <h2>${data.name}, ${data.sys.country}</h2>
    <p><strong>🌡 Temperatura:</strong> ${data.main.temp} °C</p>
    <p><strong>💧 Humidade:</strong> ${data.main.humidity}%</p>
    <p><strong>🌥 Condição:</strong> ${data.weather[0].main} (${data.weather[0].description})</p>
  `;
  card.addEventListener('click', () => showCityDetails(data.coord.lat, data.coord.lon, data.name, data.sys.country));
  document.getElementById("citiesContainer").appendChild(card);
}

async function showCityDetails(lat, lon, name, country) {
  const apiKeyWeatherAPI = "d60ca2bcfb5f417793c223218251006";
  const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKeyWeatherAPI}&q=${lat},${lon}&days=3&aqi=no&alerts=yes`;

  const res = await fetch(url);
  const data = await res.json();

  // Avisos meteorológicos
  let alertsHtml = '';
  if (data.alerts && data.alerts.alert && data.alerts.alert.length > 0) {
    alertsHtml = `<div><strong>⚠️ Weather Alerts:</strong><ul>` +
      data.alerts.alert.map(a => `<li>${a.headline}: ${a.desc}</li>`).join('') +
      `</ul></div>`;
  }

  // Previsão 24h (com emojis)
  let hourlyHtml = '<div class="hourly-scroll">';
  if (data.forecast && data.forecast.forecastday && data.forecast.forecastday[0]) {
    const hours = data.forecast.forecastday[0].hour;
    for (let i = 0; i < 24; i++) {
      const hour = hours[i];
      const date = new Date(hour.time);
      const emoji = getWeatherEmoji(hour.condition.text);
      hourlyHtml += `
        <div style="text-align:center; min-width:60px;">
          <div style="font-size:2rem">${emoji}</div>
          <div style="font-size:1rem">${Math.round(hour.temp_c)}°C</div>
          <div style="font-size:0.9rem">${date.getHours()}h</div>
        </div>
      `;
    }
  } else {
    hourlyHtml += `<div>Hourly forecast unavailable.</div>`;
  }
  hourlyHtml += '</div>';

  // Previsão 3 dias (máx/min)
  let dailyHtml = '<div style="margin:1rem 0"><strong>3-day Forecast:</strong><br>';
  if (data.forecast && data.forecast.forecastday) {
    for (let i = 0; i < Math.min(3, data.forecast.forecastday.length); i++) {
      const day = data.forecast.forecastday[i];
      const date = new Date(day.date);
      dailyHtml += `
        <div>
          ${date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}:
          <span style="color:#f59e42;">${Math.round(day.day.maxtemp_c)}°C</span> /
          <span style="color:#60a5fa;">${Math.round(day.day.mintemp_c)}°C</span>
          ${getWeatherEmoji(day.day.condition.text)}
        </div>
      `;
    }
  } else {
    dailyHtml += `<div>Daily forecast unavailable.</div>`;
  }
  dailyHtml += '</div>';

  // Outros dados
  const detailsHtml = `
    <div><strong>Feels Like:</strong> ${data.current ? Math.round(data.current.feelslike_c) + "°C" : "N/A"}</div>
    <div><strong>UV Index:</strong> ${data.current ? data.current.uv : "N/A"}</div>
    <div><strong>Visibility:</strong> ${data.current ? data.current.vis_km + " km" : "N/A"}</div>
    <div><strong>Humidity:</strong> ${data.current ? data.current.humidity + "%" : "N/A"}</div>
    <div><strong>Precipitation:</strong> ${data.current ? data.current.precip_mm + " mm" : "N/A"}</div>
    <div><strong>Pressure:</strong> ${data.current ? data.current.pressure_mb + " hPa" : "N/A"}</div>
  `;

  // Mapa (continua igual)
  const mapHtml = `
    <div style="margin:1rem 0">
      <strong>Map:</strong><br>
      <img src="https://static-maps.yandex.ru/1.x/?lang=en_US&ll=${lon},${lat}&z=10&l=map&size=450,200" style="border-radius:12px;">
    </div>
  `;

  // Montar painel
  document.getElementById('detailsPanel').innerHTML = `
    <div class="details-content">
      <button class="close-btn" onclick="closeDetailsPanel()">&times;</button>
      <h2>${name}, ${country}</h2>
      ${alertsHtml}
      <h3>Today's Hourly Forecast</h3>
      ${hourlyHtml}
      <h3>3 Days</h3>
      ${dailyHtml}
      ${mapHtml}
      <h3>Details</h3>
      ${detailsHtml}
    </div>
  `;
  document.getElementById('detailsPanel').classList.add('active');
}

function closeDetailsPanel() {
  document.getElementById('detailsPanel').classList.remove('active');
}

// Função de emoji:
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

// As chaves vêm do config.js, que não está no GitHub
