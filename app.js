// Initialize service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js')
    .then(registration => {
      console.log('ServiceWorker registration successful');
    })
    .catch(err => {
      console.log('ServiceWorker registration failed: ', err);
    });
}

// Client-side team name mappings (for mobile view)
const clientSideMappings = {
  "Manchester United": "Man Utd",
  "Manchester City": "Man City",
  "Newcastle United": "Newcastle",
  "Wolverhampton Wanderers": "Wolves",
  "Tottenham Hotspur": "Tottenham",
  "West Ham United": "West Ham",
  "Nottingham Forest": "Nottm Forest",
  "Leicester City": "Leicester",
  "Brighton & Hove Albion": "Brighton",
  "AFC Bournemouth": "Bournemouth",
  "Ipswich Town": "Ipswich"
};

// Cache variables
let cachedData = null;
const CACHE_KEY = 'pl-table-data';
const CACHE_EXPIRY = 30 * 60 * 1000; // 30 minutes

// Function to format the date with ordinal suffix
function getOrdinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return (s[(v - 20) % 10] || s[v] || s[0]);
}

// Function to format the date and time
function formatDateTime(date) {
  const day = date.getDate();
  const month = date.toLocaleString('default', { month: 'long' });
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${day}${getOrdinal(day)} ${month} ${year} at ${hours}:${minutes}`;
}

// Function to show error messages
function showError(message) {
  document.getElementById('loading').style.display = 'none';
  document.getElementById('error').style.display = 'block';
  document.getElementById('error').textContent = message;
}

// Function to save data to cache
function saveToCache(data) {
  const cacheData = {
    timestamp: new Date().getTime(),
    data: data
  };
  localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
}

// Function to get cached data
function getFromCache() {
  const cache = localStorage.getItem(CACHE_KEY);
  if (!cache) return null;
  
  const { timestamp, data } = JSON.parse(cache);
  const now = new Date().getTime();
  
  if (now - timestamp < CACHE_EXPIRY) {
    return data;
  }
  return null;
}

// Function to render table
function renderTable(data) {
  const tbody = document.querySelector('#leagueTable tbody');
  tbody.innerHTML = data.map((team, index) => `
    <tr class="${[3, 4, 16].includes(index) ? 'separator-row' : ''}">
      <td>${index + 1}</td>
      <td class="team-cell">
        <div class="team-logo-container">
          <img src="${team.logo}" alt="${team.team}" class="team-logo" loading="lazy">
        </div>
        <span class="team-name full">${team.team}</span>
        <span class="team-name short">${clientSideMappings[team.team] || team.team}</span>
      </td>
      <td>${team.matches}</td>
      <td class="mobile-hide">${team.wins}</td>
      <td class="mobile-hide">${team.draws}</td>
      <td class="mobile-hide">${team.losses}</td>
      <td class="mobile-hide">${team.gf}</td>
      <td class="mobile-hide">${team.ga}</td>
      <td>${team.gd}</td>
      <td><strong>${team.points}</strong></td>
      <td class="mobile-hide">
        <div class="form-container">
          ${team.form.split(' ').map((match, index) => `
            <div class="form-item ${match === 'W' ? 'form-win' : match === 'D' ? 'form-draw' : 'form-loss'}" 
                 style="--index: ${index}"
                 aria-label="${match === 'W' ? 'Win' : match === 'D' ? 'Draw' : 'Loss'}">
              ${match}
            </div>
          `).join('')}
        </div>
      </td>
    </tr>
  `).join('');

  document.getElementById('loading').style.display = 'none';
}

// Function to load data
async function loadData() {
  try {
    // Show skeleton loading
    document.getElementById('loading').innerHTML = `
      <div class="skeleton" style="height: 40px; margin: 5px 0;"></div>
      <div class="skeleton" style="height: 40px; margin: 5px 0;"></div>
      <div class="skeleton" style="height: 40px; margin: 5px 0;"></div>
    `;

    // Check cache first
    const cached = getFromCache();
    if (cached) {
      renderTable(cached);
      return;
    }

    const response = await fetch('data.json');
    if (!response.ok) throw new Error('Network response was not ok');

    // Get last modified date
    const lastModified = response.headers.get('last-modified');
    const updateDate = lastModified ? new Date(lastModified) : new Date();

    // Update last updated time
    const lastUpdatedDiv = document.querySelector('.last-updated');
    lastUpdatedDiv.textContent = `Last Updated ${formatDateTime(updateDate)}`;

    const data = await response.json();
    renderTable(data);
    saveToCache(data);
  } catch (error) {
    showError(`Error loading data: ${error.message}`);
  }
}

// Initialize analytics
function initAnalytics() {
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXX');
  
  // Track page views
  gtag('event', 'page_view', {
    page_title: 'Premier League Table',
    page_location: window.location.href,
    page_path: window.location.pathname
  });
}

// Initialize mobile menu
function initMobileMenu() {
  const menuBtn = document.querySelector('.mobile-menu-btn');
  const subNav = document.querySelector('.sub-nav');

  menuBtn.addEventListener('click', () => {
    menuBtn.classList.toggle('active');
    subNav.classList.toggle('active');
  });
}

// Initialize the app
function init() {
  initAnalytics();
  initMobileMenu();
  loadData();
  
  // Refresh data every 5 minutes
  setInterval(loadData, 5 * 60 * 1000);
}

// Run when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

// Register service worker
window.addEventListener('load', () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('ServiceWorker registration successful');
      })
      .catch(err => {
        console.log('ServiceWorker registration failed: ', err);
      });
  }
});
