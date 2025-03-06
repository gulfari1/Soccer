document.addEventListener('DOMContentLoaded', () => {
    const teamName = new URLSearchParams(window.location.search).get('team');
    if (!teamName) return;

    Promise.all([
        fetch('data/scores_fixtures.json').then(r => r.json()),
        fetch('data/data.json').then(r => r.json())
    ]).then(([fixtures, standings]) => {
        const teamData = standings.find(t => t.team === teamName);
        const teamFixtures = fixtures.filter(f => 
            f.Home === teamName || f.Away === teamName
        );

        renderNextMatch(teamFixtures, teamName);
        renderTeamForm(teamFixtures, teamName);
        updateTeamHeader(teamData);
        renderAllMatchesButton(teamName);
    });
});

function renderNextMatch(fixtures, team) {
    const nextMatch = fixtures.find(f => !f.Played);
    if (!nextMatch) return;

    const isHome = nextMatch.Home === team;
    const opponent = isHome ? nextMatch.Away : nextMatch.Home;
    const opponentCode = isHome ? nextMatch.AwayCode : nextMatch.HomeCode;

    document.getElementById('next-match-competition').textContent = 'Premier League';
    document.getElementById('next-match-date').textContent = 
        new Date(nextMatch.Date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    document.getElementById('next-match-time').textContent = 
        nextMatch.Time.replace(/:\d+$/, '');

    document.getElementById('home-logo').src = `logos/${isHome ? team : opponent}.png`;
    document.getElementById('away-logo').src = `logos/${isHome ? opponent : team}.png`;
    document.getElementById('home-team').textContent = isHome ? team : opponent;
    document.getElementById('away-team').textContent = isHome ? opponent : team;
}

function renderTeamForm(fixtures, team) {
    const formContainer = document.getElementById('form-matches');
    const playedMatches = fixtures.filter(f => f.Played).slice(-5);

    formContainer.innerHTML = playedMatches.map(match => {
        const isHome = match.Home === team;
        const [homeScore, awayScore] = match.Score.split('-').map(Number);
        const teamScore = isHome ? homeScore : awayScore;
        const opponentScore = isHome ? awayScore : homeScore;
        const result = teamScore > opponentScore ? 'win' : 
                       teamScore === opponentScore ? 'draw' : 'loss';
        const opponentCode = isHome ? match.AwayCode : match.HomeCode;

        return `
            <div class="form-match">
                <div class="score-box ${result}">${teamScore}-${opponentScore}</div>
                <img src="logos/${opponentCode}.png" class="opponent-logo" 
                     alt="${isHome ? match.Away : match.Home}">
            </div>
        `;
    }).join('');
}

function updateTeamHeader(teamData) {
    document.title = `${teamData.team} | Soccer`;
    document.getElementById('team-name').textContent = teamData.team;
    document.getElementById('team-logo').src = teamData.logo;
}

function renderAllMatchesButton(teamName) {
    const allMatchesBtn = document.createElement('a');
    allMatchesBtn.href = `team_matches.html?team=${encodeURIComponent(teamName)}`;
    allMatchesBtn.className = 'all-matches-btn';
    allMatchesBtn.textContent = 'All Matches';
    document.querySelector('.next-match-container').appendChild(allMatchesBtn);
}
