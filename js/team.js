document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const teamName = decodeURIComponent(urlParams.get('team'));
    
    if (!teamName) {
        showError('Team parameter missing');
        return;
    }

    Promise.all([
        fetch('data/data.json'),
        fetch('data/scores_fixtures.json')
    ])
    .then(async ([teamRes, fixturesRes]) => {
        if (!teamRes.ok || !fixturesRes.ok) throw new Error('Network response error');
        
        const teamData = await teamRes.json();
        const fixturesData = await fixturesRes.json();
        
        const team = teamData.find(t => t.team === teamName);
        if (!team) throw new Error('Team not found');
        
        // Set team info
        document.getElementById('team-name').textContent = teamName;
        document.getElementById('team-logo').src = team.logo;

        // Process matches
        const teamFixtures = fixturesData.filter(f => 
            f.Home === teamName || f.Away === teamName
        );

        const now = new Date();
        const upcoming = [];
        const previous = [];

        teamFixtures.forEach(match => {
            const matchDate = new Date(match.Date);
            if (matchDate > now) {
                upcoming.push(match);
            } else {
                previous.push(match);
            }
        });

        renderMatches('upcoming-matches', upcoming, teamName);
        renderMatches('previous-matches', previous, teamName);
        
        document.getElementById('loading').style.display = 'none';
    })
    .catch(error => showError(error.message));

    function renderMatches(containerId, matches, teamName) {
        const container = document.getElementById(containerId);
        container.innerHTML = matches.map(match => `
            <div class="match-card">
                <div class="match-date">${formatDate(match.Date)}</div>
                <div class="match-teams">
                    <div class="team ${match.Home === teamName ? 'home-team' : ''}">
                        <img src="logos/${match.HomeCode}.png" alt="${match.Home}">
                        <span>${match.Home}</span>
                    </div>
                    <div class="score">${match.Played ? match.Score : formatTimeGMT5(match.Date, match.Time)}</div>
                    <div class="team ${match.Away === teamName ? 'home-team' : ''}">
                        <img src="logos/${match.AwayCode}.png" alt="${match.Away}">
                        <span>${match.Away}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            weekday: 'short', day: 'numeric', month: 'short'
        });
    }

    function showError(message) {
        document.getElementById('loading').style.display = 'none';
        const errorElement = document.getElementById('error');
        errorElement.style.display = 'block';
        errorElement.textContent = message;
    }
});
