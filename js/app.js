// Sélection des éléments DOM
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

// Votre token API
const METEO_API_TOKEN = "56b70f8ed4159987116c4b8f089f54681cbc39bedcb068b47f2f6345b62d86b3";

// Gestion du thème
themeToggle.addEventListener('change', () => {
    document.body.classList.toggle('dark-mode');
    if (document.body.classList.contains('dark-mode')) {
        localStorage.setItem('theme', 'dark');
    } else {
        localStorage.setItem('theme', 'light');
    }
});

// Charger le thème sauvegardé
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
    tooltip.textContent = `${value} jour${value > 1 ? 's' : ''}`;
}

daysRange.addEventListener('input', () => updateSleekRange(daysRange.value));

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    updateSleekRange(daysRange.value);
    
    // Animation au chargement
    document.querySelector('.fill').style.transition = 'none';
    document.querySelector('.bubble').style.transition = 'none';
    setTimeout(() => {
        document.querySelector('.fill').style.transition = '';
        document.querySelector('.bubble').style.transition = '';
    }, 10);
});

// Écouteur pour la saisie du code postal
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
            showError("Impossible de récupérer les communes. Veuillez réessayer.");
        }
    }
});

// Récupérer les communes depuis l'API
async function fetchTownsByPostalCode(postalCode) {
    const response = await fetch(`https://geo.api.gouv.fr/communes?codePostal=${postalCode}`);
    if (!response.ok) throw new Error('Erreur API');
    return await response.json();
}

// Afficher les options de communes
function displayTownOptions(towns) {
    townSelect.innerHTML = '';
    
    if (towns.length === 0) {
        showError("Aucune commune trouvée pour ce code postal.");
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

// Écouteur pour le bouton de validation
validateBtn.addEventListener('click', async () => {
    const selectedTownCode = townSelect.value;
    const days = parseInt(daysRange.value);
    
    if (!selectedTownCode || selectedTownCode.length !== 5) {
        showError("Veuillez sélectionner une commune valide");
        return;
    }

    try {
        weatherResults.innerHTML = '<div class="loading">Chargement en cours...</div>';
        const weatherData = await fetchWeatherForecast(selectedTownCode, days);
        
        if (weatherData.forecast.length === 0) {
            showError("Pas de prévisions disponibles pour cette commune");
        } else {
            displayWeatherForecast(weatherData);
        }
    } catch (error) {
        console.error("Erreur:", error);
        showError(`Impossible d'obtenir les données météo. Code: ${selectedTownCode}`);
    }
});




// Récupérer les prévisions météo
async function fetchWeatherForecast(townCode, days) {
    const url = `https://api.meteo-concept.com/api/forecast/daily?token=${METEO_API_TOKEN}&insee=${townCode}&start=0&end=${days-1}`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
        
        const data = await response.json();
        
        // Debug: affichez la structure complète reçue
        console.log("Données API complètes:", JSON.parse(JSON.stringify(data)));
        
        // Transformation des données pour uniformiser l'accès
        console.log("Latitude:", data.city.latitude);
        console.log("Longitude:", data.city.longitude);
        return {
            city: {
                name: data.city?.name || "Nom inconnu",
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
        console.error("Erreur fetchWeatherForecast:", error);
        throw error;
    }

    
}

// Afficher les prévisions météo
function displayWeatherForecast(weatherData) {
    weatherResults.innerHTML = '';
    console.log(weatherData)
    
    weatherData.forecast.forEach(day => {
        const date = day.datetime ? new Date(day.datetime) : new Date();
        const options = { weekday: 'long', day: 'numeric', month: 'long' };
        const formattedDate = date.toLocaleDateString('fr-FR', options);
        
        // Données principales
        const tempMin = day.tmin !== undefined ? Math.round(day.tmin) : 'N/A';
        const tempMax = day.tmax !== undefined ? Math.round(day.tmax) : 'N/A';
        const rainProb = day.probarain !== undefined ? Math.round(day.probarain) : 'N/A';
        const sunshine = day.sun_hours !== undefined ? day.sun_hours : 'N/A';

        // Icône météo
        const weatherIcon = getWeatherIcon(day.weather);

        // Création de la carte
        const dayElement = document.createElement('div');
        dayElement.className = 'weather-card';
        dayElement.innerHTML = `
            <div class="weather-date">${formattedDate}</div>
            <div class="weather-icon"><i class="fas ${weatherIcon}"></i></div>
            <div class="weather-temps">
                <span class="temp-max">${tempMax}°C</span>
                <span class="temp-min">${tempMin}°C</span>
            </div>
            <div class="weather-details">
                <div class="weather-detail"><i class="fas fa-umbrella"></i> ${rainProb}% pluie</div>
                <div class="weather-detail"><i class="fas fa-sun"></i> ${sunshine}h soleil</div>
            </div>
        `;

        // Données supplémentaires
        let additionalHtml = '';
        
        // Coordonnées
        if (showCoordinates.checked) {
    additionalHtml += `
        <div class="additional-detail">
            <span>Latitude:</span>
            <span>${weatherData.city.lat.toFixed(3) ?? 'N/A'}</span>
        </div>
        <div class="additional-detail">
            <span>Longitude:</span>
            <span>${weatherData.city.lon.toFixed(3) ?? 'N/A'}</span>
        </div>
    `;
}

        // Cumul de pluie
        if (showRainfall.checked && day.rr10 !== undefined) {
            additionalHtml += `
                <div class="additional-detail">
                    <span>Cumul pluie:</span>
                    <span>${day.rr10} mm</span>
                </div>
            `;
        }

        // Détails vent
        if (showWind.checked) {
    const windDir = day.dirwind10m || 'N/A';
    const windSpeed = day.wind10m || 'N/A';
    const windIcon = windDir !== 'N/A' ? getWindDirectionIcon(windDir) : '';
    
    additionalHtml += `
        <div class="additional-detail">
            <span>Vent moyen:</span>
            <span>${windSpeed} km/h</span>
        </div>
        <div class="additional-detail">
            <span>Direction:</span>
            <span>${windIcon} ${windDir !== 'N/A' ? windDir + '°' : 'N/A'}</span>
        </div>
    `;
}

        // Ajouter les données supplémentaires si nécessaire
        if (additionalHtml) {
            dayElement.innerHTML += `
                <div class="weather-additional">
                    ${additionalHtml}
                </div>
            `;
        }

        weatherResults.appendChild(dayElement);
    });
}

// Obtenir l'icône météo appropriée
function getWeatherIcon(weatherCode) {
    if (!weatherCode) return 'fa-cloud-sun';
    
    if (weatherCode >= 4 && weatherCode <= 7) return 'fa-cloud';
    if (weatherCode >= 10 && weatherCode <= 16) return 'fa-cloud-rain';
    if (weatherCode >= 20 && weatherCode <= 22) return 'fa-snowflake';
    if (weatherCode >= 30 && weatherCode <= 32) return 'fa-wind';
    if (weatherCode === 0 || weatherCode === 1) return 'fa-sun';
    
    return 'fa-cloud-sun';
}

// Obtenir l'icône de direction du vent
function getWindDirectionIcon(degrees) {
    const directions = ['↓', '↙', '←', '↖', '↑', '↗', '→', '↘'];
    const index = Math.round(((degrees % 360) / 45)) % 8;
    return `<span class="wind-direction">${directions[index]}</span>`;
}

// Afficher un message d'erreur
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

