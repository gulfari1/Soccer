const teamLogoMap = {
    'Manchester City': 'MCI',
    'Liverpool': 'LIV',
    'Chelsea': 'CHE',
    'Manchester United': 'MUN',
    'Tottenham': 'TOT',
    'Arsenal': 'ARS',
    'Leicester City': 'LEI',
    'West Ham': 'WHU',
    'Aston Villa': 'AVL',
    'Everton': 'EVE',
    'Newcastle United': 'NEW',
    'Wolverhampton Wanderers': 'WOL',
    'Brighton': 'BHA',
    'Southampton': 'SOU',
    'Crystal Palace': 'CRY',
    'Brentford': 'BRE',
    'Ipswich': 'IPS',
    'Nottingham Forest': 'NFO',
    'Fulham': 'FUL',
    'Bournemouth': 'BOU'
};

async function loadPlayerStats() {
    try {
        const response = await fetch('data/players.json');
        if (!response.ok) throw new Error('Network response was not ok');
        const players = await response.json();

        // Sort and display data for each stat
        const statContainers = {
            'goals': sorted => displayStatList(sorted, 'goals', '#goals-list'),
            'assists': sorted => displayStatList(sorted, 'assists', '#assists-list'),
            'xG': sorted => displayStatList(sorted, 'xG', '#xg-list'),
            'xA': sorted => displayStatList(sorted, 'xA', '#xa-list'),
            'shots': sorted => displayStatList(sorted, 'shots', '#shots-list'),
            'key_passes': sorted => displayStatList(sorted, 'key_passes', '#key-passes-list'),
            'yellow_cards': sorted => displayStatList(sorted, 'yellow_cards', '#yellow-cards-list'),
            'red_cards': sorted => displayStatList(sorted, 'red_cards', '#red-cards-list')
        };

        Object.entries(statContainers).forEach(([stat, handler]) => {
            const sorted = [...players].sort((a, b) => parseFloat(b[stat]) - parseFloat(a[stat])).slice(0, 10);
            handler(sorted);
        });

        document.getElementById('loading').style.display = 'none';
    } catch (error) {
        showError(`Error loading player data: ${error.message}`);
    }
}

function displayStatList(players, statType, containerId) {
    const container = document.querySelector(containerId);
    let html = '';
    
    players.forEach((player, index) => {
        const logoAbbreviation = teamLogoMap[player.team_title] || 'DEF';
        const statValue = ['xG', 'xA'].includes(statType) 
            ? parseFloat(player[statType]).toFixed(2)
            : player[statType];
        
        html += `
            <div class="player-row">
                <div class="rank">${index + 1}</div>
                <img class="club-logo" src="logos/${logoAbbreviation}.png" alt="${player.team_title}">
                <div class="player-name">${player.player_name}</div>
                <div class="stat-number">${statValue}</div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function showError(message) {
    document.getElementById('loading').style.display = 'none';
    const errorElement = document.getElementById('error');
    errorElement.style.display = 'block';
    errorElement.textContent = message;
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', loadPlayerStats);
