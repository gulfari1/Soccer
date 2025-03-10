document.addEventListener('DOMContentLoaded', function() {
    const clientSideMappings = {
        "Manchester United": "Man Utd",
        "Manchester City": "Man City",
        "Newcastle United": "Newcastle",
        "Wolverhampton Wanderers": "Wolves",
        "Tottenham Hotspur": "Tottenham",
        "West Ham United": "West Ham",
        "Nottingham Forest": "Nottm Forest",
        "Leicester City": "Leicester",
        "Brighton & Hove Albion": "Brighton",
        "AFC Bournemouth": "Bournemouth",
        "Ipswich Town": "Ipswich"
    };

    function getOrdinal(n) {
        const s = ["th", "st", "nd", "rd"];
        const v = n % 100;
        return (s[(v - 20) % 10] || s[v] || s[0]);
    }

    function formatDateTime(date) {
        const day = date.getDate();
        const month = date.toLocaleString('default', { month: 'long' });
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${day}${getOrdinal(day)} ${month} ${year} at ${hours}:${minutes}`;
    }

    function showError(message) {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('error').style.display = 'block';
        document.getElementById('error').textContent = message;
    }

    async function loadData() {
        try {
            const response = await fetch('data/data.json');
            if (!response.ok) throw new Error('Network response was not ok');

            const lastModified = response.headers.get('last-modified');
            const updateDate = lastModified ? new Date(lastModified) : new Date();

            const lastUpdatedDiv = document.querySelector('.last-updated');
            lastUpdatedDiv.textContent = `Last Updated ${formatDateTime(updateDate)}`;

            const data = await response.json();

            const tbody = document.querySelector('#leagueTable tbody');
            tbody.innerHTML = data.map((team, index) => `
                <tr class="${[3, 4, 16].includes(index) ? 'separator-row' : ''}">
                    <td>${index + 1}</td>
                    <td class="team-cell">
                        <div class="team-logo-container">
                            <img src="${team.logo}" alt="${team.team}" class="team-logo">
                        </div>
                        <span class="team-name full"><a href="team.html?team=${encodeURIComponent(team.team)}" class="team-link">${team.team}</a></span>
                        <span class="team-name short">${clientSideMappings[team.team] || team.team}</span>
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
            showError(`Error loading data: ${error.message}`);
        }
    }

    loadData();
});
