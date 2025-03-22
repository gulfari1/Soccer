document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const teamName = decodeURIComponent(urlParams.get('team'));
    const view = urlParams.get('view');
    document.getElementById('teamHeader').textContent = teamName;
    document.getElementById('allMatchesLink').href = `team.html?team=${encodeURIComponent(teamName)}&view=all`;

    loadTeamPage(teamName, view);
});

async function loadTeamPage(teamName, view) {
    try {
        const [scoresRes, dataRes] = await Promise.all([
            fetch('data/scores_fixtures.json'),
            fetch('data/data.json')
        ]);
        
        const allMatches = await scoresRes.json();
        const teamsData = await dataRes.json();
        
        // Find the current team's data and extract its code
        const currentTeamData = teamsData.find(team => team.team === teamName);
        if (!currentTeamData) {
            console.error(`Team "${teamName}" not found in standings data.`);
            return;
        }
        const teamCode = currentTeamData.logo.split('/').pop().split('.')[0].toUpperCase();
        
        // Filter matches using the team code
        const teamMatches = allMatches.filter(match => 
            match.HomeCode === teamCode || match.AwayCode === teamCode
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
        renderMiniStandings(teamsData, teamName);
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

function renderMiniStandings(teamsData, teamName) {
    const currentTeamData = teamsData.find(team => team.team === teamName);
    if (!currentTeamData) {
        console.error(`Team "${teamName}" not found in standings data.`);
        return;
    }
    const currentIndex = teamsData.indexOf(currentTeamData);
    const totalTeams = teamsData.length;
    const startIdx = Math.max(0, currentIndex - 4);
    const endIdx = Math.min(totalTeams - 1, currentIndex + 3);
    const miniStandings = teamsData.slice(startIdx, endIdx + 1);

    const tbody = document.getElementById('miniStandings');
    tbody.innerHTML = miniStandings.map((team, mapIdx) => {
        const position = startIdx + mapIdx + 1;
        const isCurrent = team.team === teamName;
        const code = team.logo.split('/').pop().split('.')[0].toUpperCase();
        return `
            <tr class="${isCurrent ? 'current-team' : ''}">
                <td>${position}</td>
                <td class="team-cell">
                    <img src="${team.logo}" alt="${team.team}" class="team-logo-small">
                    <span>${code}</span>
                </td>
                <td>${team.matches}</td>
                <td>${team.gd}</td>
                <td>${team.points}</td>
            </tr>
        `;
    }).join('');
}

function formatMatchDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
