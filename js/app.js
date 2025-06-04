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

// Gestion du thème
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const icon = themeToggle.querySelector('i');
    if (document.body.classList.contains('dark-mode')) {
        icon.classList.replace('fa-moon', 'fa-sun');
        localStorage.setItem('theme', 'dark');
    } else {
        icon.classList.replace('fa-sun', 'fa-moon');
        localStorage.setItem('theme', 'light');
    }
});

// Charger le thème sauvegardé
if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-mode');
    themeToggle.querySelector('i').classList.replace('fa-moon', 'fa-sun');
}

// Écouteur d'événement pour la saisie du code postal
postalCodeInput.addEventListener('input', async () => {
    const postalCode = postalCodeInput.value.trim();
    
    townSelection.style.display = 'none';
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

// Fonction pour récupérer les communes depuis l'API
async function fetchTownsByPostalCode(postalCode) {
    const response = await fetch(`https://geo.api.gouv.fr/communes?codePostal=${postalCode}`);
    if (!response.ok) throw new Error('Erreur API');
    return await response.json();
}

daysRange.addEventListener('input', () => {
    daysValue.textContent = daysRange.value;
});

// Fonction pour afficher les options de communes
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
    forecastSelection.style.display = 'block';
}

// Écouteur pour le bouton de validation
validateBtn.addEventListener('click', async () => {
    const selectedTownCode = townSelect.value;
    const days = parseInt(daysRange.value); 
    
    if (selectedTownCode) {
        try {
            const weatherData = await fetchWeatherForecast(selectedTownCode, days);
            displayWeatherForecast(weatherData);
        } catch (error) {
            showError("Impossible d'obtenir les données météo pour cette commune.");
        }
    }
});

// Fonction pour récupérer les prévisions météo
async function fetchWeatherForecast(townCode, days) {
    const response = await fetch(
        `https://api.meteo-concept.com/api/forecast/daily?token=56b70f8ed4159987116c4b8f089f54681cbc39bedcb068b47f2f6345b62d86b3&insee=${townCode}&start=0&end=${days-1}`
    );
    if (!response.ok) throw new Error('Erreur API Météo');
    return await response.json();
}

// Fonction pour afficher les prévisions météo
function displayWeatherForecast(weatherData) {
    weatherResults.innerHTML = '';
    
    if (!weatherData || !weatherData.forecast || !Array.isArray(weatherData.forecast)) {
        showError("Données météo invalides");
        return;
    }

    weatherData.forecast.forEach(day => {
        const date = day.datetime ? new Date(day.datetime) : new Date();
        const options = { weekday: 'long', day: 'numeric', month: 'long' };
        const formattedDate = date.toLocaleDateString('fr-FR', options);
        
        // Extraction des données spécifiques
        const tempMin = day.tmin !== undefined ? Math.round(day.tmin) : 'N/A';
        const tempMax = day.tmax !== undefined ? Math.round(day.tmax) : 'N/A';
        const rainProb = day.probarain !== undefined ? Math.round(day.probarain) : 'N/A';
        const sunshine = day.sun_hours !== undefined ? day.sun_hours : 'N/A';

        // Sélection de l'icône météo
        let weatherIcon = getWeatherIcon(day.weather);

        // Création de la carte météo
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
        weatherResults.appendChild(dayElement);
    });
}

// Fonction helper pour les icônes météo
function getWeatherIcon(weatherCode) {
    if (!weatherCode) return 'fa-cloud-sun';
    
    if (weatherCode >= 4 && weatherCode <= 7) return 'fa-cloud';
    if (weatherCode >= 10 && weatherCode <= 16) return 'fa-cloud-rain';
    if (weatherCode >= 20 && weatherCode <= 22) return 'fa-snowflake';
    if (weatherCode >= 30 && weatherCode <= 32) return 'fa-wind';
    if (weatherCode === 0 || weatherCode === 1) return 'fa-sun';
    
    return 'fa-cloud-sun';
}