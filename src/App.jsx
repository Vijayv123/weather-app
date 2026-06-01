/* eslint-disable react-hooks/immutability */
import { useEffect, useState } from "react";
import "./App.css";

const COMMON_CITIES = ["Bangalore", "Mumbai", "Delhi", "Chennai", "Hyderabad"];

function App() {
  const [city, setCity] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [commonCitiesWeather, setCommonCitiesWeather] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const API_KEY = import.meta.env.VITE_WEATHER_API_KEY;

  useEffect(() => {
    fetchCommonCitiesWeather();
    fetchWeatherByCity("Bangalore");
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (city.trim().length >= 2) {
        fetchCitySuggestions(city);
      } else {
        setSuggestions([]);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [city]);

  const fetchCitySuggestions = async (searchText) => {
    try {
      const res = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${searchText}&limit=5&appid=${API_KEY}`
      );

      const data = await res.json();
      setSuggestions(data);
    } catch (err) {
      console.log("Suggestion error:", err);
    }
  };

  const fetchWeatherByCity = async (cityName) => {
    try {
      setLoading(true);
      setError("");
      setSuggestions([]);

      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${cityName}&appid=${API_KEY}&units=metric`
      );

      const data = await res.json();

      if (data.cod !== "200") {
        setError("City not found. Please try again.");
        setWeather(null);
        setForecast([]);
        return;
      }

      prepareWeatherData(data);
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchWeatherByCoords = async (lat, lon) => {
    try {
      setLocationLoading(true);
      setError("");
      setSuggestions([]);

      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
      );

      const data = await res.json();

      if (data.cod !== "200") {
        setError("Unable to fetch weather for your location.");
        return;
      }

      prepareWeatherData(data);
    } catch (err) {
      setError("Unable to fetch current location weather.");
    } finally {
      setLocationLoading(false);
    }
  };

  const prepareWeatherData = (data) => {
    const current = data.list[0];

    setWeather({
      city: data.city.name,
      country: data.city.country,
      temp: Math.round(current.main.temp),
      feelsLike: Math.round(current.main.feels_like),
      humidity: current.main.humidity,
      pressure: current.main.pressure,
      wind: current.wind.speed,
      description: current.weather[0].description,
      main: current.weather[0].main,
      icon: current.weather[0].icon,
    });

    const dailyForecast = data.list.filter((item) =>
      item.dt_txt.includes("12:00:00")
    );

    setForecast(dailyForecast.slice(0, 5));
  };

  const fetchCommonCitiesWeather = async () => {
    try {
      const results = await Promise.all(
        COMMON_CITIES.map(async (cityName) => {
          const res = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${API_KEY}&units=metric`
          );

          const data = await res.json();

          return {
            city: data.name,
            temp: Math.round(data.main.temp),
            description: data.weather[0].main,
            icon: data.weather[0].icon,
          };
        })
      );

      setCommonCitiesWeather(results);
    } catch (err) {
      console.log("Common city weather error:", err);
    }
  };

  const getCurrentLocationWeather = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        fetchWeatherByCoords(lat, lon);
      },
      () => {
        setError("Location permission denied. Please allow location access.");
      }
    );
  };

  const handleSearch = () => {
    if (!city.trim()) {
      setError("Please enter a city name.");
      return;
    }

    fetchWeatherByCity(city);
  };

  const handleSuggestionClick = (item) => {
    const selectedCity = `${item.name}${item.state ? `, ${item.state}` : ""}, ${
      item.country
    }`;

    setCity(selectedCity);
    setSuggestions([]);
    fetchWeatherByCoords(item.lat, item.lon);
  };

  const handleCommonCityClick = (cityName) => {
    setCity(cityName);
    fetchWeatherByCity(cityName);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <div>
            <h1>Weather Dashboard</h1>
            <p>Search weather, use current location, and compare cities</p>
          </div>

          <button className="location-btn" onClick={getCurrentLocationWeather}>
            {locationLoading ? "Detecting..." : "Use My Location"}
          </button>
        </header>

        <div className="search-section">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search city name..."
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onKeyDown={handleKeyDown}
            />

            <button onClick={handleSearch}>
              {loading ? "Searching..." : "Search"}
            </button>
          </div>

          {suggestions.length > 0 && (
            <div className="suggestions">
              {suggestions.map((item, index) => (
                <div
                  className="suggestion-item"
                  key={`${item.name}-${item.lat}-${index}`}
                  onClick={() => handleSuggestionClick(item)}
                >
                  <span>{item.name}</span>
                  <small>
                    {item.state ? `${item.state}, ` : ""}
                    {item.country}
                  </small>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && <p className="error">{error}</p>}

        {weather && (
          <section className="main-weather">
            <div className="weather-info">
              <h2>
                {weather.city}, {weather.country}
              </h2>

              <p className="weather-type">{weather.description}</p>

              <div className="temp-box">
                <img
                  src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
                  alt={weather.description}
                />
                <h3>{weather.temp}°C</h3>
              </div>
            </div>

            <div className="weather-details">
              <div>
                <span>Feels Like</span>
                <strong>{weather.feelsLike}°C</strong>
              </div>

              <div>
                <span>Humidity</span>
                <strong>{weather.humidity}%</strong>
              </div>

              <div>
                <span>Wind Speed</span>
                <strong>{weather.wind} m/s</strong>
              </div>

              <div>
                <span>Pressure</span>
                <strong>{weather.pressure} hPa</strong>
              </div>
            </div>
          </section>
        )}

        {forecast.length > 0 && (
          <section className="forecast-section">
            <h2>5-Day Forecast</h2>

            <div className="forecast-grid">
              {forecast.map((item) => (
                <div className="forecast-card" key={item.dt}>
                  <p>
                    {new Date(item.dt_txt).toLocaleDateString("en-IN", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
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
          </section>
        )}

        <section className="common-section">
          <h2>Common Cities Weather</h2>

          <div className="common-grid">
            {commonCitiesWeather.map((item) => (
              <div
                className="common-card"
                key={item.city}
                onClick={() => handleCommonCityClick(item.city)}
              >
                <h3>{item.city}</h3>

                <img
                  src={`https://openweathermap.org/img/wn/${item.icon}.png`}
                  alt={item.description}
                />

                <h4>{item.temp}°C</h4>
                <p>{item.description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default App;