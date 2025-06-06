// DOM elements selection
const postalCodeInput = document.getElementById('postalCodeInput');
const townSelect = document.getElementById('townSelect');
const validateBtn = document.getElementById('validateBtn');
const townSelection = document.getElementById('townSelection');
const weatherResults = document.getElementById('weatherResults');
const themeToggle = document.getElementById('themeToggle');
const daysRange = document.getElementById('daysRange');
const daysValue = document.getElementById('daysValue');
const forecastSelection = document.getElementById('forecastSelection');
const additionalOptions = document.getElementById('additionalOptions');
const showCoordinates = document.getElementById('showCoordinates');
const showRainfall = document.getElementById('showRainfall');
const showWind = document.getElementById('showWind');

// API token
const METEO_API_TOKEN = "56b70f8ed4159987116c4b8f089f54681cbc39bedcb068b47f2f6345b62d86b3";

// Theme management
themeToggle.addEventListener('change', () => {
    document.body.classList.toggle('dark-mode');
    if (document.body.classList.contains('dark-mode')) {
        localStorage.setItem('theme', 'dark');
    } else {
        localStorage.setItem('theme', 'light');
    }
});

// Load saved theme
if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-mode');
    themeToggle.checked = true;
}

function updateSleekRange(value) {
    const percent = ((value - 1) / 6) * 100;
    const fill = document.querySelector('.fill');
    const bubble = document.querySelector('.bubble');
    const tooltip = document.querySelector('.tooltip');
    
    daysValue.textContent = value;
    fill.style.width = `${percent}%`;
    bubble.style.left = `${percent}%`;
    tooltip.textContent = `${value} day${value > 1 ? 's' : ''}`;
}

function initRangeSlider() {
    updateSleekRange(daysRange.value);
    
    // Temporarily disable transitions for initial load
    const fill = document.querySelector('.fill');
    const bubble = document.querySelector('.bubble');
    fill.style.transition = 'none';
    bubble.style.transition = 'none';
    
    setTimeout(() => {
        fill.style.transition = '';
        bubble.style.transition = '';
    }, 10);
}

function updateDaysDisplay() {
    const days = daysRange.value;
    daysValue.textContent = days;
    
    // Full version with plural handling
    const daysKey = `days-label-${days > 1 ? 'plural' : 'singular'}`;
    const baseText = translations[currentLang][daysKey] || translations[currentLang]['days-label'];
    document.querySelector('label[for="daysRange"]').innerHTML = baseText.replace('{days}', days);
}

document.addEventListener('DOMContentLoaded', () => {
    updateDaysDisplay(); // On load
    daysRange.addEventListener('input', updateDaysDisplay); // When slider moves
});

daysRange.addEventListener('input', () => updateSleekRange(daysRange.value));

document.addEventListener('DOMContentLoaded', initRangeSlider);
themeToggle.addEventListener('change', initRangeSlider);

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    updateSleekRange(daysRange.value);
    
    // Loading animation
    document.querySelector('.fill').style.transition = 'none';
    document.querySelector('.bubble').style.transition = 'none';
    setTimeout(() => {
        document.querySelector('.fill').style.transition = '';
        document.querySelector('.bubble').style.transition = '';
    }, 10);
});

// Listener for postal code input
postalCodeInput.addEventListener('input', async () => {
    const postalCode = postalCodeInput.value.trim();
    
    townSelection.style.display = 'none';
    additionalOptions.style.display = 'none';
    forecastSelection.style.display = 'none';
    weatherResults.innerHTML = '';

    if (/^\d{5}$/.test(postalCode)) {
        try {
            const towns = await fetchTownsByPostalCode(postalCode);
            displayTownOptions(towns);
        } catch (error) {
            showError("Unable to retrieve towns. Please try again.");
        }
    }
});

// Fetch towns from API
async function fetchTownsByPostalCode(postalCode) {
    const response = await fetch(`https://geo.api.gouv.fr/communes?codePostal=${postalCode}`);
    if (!response.ok) throw new Error('API Error');
    return await response.json();
}

