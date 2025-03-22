document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const teamName = decodeURIComponent(urlParams.get('team'));
    const view = urlParams.get('view');
    document.getElementById('teamHeader').textContent = teamName;

    // Hide "All Matches" link if on "all matches" page
    if (view === 'all') {
        document.getElementById('allMatchesLink').style.display = 'none';
    } else {
        document.getElementById('allMatchesLink').href = `team.html?team=${encodeURIComponent(teamName)}&view=all`;
    }

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
        
        // Find the current team's data case-insensitively
        const currentTeamData = teamsData.find(team => team.team.toLowerCase() === teamName.toLowerCase());
        if (!currentTeamData) {
            console.error(`Team "${teamName}" not found in standings data.`);
            document.getElementById('teamMatches').innerHTML = '<p>No data available for this team.</p>';
            return;
        }
        
        const teamCode = currentTeamData.logo.split('/').pop().split('.')[0].toUpperCase();
        
        // Filter matches using the team code
        const teamMatches = allMatches.filter(match => 
            match.HomeCode === teamCode || match.AwayCode === teamCode
        ).sort((a, b) => new Date(a.Date) - new Date(b.Date));

        if (teamMatches.length === 0) {
            console.warn(`No matches found for team "${teamName}" with code "${teamCode}"`);
            document.getElementById('teamMatches').innerHTML = '<p>No matches found for this team.</p>';
        } else {
            let displayMatches;
            if (view === 'all') {
                displayMatches = teamMatches; // Show all matches for the team
            } else {
                const recentMatches = teamMatches.filter(m => m.Played).slice(-1);
                const upcomingMatches = teamMatches.filter(m => !m.Played).slice(0, 3);
                displayMatches = [...recentMatches, ...upcomingMatches]; // Default view
            }
            renderMatches(displayMatches, teamName, view === 'all');
        }
        
        // Only render mini standing table if not on "all matches" page
        if (view !== 'all') {
            renderMiniStandings(teamsData, teamName);
        }
    } catch (error) {
        console.error('Error loading team data:', error);
        document.getElementById('teamMatches').innerHTML = '<p>Error loading team data. Please try again later.</p>';
    }
}

function renderMatches(matches, teamName, isAll = false) {
    const container = document.getElementById('teamMatches');
    let html = matches.map(match => {
        let header;
        if (isAll) {
            // Format date as "Wed, Mar 5"
            const date = new Date(match.Date);
            const day = date.toLocaleDateString('en-US', { weekday: 'short' });
            const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            header = `
                <div class="match-header">
                    <span class="match-date">${day}, ${monthDay}</span>
                    <span class="competition">Premier League</span>
                </div>
            `;
        } else {
            header = `<div class="competition-header">Premier League</div>`;
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
    const currentTeamData = teamsData.find(team => team.team.toLowerCase() === teamName.toLowerCase());
    if (!currentTeamData) {
        console.error(`Team "${teamName}" not found in standings data.`);
        document.getElementById('miniStandings').innerHTML = '<tr><td colspan="5">Team not found in standings.</td></tr>';
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
        const isCurrent = team.team.toLowerCase() === teamName.toLowerCase();
        const code = team.logo.split('/').pop().split('.')[0].toUpperCase();
        return `
            <div class="standings-row ${isCurrent ? 'current-team' : ''}">
                <td>${position}</td>
                <td class="team-cell">
                    <img src="${team.logo}" alt="${team.team}" class="team-logo-small">
                    <span>${code}</span>
                </td>
                <td>${team.matches}</td>
                <td>${team.gd}</td>
                <td>${team.points}</td>
            </div>
        `;
    }).join('');
}

function formatMatchDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
