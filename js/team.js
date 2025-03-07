document.addEventListener('DOMContentLoaded', () => {
    // Get team name from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const teamName = decodeURIComponent(urlParams.get('team'));
    
    if (!teamName) {
        return showError('Team parameter is missing in the URL');
    }

    // Show loading state
    document.getElementById('loading').style.display = 'block';
    document.getElementById('error').style.display = 'none';

    // Load all required data
    Promise.all([
        fetch('data/data.json'),
        fetch('data/scores_fixtures.json')
    ])
    .then(([dataRes, fixturesRes]) => {
        if (!dataRes.ok) throw new Error('Failed to load team data');
        if (!fixturesRes.ok) throw new Error('Failed to load fixtures data');
        return Promise.all([dataRes.json(), fixturesRes.json()]);
    })
    .then(([teams, fixtures]) => {
        // Find the requested team
        const team = teams.find(t => 
            t.team.toLowerCase() === teamName.toLowerCase()
        );
        
        if (!team) {
            throw new Error(`Team "${teamName}" not found`);
        }

        // Set team header information
        document.getElementById('team-logo').src = team.logo;
        document.getElementById('team-name').textContent = team.team;

        // Get all matches for this team
        const allTeamMatches = fixtures.filter(f => 
            f.Home === team.team || f.Away === team.team
        );

        // Separate into past and future matches
        const pastMatches = allTeamMatches
            .filter(m => m.Played)
            .sort((a, b) => new Date(b.Date) - new Date(a.Date)); // Most recent first
            
        const futureMatches = allTeamMatches
            .filter(m => !m.Played)
            .sort((a, b) => new Date(a.Date) - new Date(b.Date)); // Soonest first

        // Render the sections
        renderNextMatch(team.team, futureMatches);
        renderLastMatches(team.team, pastMatches);
    })
    .catch(error => {
        console.error('Error:', error);
        showError(error.message);
    })
    .finally(() => {
        document.getElementById('loading').style.display = 'none';
    });
});

function renderNextMatch(teamName, futureMatches) {
    const container = document.getElementById('next-match');
    
    if (!futureMatches.length) {
        container.innerHTML = '<div class="no-matches">No upcoming matches scheduled</div>';
        return;
    }

    const nextMatch = futureMatches[0];
    const isHome = nextMatch.Home === teamName;
    const opponent = isHome ? nextMatch.Away : nextMatch.Home;
    const opponentCode = isHome ? nextMatch.AwayCode : nextMatch.HomeCode;
    const date = new Date(`${nextMatch.Date}T${nextMatch.Time}:00Z`);

    container.innerHTML = `
        <div class="next-match-info">
            <div class="match-date">
                ${date.toLocaleDateString('en-GB', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long' 
                })}
            </div>
            <div class="match-time">
                ${date.toLocaleTimeString('en-GB', {
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: 'UTC'
                })}
            </div>
            <div class="teams-container">
                <div class="team-info ${isHome ? 'home-team' : 'away-team'}">
                    <img src="logos/${teamName.replace(/\s+/g, '_')}.png" 
                         alt="${teamName}" class="team-logo">
                    <span>${teamName}</span>
                </div>
                <div class="vs">vs</div>
                <div class="team-info ${isHome ? 'away-team' : 'home-team'}">
                    <a href="team.html?team=${encodeURIComponent(opponent)}" class="team-link">
                        <img src="logos/${opponentCode}.png" 
                             alt="${opponent}" class="team-logo">
                        <span>${opponent}</span>
                    </a>
                </div>
            </div>
            <div class="match-venue">
                ${isHome ? 'Home' : 'Away'} Game
            </div>
        </div>
    `;
}

function renderLastMatches(teamName, pastMatches) {
    const container = document.getElementById('last-matches');
    
    if (!pastMatches.length) {
        container.innerHTML = '<div class="no-matches">No recent matches available</div>';
        return;
    }

    const last5 = pastMatches.slice(0, 5); // Get most recent 5 matches
    
    container.innerHTML = last5.map(match => {
        const isHome = match.Home === teamName;
        const [homeGoals, awayGoals] = match.Score.split('-').map(Number);
        const result = isHome ? 
            homeGoals > awayGoals ? 'win' : 
            homeGoals === awayGoals ? 'draw' : 'loss' :
            awayGoals > homeGoals ? 'win' : 
            homeGoals === awayGoals ? 'draw' : 'loss';
        
        const opponent = isHome ? match.Away : match.Home;
        const opponentCode = isHome ? match.AwayCode : match.HomeCode;
        const date = new Date(match.Date);

        return `
            <li class="match-result ${result}">
                <div class="match-date">
                    ${date.toLocaleDateString('en-GB')}
                </div>
                <div class="teams-container">
                    <div class="team-info">
                        <span>${teamName}</span>
                        <img src="logos/${teamName.replace(/\s+/g, '_')}.png" 
                             alt="${teamName}" class="team-logo">
                    </div>
                    <div class="score">
                        ${isHome ? homeGoals : awayGoals} - ${isHome ? awayGoals : homeGoals}
                    </div>
                    <div class="team-info">
                        <a href="team.html?team=${encodeURIComponent(opponent)}" class="team-link">
                            <img src="logos/${opponentCode}.png" 
                                 alt="${opponent}" class="team-logo">
                            <span>${opponent}</span>
                        </a>
                    </div>
                </div>
                <div class="match-result-text">
                    ${result.toUpperCase()}
                </div>
            </li>
        `;
    }).join('');
}

function showError(message) {
    const errorElement = document.getElementById('error');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    console.error(message);
}
