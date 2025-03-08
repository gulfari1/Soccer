// js/team.js
document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const teamName = urlParams.get('team');

    if (!teamName) {
        document.getElementById('team-info').innerHTML = '<p>Team not specified.</p>';
        return;
    }

    fetch('data/data.json')
        .then(response => response.json())
        .then(standingsData => {
            const team = standingsData.find(t => t.team === teamName);
            if (!team) {
                document.getElementById('team-info').innerHTML = '<p>Team not found.</p>';
                return;
            }

            // Display team info
            document.getElementById('team-info').innerHTML = `
                <img src="${team.logo}" alt="${team.team}" class="team-logo">
                <h1>${team.team}</h1>
            `;

            // Display team matches
            fetch('data/scores_fixtures.json')
                .then(response => response.json())
                .then(matchesData => {
                    const teamMatches = matchesData.filter(match => match.Home === team.team || match.Away === team.team);
                    const matchesHtml = teamMatches.map(match => `
                        <div class="match-item">
                            <div class="team-container home-container">
                                <span class="team-code">${match.HomeCode}</span>
                                <img class="team-logo" src="logos/${match.HomeCode}.png" alt="${match.Home}">
                            </div>
                            <div class="score-container">
                                ${match.Score ? `<div class="score">${match.Score}</div>` : `<div class="match-time">${match.Time}</div>`}
                            </div>
                            <div class="team-container away-container">
                                <img class="team-logo" src="logos/${match.AwayCode}.png" alt="${match.Away}">
                                <span class="team-code">${match.AwayCode}</span>
                            </div>
                        </div>
                    `).join('');
                    document.getElementById('team-matches').innerHTML = matchesHtml;
                });

            // Display team standings
            const teamIndex = standingsData.indexOf(team);
            const start = Math.max(0, teamIndex - 4);
            const end = Math.min(standingsData.length, teamIndex + 4);
            const relevantStandings = standingsData.slice(start, end);

            const standingsHtml = relevantStandings.map((t, index) => `
                <tr>
                    <td>${start + index + 1}</td>
                    <td class="team-cell">
                        <div class="team-logo-container">
                            <img src="${t.logo}" alt="${t.team}" class="team-logo">
                        </div>
                        <span class="team-name">${t.team}</span>
                    </td>
                    <td>${t.points}</td>
                </tr>
            `).join('');
            document.querySelector('#team-standings tbody').innerHTML = standingsHtml;
        });
});

// Link team names across all pages
document.addEventListener('DOMContentLoaded', function() {
    const teamLinks = document.querySelectorAll('.team-name');
    teamLinks.forEach(link => {
        const teamName = link.textContent;
        link.href = `team.html?team=${teamName}`;
        link.style.textDecoration = 'none';
        link.style.color = 'inherit';
    });
});