// Display town options
function displayTownOptions(towns) {
    townSelect.innerHTML = '';
    
    if (towns.length === 0) {
        showError("No towns found for this postal code.");
        return;
    }
    
    towns.forEach(town => {
        const option = document.createElement('option');
        option.value = town.code;
        option.textContent = town.nom;
        townSelect.appendChild(option);
    });
    
    townSelection.style.display = 'block';
    additionalOptions.style.display = 'block';
    forecastSelection.style.display = 'block';
}

// Listener for validate button
validateBtn.addEventListener('click', async () => {
    const selectedTownCode = townSelect.value;
    const days = parseInt(daysRange.value);
    
    if (!selectedTownCode || selectedTownCode.length !== 5) {
        showError("Please select a valid town");
        return;
    }

    try {
        weatherResults.innerHTML = `<div class="loading">${translations[currentLang]['loading']}</div>`;
        const weatherData = await fetchWeatherForecast(selectedTownCode, days);
        
        if (weatherData.forecast.length === 0) {
            showError("No forecast available for this town");
        } else {
            displayWeatherForecast(weatherData);
        }
    } catch (error) {
        console.error("Error:", error);
        showError(`Unable to get weather data. Code: ${selectedTownCode}`);
    }
});

// Fetch weather forecast
async function fetchWeatherForecast(townCode, days) {
    const url = `https://api.meteo-concept.com/api/forecast/daily?token=${METEO_API_TOKEN}&insee=${townCode}&start=0&end=${days-1}`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        
        const data = await response.json();
        
        // Debug: display complete received structure
        console.log("Complete API data:", JSON.parse(JSON.stringify(data)));
        
        // Data transformation for uniform access
        console.log("Latitude:", data.city.latitude);
        console.log("Longitude:", data.city.longitude);
        return {
            city: {
                name: data.city?.name || translations[currentLang]['unknown-city'],
                lat: data.city?.latitude,
                lon: data.city?.longitude
            },
            forecast: data.forecast.map(day => ({
                ...day,
                windDirection: day.wind10m?.direction || day.direction,
                windSpeed: day.wind10m?.speed || day.wind10m
            }))
        };
    } catch (error) {
        console.error("fetchWeatherForecast Error:", error);
        throw error;
    }
}

// Display weather forecast
function displayWeatherForecast(weatherData) {
    weatherResults.innerHTML = '';
    console.log(weatherData);
    weatherData.forecast.forEach(day => {
        const date = day.datetime ? new Date(day.datetime) : new Date();
        const options = { weekday: 'long', day: 'numeric', month: 'long' };
        const formattedDate = date.toLocaleDateString(currentLang === 'fr' ? 'fr-FR' : 'en-US', options);
        
        // Main data
        const tempMin = day.tmin !== undefined ? Math.round(day.tmin) : 'N/A';
        const tempMax = day.tmax !== undefined ? Math.round(day.tmax) : 'N/A';
        const rainProb = day.probarain !== undefined ? Math.round(day.probarain) : 'N/A';
        const sunshine = day.sun_hours !== undefined ? day.sun_hours : 'N/A';

        // Weather icon
        const weatherIcon = getWeatherIcon(day.weather);

        // Card creation
        const dayElement = document.createElement('div');
        dayElement.className = 'weather-card';
        dayElement.innerHTML = `
            <div class="weather-date">${formattedDate}</div>
            <div class="weather-icon"><i class="fas ${weatherIcon}"></i></div>
            <div class="weather-temps">
                <span class="temp-max">${tempMax}°C</span>
                <span class="temp-min">${tempMin}°C</span>
            </div>
            <div class="weather-detail">
                <i class="fas fa-umbrella"></i> 
                    ${rainProb}% ${translations[currentLang]['rain-probability']}
            </div>
            <div class="weather-detail">
                <i class="fas fa-sun"></i> 
                        ${sunshine}h ${translations[currentLang]['sunshine']}
            </div>
        `;

        // Additional data
        let additionalHtml = '';
        
        // Coordinates
        if (showCoordinates.checked) {
            additionalHtml += `
                <div class="additional-detail">
                    <span class="translatable" data-key="latitude">${translations[currentLang]['latitude'] || 'Latitude'}</span>
                    <span>${weatherData.city.lat?.toFixed(3) ?? 'N/A'}</span>
                </div>
                <div class="additional-detail">
                    <span class="translatable" data-key="longitude">${translations[currentLang]['longitude'] || 'Longitude'}</span>
                    <span>${weatherData.city.lon?.toFixed(3) ?? 'N/A'}</span>
                </div>
            `;
        }

        // Rain accumulation
        if (showRainfall.checked && day.rr10 !== undefined) {
            additionalHtml += `
                <div class="additional-detail">
                    <span class="translatable" data-key="rain-amount">${translations[currentLang]['rain-amount'] || 'Rain amount'}</span>
                    <span>${day.rr10} mm</span>
                </div>
            `;
        }

        // Wind details
        if (showWind.checked) {
            const windDir = day.dirwind10m || 'N/A';
            const windSpeed = day.wind10m || 'N/A';
            const windIcon = windDir !== 'N/A' ? getWindDirectionIcon(windDir) : '';
            
            additionalHtml += `
                <div class="additional-detail">
                    <span class="translatable" data-key="wind-speed">${translations[currentLang]['wind-speed'] || 'Average wind'}</span>
                    <span>${windSpeed} km/h</span>
                </div>
                <div class="additional-detail">
                    <span class="translatable" data-key="wind-direction">${translations[currentLang]['wind-direction'] || 'Direction'}</span>
                    <span>${windIcon} ${windDir !== 'N/A' ? windDir + '°' : 'N/A'}</span>
                </div>
            `;
        }

        // Add additional data if needed
        if (additionalHtml) {
            dayElement.innerHTML += `
                <div class="weather-additional">
                    ${additionalHtml}
                </div>
            `;
        }

        weatherResults.appendChild(dayElement);
    });

    // Translate newly added dynamic elements
    translatePage(currentLang);
}

