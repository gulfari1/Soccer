document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const teamName = decodeURIComponent(urlParams.get('team'));
    document.getElementById('teamHeader').textContent = teamName;
    document.getElementById('allMatchesLink').href = `#all?team=${encodeURIComponent(teamName)}`;

    loadTeamMatches(teamName);
});

async function loadTeamMatches(teamName) {
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

        const recentMatches = teamMatches.filter(m => m.Played).slice(-1);
        const upcomingMatches = teamMatches.filter(m => !m.Played).slice(0, 3);
        const displayMatches = [...recentMatches, ...upcomingMatches];

        renderMatches(displayMatches, teamName);
    } catch (error) {
        console.error('Error loading team data:', error);
    }
}

function renderMatches(matches, teamName) {
    const container = document.getElementById('teamMatches');
    container.innerHTML = matches.map(match => `
        <div class="match-entry">
            <div class="competition-header">Premier League</div>
            <div class="match-details">
                <div class="team home-team">
                    <a href="team.html?team=${encodeURIComponent(match.Home)}" class="team-link">${match.HomeCode}</a>
                    <img src="logos/${match.HomeCode}.png" alt="${match.Home}">
                </div>
                <div class="match-info">
                    ${match.Played ? 
                        `<div class="score">${match.Score}</div>` :
                        `<div class="time">${match.Time}</div>`
                    }
                    <div class="match-status">${match.Played ? 'FT' : formatMatchDate(match.Date)}</div>
                </div>
                <div class="team away-team">
                    <img src="logos/${match.AwayCode}.png" alt="${match.Away}">
                    <a href="team.html?team=${encodeURIComponent(match.Away)}" class="team-link">${match.AwayCode}</a>
                </div>
            </div>
        </div>
    `).join('');
}

function formatMatchDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
