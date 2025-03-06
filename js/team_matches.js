document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const teamName = urlParams.get('team');

    if (!teamName) return;

    fetch('data/scores_fixtures.json')
        .then(response => response.json())
        .then(matches => {
            const teamMatches = matches.filter(match => 
                match.Home === teamName || match.Away === teamName
            );

            renderMatches(teamMatches, teamName);
            updateTeamHeader(teamName);
        });
});

function renderMatches(matches, teamName) {
    const container = document.getElementById('all-matches-list');
    
    matches.forEach(match => {
        const isHome = match.Home === teamName;
        const opponent = isHome ? match.Away : match.Home;
        const opponentCode = isHome ? match.AwayCode : match.HomeCode;
        const isPlayed = match.Played;
        const [homeScore, awayScore] = match.Score.split('-');
        
        const matchEl = document.createElement('div');
        matchEl.className = 'team-match-item';
        
        matchEl.innerHTML = `
            <div class="team-info">
                <img src="logos/${isHome ? teamName : opponentCode}.png" 
                     class="opponent-logo" alt="${isHome ? teamName : opponent}">
                <span>${isHome ? 'vs' : 'at'} ${opponent}</span>
            </div>
            <div class="match-details">
                ${isPlayed ? `
                    <div class="score">${homeScore} - ${awayScore}</div>
                    <div class="match-status finished">Played</div>
                ` : `
                    <div class="match-time">${match.Time}</div>
                    <div class="match-status upcoming">${match.Date}</div>
                `}
            </div>
        `;
        
        container.appendChild(matchEl);
    });
}

function updateTeamHeader(teamName) {
    document.title = `${teamName} Matches | Soccer`;
    document.getElementById('matches-team-name').textContent = `${teamName} Matches`;
    document.getElementById('matches-team-logo').src = `logos/${teamName.replace(/\s+/g, '_')}.png`;
}
