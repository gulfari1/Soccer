document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const teamName = urlParams.get('team');
    if (!teamName) return showError('Team parameter missing');

    Promise.all([
        fetch('data/data.json'),
        fetch('data/scores_fixtures.json')
    ]).then(([dataRes, fixturesRes]) => {
        if (!dataRes.ok || !fixturesRes.ok) throw new Error('Data loading failed');
        return Promise.all([dataRes.json(), fixturesRes.json()]);
    }).then(([teams, fixtures]) => {
        const team = teams.find(t => t.team === teamName);
        if (!team) throw new Error('Team not found');

        // Set team header
        document.getElementById('team-logo').src = team.logo;
        document.getElementById('team-name').textContent = team.team;

        // Process matches
        const teamFixtures = fixtures.filter(f => 
            (f.Home === team.team || f.Away === team.team) && f.Score
        );

        renderNextMatch(team.team, fixtures);
        renderLastMatches(team.team, teamFixtures);
        
        document.getElementById('loading').style.display = 'none';
    }).catch(showError);
});

function renderNextMatch(teamName, fixtures) {
    const nextMatch = fixtures.find(f => 
        (f.Home === teamName || f.Away === teamName) && !f.Played
    );
    
    const container = document.getElementById('next-match');
    if (!nextMatch) return container.innerHTML = '<div>No upcoming matches</div>';

    const isHome = nextMatch.Home === teamName;
    const opponent = isHome ? nextMatch.Away : nextMatch.Home;
    const date = new Date(nextMatch.Date);
    
    container.innerHTML = `
        <div class="team-container">
            <a href="team.html?team=${encodeURIComponent(opponent)}" class="team-link">
                <img src="logos/${isHome ? nextMatch.AwayCode : nextMatch.HomeCode}.png" 
                     alt="${opponent}" class="team-logo">
                <span class="team-name">${opponent}</span>
            </a>
        </div>
        <div class="match-details">
            <div>${date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
            <div>${nextMatch.Time}</div>
            <div>${isHome ? 'Home' : 'Away'} Game</div>
        </div>
    `;
}

function renderLastMatches(teamName, matches) {
    const last5 = matches.slice(-5).reverse();
    const container = document.getElementById('last-matches');
    
    container.innerHTML = last5.map(match => {
        const isHome = match.Home === teamName;
        const [homeGoals, awayGoals] = match.Score.split('-').map(Number);
        const result = isHome ? 
            homeGoals > awayGoals ? 'win' : homeGoals === awayGoals ? 'draw' : 'loss' :
            awayGoals > homeGoals ? 'win' : homeGoals === awayGoals ? 'draw' : 'loss';
        
        return `
            <li class="match-result ${result}">
                <div class="opponent">
                    <a href="team.html?team=${encodeURIComponent(isHome ? match.Away : match.Home)}" class="team-link">
                        <img src="logos/${isHome ? match.AwayCode : match.HomeCode}.png" 
                             alt="${isHome ? match.Away : match.Home}">
                        <span>${isHome ? match.Away : match.Home}</span>
                    </a>
                </div>
                <div class="score">${match.Score}</div>
                <div class="date">${new Date(match.Date).toLocaleDateString()}</div>
            </li>
        `;
    }).join('');
}

function showError(message) {
    document.getElementById('loading').style.display = 'none';
    const error = document.getElementById('error');
    error.style.display = 'block';
    error.textContent = message;
}
