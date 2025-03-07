document.addEventListener('DOMContentLoaded', function() {
    const TEAM_CODES = {
        "Arsenal": "ARS", "Aston Villa": "AVL", "Bournemouth": "BOU",
        "Brentford": "BRE", "Brighton": "BHA", "Chelsea": "CHE",
        "Crystal Palace": "CRY", "Everton": "EVE", "Fulham": "FUL",
        "Liverpool": "LIV", "Manchester City": "MCI", "Manchester United": "MUN",
        "Newcastle United": "NEW", "Nottingham Forest": "NFO", "Southampton": "SOU",
        "Tottenham": "TOT", "West Ham": "WHU", "Wolves": "WOL"
    };

    async function loadData() {
        try {
            const response = await fetch('data/data.json');
            if (!response.ok) throw new Error('Network response was not ok');

            const data = await response.json();
            const tbody = document.querySelector('#leagueTable tbody');

            tbody.innerHTML = data.map((team, index) => `
                <tr class="${[3, 4, 16].includes(index) ? 'separator-row' : ''}">
                    <td>${index + 1}</td>
                    <td class="team-cell">
                        <a href="/Soccer/team.html#${encodeURIComponent(team.team)}" style="text-decoration: none; color: inherit;">
                            <div class="team-logo-container">
                                <img src="${team.logo}" alt="${team.team}" class="team-logo">
                            </div>
                            <span class="team-name full">${team.team}</span>
                            <span class="team-name short">${TEAM_CODES[team.team] || team.team}</span>
                        </a>
                    </td>
                    <td>${team.matches}</td>
                    <td class="mobile-hide">${team.wins}</td>
                    <td class="mobile-hide">${team.draws}</td>
                    <td class="mobile-hide">${team.losses}</td>
                    <td class="mobile-hide">${team.gf}</td>
                    <td class="mobile-hide">${team.ga}</td>
                    <td>${team.gd}</td>
                    <td><strong>${team.points}</strong></td>
                    <td class="mobile-hide">
                        <div class="form-container">
                            ${team.form.split(' ').map((match, index) => `
                                <div class="form-item ${match === 'W' ? 'form-win' : match === 'D' ? 'form-draw' : 'form-loss'}" 
                                     style="--index: ${index}">
                                    ${match}
                                </div>
                            `).join('')}
                        </div>
                    </td>
                </tr>
            `).join('');

            document.getElementById('loading').style.display = 'none';
        } catch (error) {
            document.getElementById('loading').style.display = 'none';
            document.getElementById('error').style.display = 'block';
            document.getElementById('error').textContent = `Error loading data: ${error.message}`;
        }
    }

    loadData();
});
