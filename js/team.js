function renderNextMatch(teamName, fixtures) {
    const nextMatch = fixtures.find(f => 
        (f.Home === teamName || f.Away === teamName) && !f.Played
    );
    
    const container = document.querySelector('.next-match-section');
    if (!nextMatch) {
        container.innerHTML = '<div class="no-matches">No upcoming matches</div>';
        return;
    }

    const isHome = nextMatch.Home === teamName;
    const opponent = isHome ? nextMatch.Away : nextMatch.Home;
    const matchDate = new Date(`${nextMatch.Date}T${nextMatch.Time}`);
    
    // Format date display
    const dateOptions = { weekday: 'long', month: 'short', day: 'numeric' };
    const timeOptions = { hour: 'numeric', minute: '2-digit' };
    
    container.innerHTML = `
        <div class="match-header">
            <div class="league-name">Premier League</div>
            <div class="match-time">${matchDate.toLocaleTimeString('en-US', timeOptions)}</div>
        </div>
        
        <div class="teams-container">
            <div class="team-matchup">
                <img src="logos/${isHome ? teamLogoMap[teamName] : teamLogoMap[opponent]}.png" 
                     alt="${teamName}" class="team-logo-match">
                <div class="team-name">${teamName}</div>
            </div>
            <div class="vs">vs</div>
            <div class="team-matchup">
                <img src="logos/${isHome ? teamLogoMap[opponent] : teamLogoMap[teamName]}.png" 
                     alt="${opponent}" class="team-logo-match">
                <div class="team-name">${opponent}</div>
            </div>
        </div>
        
        <div class="match-date">${getRelativeDate(matchDate)}</div>
        <a href="scores.html" class="all-matches-link">All matches</a>
    `;
}

function renderFormResults(matches) {
    const formContainer = document.querySelector('.form-results');
    formContainer.innerHTML = matches.slice(-5).reverse().map(match => {
        const [homeGoals, awayGoals] = match.Score.split('-').map(Number);
        const isHome = match.Home === teamName;
        const result = isHome ? 
            homeGoals > awayGoals ? 'win' : 
            homeGoals === awayGoals ? 'draw' : 'loss' :
            awayGoals > homeGoals ? 'win' : 
            homeGoals === awayGoals ? 'draw' : 'loss';
        
        return `<div class="form-result ${result}">${match.Score}</div>`;
    }).join('');
}

// Helper function for date formatting
function getRelativeDate(date) {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    return date.toDateString() === today.toDateString() ? 'Today' :
           date.toDateString() === tomorrow.toDateString() ? 'Tomorrow' :
           date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}
