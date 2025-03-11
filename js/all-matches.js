document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const teamName = decodeURIComponent(urlParams.get('team'));
    document.getElementById('allMatchesHeader').textContent = `${teamName} - All Matches`;

    loadAllMatches(teamName);
});

async function loadAllMatches(teamName) {
    try {
        const response = await fetch('data/scores_fixtures.json');
        if (!response.ok) throw new Error('Network response not ok');
        
        const allMatches = await response.json();
        const teamMatches = allMatches.filter(match => 
            match.Home === teamName || match.Away === teamName
        ).sort((a, b) => new Date(a.Date) - new Date(b.Date));

        renderAllMatches(teamMatches, teamName);
        document.getElementById('loading').style.display = 'none';
    } catch (error) {
        showError(`Error loading matches: ${error.message}`);
    }
}

function renderAllMatches(matches, teamName) {
    const container = document.getElementById('all-matches-list');
    const grouped = groupByGameweek(matches);

    container.innerHTML = Object.keys(grouped).sort((a, b) => a - b).map(week => `
        <div class="gameweek-section">
            <div class="date-header">Gameweek ${week}</div>
            <ul class="match-list">
                ${grouped[week].map(match => renderMatch(match, teamName)).join('')}
            </ul>
        </div>
    `).join('');
}

function renderMatch(match, teamName) {
    const isHome = match.Home === teamName;
    const opponent = isHome ? match.Away : match.Home;
    const opponentCode = isHome ? match.AwayCode : match.HomeCode;
    const isCompleted = match.Played;

    return `
    <li class="match-item">
        <div class="team-container ${isHome ? 'home-container' : 'away-container'}">
            <a href="team.html?team=${encodeURIComponent(teamName)}" class="team-link">
                <span class="team-code">${isHome ? match.HomeCode : match.AwayCode}</span>
                <img class="team-logo" src="logos/${isHome ? match.HomeCode : match.AwayCode}.png" alt="${teamName}">
            </a>
        </div>

        <div class="score-container">
            ${isCompleted ? `
                <div class="score">${match.Score}</div>
                <div class="match-status">${getMatchResult(match, teamName)}</div>
            ` : `
                <div class="time">${formatTimeGMT5(match.Date, match.Time)}</div>
                <div class="match-status">${formatMatchDate(match.Date)}</div>
            `}
        </div>

        <div class="team-container ${isHome ? 'away-container' : 'home-container'}">
            <a href="team.html?team=${encodeURIComponent(opponent)}" class="team-link">
                <img class="team-logo" src="logos/${opponentCode}.png" alt="${opponent}">
                <span class="team-code">${opponentCode}</span>
            </a>
        </div>
    </li>
    `;
}

function groupByGameweek(matches) {
    return matches.reduce((acc, match) => {
        const week = match.Wk;
        if (!acc[week]) acc[week] = [];
        acc[week].push(match);
        return acc;
    }, {});
}

function getMatchResult(match, teamName) {
    if (!match.Played) return '';
    const [homeGoals, awayGoals] = match.Score.split('-').map(Number);
    
    if (match.Home === teamName) {
        return homeGoals > awayGoals ? 'W' : homeGoals === awayGoals ? 'D' : 'L';
    }
    return awayGoals > homeGoals ? 'W' : awayGoals === homeGoals ? 'D' : 'L';
}

// Reuse existing formatting functions from scores.js
function formatTimeGMT5(dateStr, timeStr) { /* ... */ }
function formatMatchDate(dateStr) { /* ... */ }
function showError(message) { /* ... */ }
