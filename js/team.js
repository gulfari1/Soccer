document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const teamName = decodeURIComponent(urlParams.get('team'));
    
    if (!teamName) {
        showError('Team not specified');
        return;
    }

    document.getElementById('teamHeader').textContent = `${teamName} Matches`;
    
    loadTeamMatches(teamName);
});

async function loadTeamMatches(teamName) {
    try {
        const response = await fetch('data/scores_fixtures.json');
        if (!response.ok) throw new Error('Network response was not ok');
        
        const allMatches = await response.json();
        const teamMatches = allMatches.filter(match => 
            match.Home === teamName || match.Away === teamName
        );

        renderMatches(teamMatches, teamName);
        document.getElementById('loading').style.display = 'none';
    } catch (error) {
        showError(`Error loading matches: ${error.message}`);
    }
}

function renderMatches(matches, teamName) {
    const container = document.getElementById('teamMatches');
    
    const groupedMatches = matches.reduce((acc, match) => {
        const date = new Date(match.Date).toLocaleDateString('en-GB', {
            day: 'numeric', month: 'short'
        });
        if (!acc[date]) acc[date] = [];
        acc[date].push(match);
        return acc;
    }, {});

    container.innerHTML = Object.entries(groupedMatches).map(([date, matches]) => `
        <div class="date-section">
            <div class="date-header">${date}</div>
            <ul class="match-list">
                ${matches.map(match => `
                    <li class="match-item">
                        <div class="competition">${match.Competition || 'Premier League'}</div>
                        <div class="match-status">${match.Played ? 'FT' : formatTimeGMT5(match.Date, match.Time)}</div>
                        <div class="teams-container">
                            <div class="team ${match.Home === teamName ? 'active-team' : ''}">
                                <img src="logos/${match.HomeCode}.png" alt="${match.Home}" class="team-logo">
                                <span>${match.Home}</span>
                            </div>
                            <div class="score">
                                ${match.Played ? match.Score.replace('-', ' : ') : 'vs'}
                            </div>
                            <div class="team ${match.Away === teamName ? 'active-team' : ''}">
                                <img src="logos/${match.AwayCode}.png" alt="${match.Away}" class="team-logo">
                                <span>${match.Away}</span>
                            </div>
                        </div>
                    </li>
                `).join('')}
            </ul>
        </div>
    `).join('');
}

function showError(message) {
    document.getElementById('loading').style.display = 'none';
    const errorElement = document.getElementById('error');
    errorElement.style.display = 'block';
    errorElement.textContent = message;
}

// Reuse from scores.js
function formatTimeGMT5(dateStr, timeStr) {
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day, hours, minutes));
    return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        timeZone: 'Asia/Karachi' 
    });
}
