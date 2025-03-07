document.addEventListener('DOMContentLoaded', () => {
    const TEAM_CODES = {
        "Arsenal": "ARS", "Aston Villa": "AVL", "Bournemouth": "BOU",
        "Brentford": "BRE", "Brighton": "BHA", "Chelsea": "CHE",
        "Crystal Palace": "CRY", "Everton": "EVE", "Fulham": "FUL",
        "Liverpool": "LIV", "Manchester City": "MCI", "Manchester United": "MUN",
        "Newcastle United": "NEW", "Nottingham Forest": "NFO", "Southampton": "SOU",
        "Tottenham": "TOT", "West Ham": "WHU", "Wolves": "WOL"
    };

    // Get team name from URL hash
    const getTeamName = () => decodeURIComponent(window.location.hash.substring(1));

    // Load team data
    async function loadTeamData() {
        const teamName = getTeamName();
        if (!teamName) {
            window.location.href = '/Soccer/index.html'; // Redirect to home if no team name
            return;
        }

        document.getElementById('team-name').textContent = teamName;

        try {
            const [standingsRes, fixturesRes] = await Promise.all([
                fetch('data/data.json'),
                fetch('data/scores_fixtures.json')
            ]);
            
            const standings = await standingsRes.json();
            const fixtures = await fixturesRes.json();
            
            const teamData = standings.find(t => t.team === teamName);
            const teamFixtures = fixtures.filter(f => 
                f.Home === teamName || f.Away === teamName
            );

            // Next Match
            const nextMatch = teamFixtures.find(f => !f.Played);
            if (nextMatch) renderNextMatch(nextMatch, teamName);

            // Last 5 Matches
            const lastMatches = teamFixtures
                .filter(f => f.Played)
                .slice(-5)
                .reverse();
            renderLastMatches(lastMatches, teamName);

            // Form
            renderForm(teamData.form.split(' '));

        } catch (error) {
            console.error('Error:', error);
            document.getElementById('error').style.display = 'block';
        }
    }

    function renderNextMatch(match, currentTeam) {
        const isHome = match.Home === currentTeam;
        const opponent = isHome ? match.Away : match.Home;
        const date = new Date(`${match.Date}T${match.Time}`);

        document.getElementById('home-logo').src = `logos/${isHome ? TEAM_CODES[currentTeam] : TEAM_CODES[opponent]}.png`;
        document.getElementById('away-logo').src = `logos/${isHome ? TEAM_CODES[opponent] : TEAM_CODES[currentTeam]}.png`;
        document.getElementById('home-name').textContent = isHome ? currentTeam : opponent;
        document.getElementById('away-name').textContent = isHome ? opponent : currentTeam;
        document.getElementById('next-match-date').textContent = 
            date.toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'GMT' }) + ' GMT';
    }

    function renderLastMatches(matches, currentTeam) {
        const container = document.getElementById('last-matches-container');
        container.innerHTML = matches.map(match => {
            const isHome = match.Home === currentTeam;
            const opponent = isHome ? match.Away : match.Home;
            const [hScore, aScore] = match.Score.split('-');
            const score = isHome ? `${hScore}-${aScore}` : `${aScore}-${hScore}`;
            const result = isHome ? 
                (hScore > aScore ? 'W' : hScore === aScore ? 'D' : 'L') :
                (aScore > hScore ? 'W' : aScore === hScore ? 'D' : 'L');

            return `
                <a href="/Soccer/team/${encodeURIComponent(opponent)}" class="css-1avv34">
                    <div class="last-match-item">
                        <div class="css-1g3osz1">
                            <div class="css-13r3z72">
                                <img class="css-1sc344y" src="logos/${TEAM_CODES[opponent]}.png" alt="${opponent}">
                            </div>
                            <div class="css-1h89p79">${opponent}</div>
                        </div>
                        <div class="css-175oir">${score}</div>
                        <div class="${getFormClass(result)}">${result}</div>
                    </div>
                </a>
            `;
        }).join('');
    }

    function renderForm(form) {
        document.getElementById('form-container').innerHTML = form.map(res => 
            `<div class="${getFormClass(res)}">${res}</div>`
        ).join('');
    }

    function getFormClass(result) {
        return {
            'W': 'css-10r5qjf',
            'D': 'css-dde21q',
            'L': 'css-loss'
        }[result];
    }

    loadTeamData();
});
