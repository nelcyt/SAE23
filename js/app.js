// Sélection des éléments DOM
const postalCodeInput = document.getElementById('postalCodeInput');
const townSelect = document.getElementById('townSelect');
const validateBtn = document.getElementById('validateBtn');
const townSelection = document.getElementById('townSelection');
const weatherResults = document.getElementById('weatherResults');

// Écouteur d'événement pour la saisie du code postal
postalCodeInput.addEventListener('input', async () => {
    const postalCode = postalCodeInput.value.trim();
    
    // Masquer la sélection de commune tant qu'on n'a pas un code postal valide
    townSelection.style.display = 'none';
    
    if (postalCode.length === 5 && /^\d+$/.test(postalCode)) {
        try {
            const towns = await fetchTownsByPostalCode(postalCode);
            displayTownOptions(towns);
        } catch (error) {
            showError("Impossible de récupérer les communes. Veuillez réessayer.");
        }
    }
});

// Écouteur pour le bouton de validation
validateBtn.addEventListener('click', async () => {
    const selectedTownCode = townSelect.value;
    
    if (selectedTownCode) {
        try {
            const weatherData = await fetchWeatherData(selectedTownCode);
            displayWeatherCard(weatherData);
        } catch (error) {
            showError("Impossible d'obtenir les données météo pour cette commune.");
        }
    }
});

// Fonction pour récupérer les communes depuis l'API
async function fetchTownsByPostalCode(postalCode) {
    const response = await fetch(`https://geo.api.gouv.fr/communes?codePostal=${postalCode}`);
    if (!response.ok) throw new Error('Erreur API');
    return await response.json();
}

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
}

// Fonction pour récupérer les données météo
async function fetchWeatherData(townCode) {
    const response = await fetch(
        `https://api.meteo-concept.com/api/forecast/daily/0?token=4bba169b3e3365061d39563419ab23e5016c0f838ba282498439c41a00ef1091&insee=${townCode}`
    );
    if (!response.ok) throw new Error('Erreur API Météo');
    return await response.json();
}

// Fonction pour afficher la carte météo
function displayWeatherCard(weatherData) {
    weatherResults.innerHTML = `
        <div class="weather-card">
            <h3>${weatherData.city.name}</h3>
            <p>Température: ${weatherData.forecast.temp2m}°C</p>
            <p>Conditions: ${weatherData.forecast.weather}</p>
            <p>Humidité: ${weatherData.forecast.rh2m}%</p>
            <p>Vent: ${weatherData.forecast.wind10m} km/h</p>
        </div>
    `;
}

// Fonction pour afficher les erreurs
function showError(message) {
    const existingError = document.querySelector('.error-message');
    if (existingError) existingError.remove();
    
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.textContent = message;
    weatherResults.insertAdjacentElement('beforebegin', errorElement);
    
    setTimeout(() => {
        errorElement.remove();
    }, 5000);
}