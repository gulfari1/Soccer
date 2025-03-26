document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const teamName = decodeURIComponent(urlParams.get('team'));
    const view = urlParams.get('view');
    document.getElementById('allMatchesLink').href = `team.html?team=${encodeURIComponent(teamName)}&view=all`;
    if (view === 'all') {
        document.getElementById('allMatchesLink').style.display = 'none';
    }

    loadTeamPage(teamName, view);
});

function getOrdinal(n) {
    const suffixes = ["th", "st", "nd", "rd"];
    const lastDigit = n % 10;
    const lastTwoDigits = n % 100;
    if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
        return n + "th";
    }
    switch (lastDigit) {
        case 1: return n + "st";
        case 2: return n + "nd";
        case 3: return n + "rd";
        default: return n + "th";
    }
}

async function loadTeamPage(teamName, view) {
    try {
        const [scoresRes, dataRes] = await Promise.all([
            fetch('data/scores_fixtures.json'),
            fetch('data/data.json')
        ]);
        
        const allMatches = await scoresRes.json();
        const teamsData = await dataRes.json();
        
        const currentTeamData = teamsData.find(team => team.team.toLowerCase() === teamName.toLowerCase());
        if (!currentTeamData) {
            console.error(`Team "${teamName}" not found in standings data.`);
            document.getElementById('teamHeader').innerHTML = `<h1>Team not found</h1>`;
            document.getElementById('miniStandings').innerHTML = '<tr><td colspan="5">Team not found in standings.</td></tr>';
            document.getElementById('teamMatches').innerHTML = '<p>No data available for this team.</p>';
            return;
        }

        // Set header with logo and position
        const position = teamsData.indexOf(currentTeamData) + 1;
        const positionText = getOrdinal(position) + " in Premier League";
        const headerHtml = `
            <div class="logo">
                <img src="${currentTeamData.logo}" alt="${teamName}"/>
            </div>
            <div class="team-name-position">
                <h1>${teamName}</h1>
                <p>${positionText}</p>
            </div>
        `;
        document.getElementById('teamHeader').innerHTML = headerHtml;

        const teamCode = currentTeamData.logo.split('/').pop().split('.')[0].toUpperCase();
        
        const teamMatches = allMatches.filter(match => 
            match.HomeCode === teamCode || match.AwayCode === teamCode
        ).sort((a, b) => new Date(a.Date) - new Date(b.Date));

        if (teamMatches.length === 0) {
            console.warn(`No matches found for team "${teamName}" with code "${teamCode}"`);
            document.getElementById('teamMatches').innerHTML = '<p>No matches found for this team.</p>';
        } else {
            let displayMatches;
            if (view === 'all') {
                displayMatches = teamMatches;
            } else {
                const recentMatches = teamMatches.filter(m => m.Played).slice(-1);
                const upcomingMatches = teamMatches.filter(m => !m.Played).slice(0, 3);
                displayMatches = [...recentMatches, ...upcomingMatches];
            }
            renderMatches(displayMatches, teamName, view === 'all');
        }
        
        if (view !== 'all') {
            renderMiniStandings(teamsData, teamName);
        } else {
            document.querySelector('.standings-container').style.display = 'none';
        }
    } catch (error) {
        console.error('Error loading team data:', error);
        document.getElementById('teamMatches').innerHTML = '<p>Error loading team data. Please try again later.</p>';
        document.querySelector('.standings-container').style.display = 'none';
    }
}

function renderMatches(matches, teamName, isAll = false) {
    const container = document.getElementById('teamMatches');
    let html = matches.map(match => {
        let header;
        if (isAll) {
            header = `
                <div class="match-header">
                    <span class="date">${formatDate(match.Date)}</span>
                    <span class="competition">Premier League</span>
                </div>
            `;
        } else {
            header = `<div class="competition-header">Premier League</div>`;
        }
        const homeTeamName = teamNameMapping[match.Home] || match.Home;
        const awayTeamName = teamNameMapping[match.Away] || match.Away;
        return `
            <div class="match-entry">
                ${header}
                <div class="match_details">
                    <div class="team home-team">
                        <a href="team.html?team=${encodeURI(homeTeamName)}" class="team-link">
                            <div class="team-code">${match.HomeCode}</div>
                            <div class="team-logo">
                                <img src="logos/${match.HomeCode}.png" alt="${homeTeamName}"/>
                            </div>
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
                        <a href="team.html?team=${encodeURI(awayTeamName)}" class="team-link">
                            <div class="team-logo">
                                <img src="logos/${match.AwayCode}.png" alt="${awayTeamName}"/>
                            </div>
                            <div class="team-code">${match.AwayCode}</div>
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

function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function formatMatchDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const teamNameMapping = {
    "Bouremouth": "AFC Bouremouth",
    "Ispwich Town": "Ipswich Town",
    "Leicster City": "Leicster City",
    "Liverpol": "Liverpol",
    "Newcasle United": "Newcastle United",
    "Newcastle Utd": "Newcastle United",
    "Nott'ham Forest": "Nottingam Forest",
    "Southamptn": "Southamptn",
    "Tottenham": "Tottenham Hotspurs",
    "Wolvers": "Wolverhampton Wanders",
    "Manchester Utd": "Manchester United"
};
