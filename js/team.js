document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const teamName = urlParams.get('team');
    
    if (!teamName) {
        showError('No team specified');
        return;
    }

    loadTeamData(teamName);
});

async function loadTeamData(teamName) {
    try {
        const [teamData, fixtures] = await Promise.all([
            fetch('data/data.json').then(r => r.json()),
            fetch('data/scores_fixtures.json').then(r => r.json())
        ]);

        const team = teamData.find(t => t.team === teamName);
        if (!team) throw new Error('Team not found');

        // Set header info
        document.getElementById('team-name').textContent = teamName;
        document.getElementById('team-logo').src = team.logo;

        // Process matches
        const allMatches = fixtures.filter(m => 
            m.Home === teamName || m.Away === teamName
        );

        // Next match
        const nextMatch = allMatches.find(m => !m.Played);
        if (nextMatch) renderNextMatch(nextMatch, teamName);

        // Last 5 matches
        const lastMatches = allMatches
            .filter(m => m.Played)
            .slice(-5)
            .reverse();
        renderLastMatches(lastMatches, teamName);

        document.getElementById('loading').style.display = 'none';
    } catch (error) {
        showError(`Error loading team data: ${error.message}`);
    }
}

function renderNextMatch(match, currentTeam) {
    const isHome = match.Home === currentTeam;
    const container = document.getElementById('next-match');
    
    container.innerHTML = `
        <div class="match-team">
            <img src="logos/${isHome ? match.HomeCode : match.AwayCode}.png" 
                 class="match-logo" alt="${isHome ? match.Home : match.Away}">
            <span>${isHome ? 'Home' : 'Away'}</span>
        </div>
        <div class="match-vs">vs</div>
        <div class="match-team">
            <img src="logos/${isHome ? match.AwayCode : match.HomeCode}.png" 
                 class="match-logo" alt="${isHome ? match.Away : match.Home}">
            <span>${isHome ? match.Away : match.Home}</span>
        </div>
        <div class="match-details">
            <div>${new Date(match.Date).toLocaleDateString()}</div>
            <div>${match.Time}</div>
        </div>
    `;
}

function renderLastMatches(matches, currentTeam) {
    const container = document.getElementById('last-matches');
    
    container.innerHTML = matches.map(match => {
        const isHome = match.Home === currentTeam;
        const [homeGoals, awayGoals] = match.Score.split('-').map(Number);
        const result = isHome ? 
            (homeGoals > awayGoals ? 'win' : homeGoals < awayGoals ? 'loss' : 'draw') :
            (awayGoals > homeGoals ? 'win' : awayGoals < homeGoals ? 'loss' : 'draw');
        
        return `
            <div class="match-item result-${result}">
                <img src="logos/${match.HomeCode}.png" class="match-logo" alt="${match.Home}">
                <div class="score">${match.Score}</div>
                <img src="logos/${match.AwayCode}.png" class="match-logo" alt="${match.Away}">
                <div class="match-date">${new Date(match.Date).toLocaleDateString()}</div>
            </div>
        `;
    }).join('');
}

function showError(message) {
    document.getElementById('loading').style.display = 'none';
    const errorElement = document.getElementById('error');
    errorElement.style.display = 'block';
    errorElement.textContent = message;
}
