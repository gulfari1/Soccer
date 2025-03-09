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
        ).sort((a, b) => new Date(a.Date) - new Date(b.Date));

        const now = new Date();
        const previousMatches = [];
        const upcomingMatches = [];
        let currentMatch = null;

        teamMatches.forEach(match => {
            const matchDate = new Date(match.Date);
            if (matchDate < now) previousMatches.push(match);
            else upcomingMatches.push(match);
        });

        // Get most recent previous match
        const previousMatch = previousMatches.slice(-1)[0];
        // Get next upcoming match (current)
        currentMatch = upcomingMatches[0];
        // Get following upcoming match
        const upcomingMatch = upcomingMatches[1] || upcomingMatches[0];

        renderMatch('previous', previousMatch, teamName);
        renderMatch('current', currentMatch, teamName);
        renderMatch('upcoming', upcomingMatch, teamName);

        document.getElementById('loading').style.display = 'none';
    } catch (error) {
        showError(`Error loading matches: ${error.message}`);
    }
}

function renderMatch(type, match, teamName) {
    const container = document.querySelector(`.${type}-match`);
    if (!match) {
        container.style.display = 'none';
        return;
    }

    const dateOptions = { day: 'numeric', month: 'short' };
    const matchDate = new Date(match.Date).toLocaleDateString('en-GB', dateOptions);
    
    container.querySelector('.match-date').textContent = matchDate;
    container.querySelector('.match-competition').textContent = match.Competition || 'Premier League';

    const isHome = match.Home === teamName;
    const homeTeam = match.Home;
    const awayTeam = match.Away;

    container.querySelector('.home-team').innerHTML = `
        ${isHome ? `<strong>${homeTeam}</strong>` : homeTeam}
        <img src="logos/${match.HomeCode}.png" class="team-logo">
    `;

    container.querySelector('.away-team').innerHTML = `
        <img src="logos/${match.AwayCode}.png" class="team-logo">
        ${!isHome ? `<strong>${awayTeam}</strong>` : awayTeam}
    `;

    const scoreContainer = container.querySelector('.score-container');
    if (match.Played) {
        scoreContainer.innerHTML = `
            <div class="score">${match.Score.split('-')[0]}</div>
            <div class="divider">:</div>
            <div class="score">${match.Score.split('-')[1]}</div>
        `;
    } else {
        const matchTime = formatTimeGMT5(match.Date, match.Time);
        scoreContainer.innerHTML = `<div class="match-time">${matchTime}</div>`;
    }
}

function showError(message) {
    document.getElementById('loading').style.display = 'none';
    const errorElement = document.getElementById('error');
    errorElement.style.display = 'block';
    errorElement.textContent = message;
}

function formatTimeGMT5(dateStr, timeStr) {
    const [year, month, day] = dateStr.split('-');
    const [hours, minutes] = timeStr.split(':');
    const date = new Date(Date.UTC(year, month - 1, day, hours, minutes));
    return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        timeZone: 'Asia/Karachi'
    });
}
