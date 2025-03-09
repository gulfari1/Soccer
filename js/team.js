document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const teamName = decodeURIComponent(urlParams.get('team'));
    
    if (!teamName) {
        showError('Team not specified');
        return;
    }

    document.getElementById('teamHeader').textContent = `${teamName}`;
    loadTeamMatches(teamName);
});

async function loadTeamMatches(teamName) {
    try {
        const response = await fetch('data/scores_fixtures.json');
        if (!response.ok) throw new Error('Network response was not ok');
        
        const allMatches = await response.json();
        const teamMatches = allMatches.filter(match => 
            match.Home === teamName || match.Away === teamName
        );

        const today = new Date();
        const sortedMatches = teamMatches.sort((a, b) => new Date(a.Date) - new Date(b.Date));

        const pastMatches = sortedMatches.filter(m => new Date(m.Date) < today && m.Played);
        const upcomingMatches = sortedMatches.filter(m => new Date(m.Date) > today);
        const currentMatch = sortedMatches.find(m => 
            new Date(m.Date).toDateString() === today.toDateString()
        );

        renderMatchSection('.past-match', pastMatches.slice(-1)[0], teamName);
        renderMatchSection('.current-match', currentMatch, teamName);
        renderMatchSection('.upcoming-match', upcomingMatches[0], teamName);

        document.getElementById('loading').style.display = 'none';
    } catch (error) {
        showError(`Error loading matches: ${error.message}`);
    }
}

function renderMatchSection(selector, match, teamName) {
    const container = document.querySelector(selector + ' .match-card');
    if (!match) {
        container.innerHTML = '<div class="match-status">No match available</div>';
        return;
    }

    const isHome = match.Home === teamName;
    const date = new Date(match.Date).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric'
    });
    
    container.innerHTML = `
        <div class="match-header">
            <span class="match-date">${date}</span>
            <span class="competition">${match.Competition || 'Premier League'}</span>
        </div>
        <div class="match-content">
            <div class="team">
                <a href="team.html?team=${encodeURIComponent(match.Home)}">
                    <img src="logos/${match.HomeCode}.png" alt="${match.Home}" class="team-logo">
                </a>
                <span class="team-name">${match.Home}</span>
            </div>
            
            <div class="score">
                ${match.Played ? match.Score.replace('-', ' - ') : 'VS'}
            </div>

            <div class="team">
                <a href="team.html?team=${encodeURIComponent(match.Away)}">
                    <img src="logos/${match.AwayCode}.png" alt="${match.Away}" class="team-logo">
                </a>
                <span class="team-name">${match.Away}</span>
            </div>
        </div>
        ${!match.Played ? `
            <div class="match-status">
                ${formatTimeGMT5(match.Date, match.Time)}
            </div>
        ` : ''}
    `;
}

// Keep existing formatTimeGMT5 and showError functions
