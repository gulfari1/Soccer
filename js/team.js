document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const teamName = decodeURIComponent(params.get('team'));
    
    if (!teamName) {
        window.location.href = 'index.html';
        return;
    }

    Promise.all([
        fetch('data/data.json').then(r => r.json()),
        fetch('data/scores_fixtures.json').then(r => r.json())
    ]).then(([teamsData, fixtures]) => {
        const team = teamsData.find(t => t.team === teamName);
        const teamMatches = fixtures.filter(f => 
            f.Home === teamName || f.Away === teamName
        );

        // Set header info
        document.getElementById('team-logo').src = team.logo;
        document.getElementById('team-name').textContent = teamName;

        // Render matches
        const matchesList = document.getElementById('matches-list');
        matchesList.innerHTML = teamMatches.map(match => `
            <div class="match-item">
                <div class="match-date">${new Date(match.Date).toLocaleDateString()}</div>
                <div class="match-teams">
                    <span class="${match.Home === teamName ? 'home-team' : 'away-team'}">
                        ${match.Home === teamName ? teamName : match.Home}
                    </span>
                    vs
                    <span class="${match.Away === teamName ? 'home-team' : 'away-team'}">
                        ${match.Away === teamName ? teamName : match.Away}
                    </span>
                </div>
                <div class="match-score">${match.Score}</div>
            </div>
        `).join('');

        // Render form
        const formContainer = document.getElementById('team-form');
        formContainer.innerHTML = team.form.split(' ').map((result, index) => `
            <div class="form-item ${result === 'W' ? 'form-win' : result === 'D' ? 'form-draw' : 'form-loss'}" 
                 style="--index: ${index}">
                ${result}
            </div>
        `).join('');

    }).catch(error => {
        console.error('Error:', error);
        window.location.href = 'index.html';
    });
});
