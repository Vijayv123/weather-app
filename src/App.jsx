import { useState } from "react";
import "./App.css";

function App() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [error, setError] = useState("");

  const API_KEY = import.meta.env.VITE_WEATHER_API_KEY;

  const getWeather = async () => {
    if (!city.trim()) {
      setError("Please enter a city name");
      return;
    }

    try {
      setError("");
      setWeather(null);
      setForecast([]);

      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`
      );

      const data = await res.json();
      console.log(data);

      if (data.cod !== "200") {
        setError("City not found. Please try again.");
        return;
      }

      const current = data.list[0];

      setWeather({
        city: data.city.name,
        country: data.city.country,
        temp: Math.round(current.main.temp),
        humidity: current.main.humidity,
        wind: current.wind.speed,
        description: current.weather[0].description,
        icon: current.weather[0].icon,
      });

      const dailyForecast = data.list.filter((item) =>
        item.dt_txt.includes("12:00:00")
      );

      setForecast(dailyForecast.slice(0, 5));
    } catch {
      setError("Something went wrong. Please try again.");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      getWeather();
    }
  };

  return (
    <div className="app">
      <div className="weather-card">
        <h1>Weather App</h1>
        <p className="subtitle">Search city weather and 5-day forecast</p>

        <div className="search-box">
          <input
            type="text"
            placeholder="Enter city name"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button onClick={getWeather}>Search</button>
        </div>

        {error && <p className="error">{error}</p>}

        {weather && (
          <div className="current-weather">
            <h2>
              {weather.city}, {weather.country}
            </h2>

            <img
              src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
              alt={weather.description}
            />

            <h3>{weather.temp}°C</h3>
            <p>{weather.description}</p>

            <div className="details">
              <div>
                <strong>{weather.humidity}%</strong>
                <span>Humidity</span>
              </div>
              <div>
                <strong>{weather.wind} m/s</strong>
                <span>Wind Speed</span>
              </div>
            </div>
          </div>
        )}

        {forecast.length > 0 && (
          <div className="forecast">
            <h2>5-Day Forecast</h2>

            <div className="forecast-list">
              {forecast.map((item) => (
                <div className="forecast-card" key={item.dt}>
                  <p>
                    {new Date(item.dt_txt).toLocaleDateString("en-IN", {
                      weekday: "short",
                      day: "numeric",
                    })}
                  </p>

                  <img
                    src={`https://openweathermap.org/img/wn/${item.weather[0].icon}.png`}
                    alt={item.weather[0].description}
                  />

                  <h4>{Math.round(item.main.temp)}°C</h4>
                  <small>{item.weather[0].main}</small>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;