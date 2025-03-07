document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const teamName = decodeURIComponent(urlParams.get('team'));
    
    // Load team data
    Promise.all([
        fetch('data/data.json').then(r => r.json()),
        fetch('data/scores_fixtures.json').then(r => r.json())
    ]).then(([standings, fixtures]) => {
        // Set team header
        document.getElementById('team-name').textContent = teamName;
        const teamData = standings.find(t => t.team === teamName);
        if (teamData) {
            document.getElementById('team-logo').src = teamData.logo;
        }

        // Show schedule
        renderFixtures(fixtures, teamName);
        
        // Show condensed standings
        renderStandings(standings, teamName);
    });

    function renderFixtures(fixtures, team) {
        const teamFixtures = fixtures.filter(f => 
            f.Home === team || f.Away === team
        );

        const container = document.getElementById('team-fixtures');
        container.innerHTML = teamFixtures.map(match => `
            <div class="match-item">
                <div class="match-date">${new Date(match.Date).toLocaleDateString()}</div>
                <div class="teams">
                    <div class="team ${match.Home === team ? 'bold' : ''}">
                        <img src="logos/${match.HomeCode}.png" alt="${match.Home}">
                        <span>${match.Home}</span>
                    </div>
                    <div class="vs">vs</div>
                    <div class="team ${match.Away === team ? 'bold' : ''}">
                        <img src="logos/${match.AwayCode}.png" alt="${match.Away}">
                        <span>${match.Away}</span>
                    </div>
                </div>
                ${match.Score !== 'TBD' ? 
                    `<div class="score">${match.Score}</div>` :
                    `<div class="time">${match.Time}</div>`
                }
            </div>
        `).join('');
    }

    function renderStandings(standings, team) {
        const sorted = [...standings].sort((a, b) => 
            b.points - a.points || b.gd - a.gd
        );

        // Get top 7 + current team
        const relevantStandings = sorted.slice(0, 7);
        if (!relevantStandings.find(t => t.team === team)) {
            relevantStandings.push(sorted.find(t => t.team === team));
        }

        const tbody = document.querySelector('#team-standings tbody');
        tbody.innerHTML = relevantStandings.map((teamData, index) => `
            <tr class="${teamData.team === team ? 'selected-team' : ''}">
                <td>${index + 1}</td>
                <td>
                    <img src="${teamData.logo}" class="team-logo-small">
                    ${teamData.team}
                </td>
                <td>${teamData.matches}</td>
                <td>${teamData.gd}</td>
                <td><strong>${teamData.points}</strong></td>
            </tr>
        `).join('');
    }
});