// Get appropriate weather icon
function getWeatherIcon(weatherCode) {
    if (!weatherCode) return 'fa-cloud-sun';
    
    if (weatherCode >= 4 && weatherCode <= 7) return 'fa-cloud';
    if (weatherCode >= 10 && weatherCode <= 16) return 'fa-cloud-rain';
    if (weatherCode >= 20 && weatherCode <= 22) return 'fa-snowflake';
    if (weatherCode >= 30 && weatherCode <= 32) return 'fa-wind';
    if (weatherCode === 0 || weatherCode === 1) return 'fa-sun';
    
    return 'fa-cloud-sun';
}

// Get wind direction icon
function getWindDirectionIcon(degrees) {
    const directions = ['↓', '↙', '←', '↖', '↑', '↗', '→', '↘'];
    const index = Math.round(((degrees % 360) / 45)) % 8;
    return `<span class="wind-direction">${directions[index]}</span>`;
}

let currentLang = localStorage.getItem('preferredLang') || 'fr';

function translatePage(lang) {
    currentLang = lang;
    localStorage.setItem('preferredLang', lang);
    
    // Translate elements with data-key
    document.querySelectorAll('[data-key]').forEach(el => {
        const key = el.getAttribute('data-key');
        if (translations[lang][key]) {
            el.textContent = translations[lang][key];
        }
    });
    
    // Translate placeholders
    document.querySelectorAll('[data-placeholder-key]').forEach(el => {
        const key = el.getAttribute('data-placeholder-key');
        if (translations[lang][key]) {
            el.placeholder = translations[lang][key];
        }
    });
    
    // Update language buttons
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === lang);
    });
    
    // Update page title
    document.title = `Instant Weather - ${translations[lang]['app-title']}`;
    updateDaysDisplay();

    document.querySelectorAll('.switch').forEach((el, index) => {
        const keys = ["aria-coordinates", "aria-rainfall", "aria-wind", "aria-theme"];
        if (translations[lang][keys[index]]) {
            el.setAttribute('aria-label', translations[lang][keys[index]]);
        }
    });
}

// Translation initialization
document.addEventListener('DOMContentLoaded', () => {
    translatePage(currentLang);
    
    // Handle clicks on language buttons
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            translatePage(btn.dataset.lang);
        });
    });
});

// Display error message
function showError(message, duration = 5000) {
    const existingError = document.querySelector('.error-message');
    if (existingError) existingError.remove();

    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <span>${message}</span>
    `;
    weatherResults.insertAdjacentElement('beforebegin', errorElement);

    if (duration > 0) {
        setTimeout(() => {
            errorElement.remove();
        }, duration);
    }
}