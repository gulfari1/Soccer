document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const teamName = urlParams.get('team');

    if (!teamName) {
        showError('No team specified in URL');
        return;
    }

    document.getElementById('team-name').textContent = teamName;

    loadTeamData(teamName);
});

async function loadTeamData(teamName) {
    try {
        const [standingsResponse, fixturesResponse] = await Promise.all([
            fetch('data/data.json'),
            fetch('data/scores_fixtures.json')
        ]);

        if (!standingsResponse.ok || !fixturesResponse.ok) {
            throw new Error('Network response was not ok');
        }

        const standings = await standingsResponse.json();
        const fixtures = await fixturesResponse.json();

        displayStandings(standings, teamName);
        displaySchedule(fixtures, teamName);

        document.getElementById('loading').style.display = 'none';
    } catch (error) {
        showError(`Error loading data: ${error.message}`);
    }
}

function displayStandings(standings, teamName) {
    const tbody = document.querySelector('#standings-table tbody');
    tbody.innerHTML = standings.slice(0, 8).map((team, index) => `
        <tr class="${team.team === teamName ? 'highlighted' : ''}">
            <td>${index + 1}</td>
            <td class="team-cell">
                <div class="team-logo-container">
                    <img src="${team.logo}" alt="${team.team}" class="team-logo">
                </div>
                <span class="team-name ${team.team === teamName ? 'bold' : ''}">${team.team}</span>
            </td>
            <td>${team.matches}</td>
            <td>${team.gd}</td>
            <td><strong>${team.points}</strong></td>
        </tr>
    `).join('');
}

function displaySchedule(fixtures, teamName) {
    const scheduleList = document.getElementById('schedule-list');
    const teamFixtures = fixtures.filter(fixture => 
        fixture.Home === teamName || fixture.Away === teamName
    );

    scheduleList.innerHTML = teamFixtures.map(fixture => `
        <div class="fixture-item">
            <div class="fixture-date">${formatDate(fixture.Date)}</div>
            <div class="fixture-teams">
                <span class="team ${fixture.Home === teamName ? 'bold' : ''}">${fixture.Home}</span>
                <span class="vs">vs</span>
                <span class="team ${fixture.Away === teamName ? 'bold' : ''}">${fixture.Away}</span>
            </div>
            <div class="fixture-score">${fixture.Score || 'TBD'}</div>
        </div>
    `).join('');
}

function formatDate(dateString) {
    const date = new Date(dateString + 'T00:00:00Z');
    return date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}

function showError(message) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('error').style.display = 'block';
    document.getElementById('error').textContent = message;
}
