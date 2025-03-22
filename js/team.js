document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const teamName = decodeURIComponent(urlParams.get('team'));
    const view = urlParams.get('view');
    document.getElementById('teamHeader').textContent = teamName;
    document.getElementById('allMatchesLink').href = `team.html?team=${encodeURIComponent(teamName)}&view=all`;

    loadTeamMatches(teamName, view);
});

async function loadTeamMatches(teamName, view) {
    try {
        const [scoresRes, dataRes] = await Promise.all([
            fetch('data/scores_fixtures.json'),
            fetch('data/data.json')
        ]);
        
        const allMatches = await scoresRes.json();
        const teamsData = await dataRes.json();
        
        const teamMatches = allMatches.filter(match => 
            match.Home === teamName || match.Away === teamName
        ).sort((a, b) => new Date(a.Date) - new Date(b.Date));

        let displayMatches;
        if (view === 'all') {
            displayMatches = teamMatches; // Show all matches for the team
        } else {
            const recentMatches = teamMatches.filter(m => m.Played).slice(-1);
            const upcomingMatches = teamMatches.filter(m => !m.Played).slice(0, 3);
            displayMatches = [...recentMatches, ...upcomingMatches]; // Default view
        }

        renderMatches(displayMatches, teamName, view === 'all');
    } catch (error) {
        console.error('Error loading team data:', error);
    }
}

function renderMatches(matches, teamName, isAll = false) {
    const container = document.getElementById('teamMatches');
    let html = matches.map(match => {
        let header = `<div class="competition-header">Premier League</div>`;
        if (isAll) {
            header = `
                <div class="match-header">
                    <span class="gameweek">GW ${match.Wk}</span>
                    <span class="competition">Premier League</span>
                </div>
            `;
        }
        return `
            <div class="match-entry">
                ${header}
                <div class="match-details">
                    <div class="team home-team">
                        <a href="team.html?team=${encodeURIComponent(match.Home)}" class="team-link">
                            <span>${match.HomeCode}</span>
                            <img src="logos/${match.HomeCode}.png" alt="${match.Home}">
                        </a>
                    </div>
                    <div class="match-info">
                        ${match.Played ? 
                            `<div class="score">${match.Score}</div>` :
                            `<div class="time">${match.Time}</div>`
                        }
                        <div class="match-status">${match.Played ? 'FT' : formatMatchDate(match.Date)}</div>
                    </div>
                    <div class="team away-team">
                        <a href="team.html?team=${encodeURIComponent(match.Away)}" class="team-link">
                            <img src="logos/${match.AwayCode}.png" alt="${match.Away}">
                            <span>${match.AwayCode}</span>
                        </a>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    container.innerHTML = html;
}

function formatMatchDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
