document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const teamName = decodeURIComponent(urlParams.get('team'));
    const teamHeader = document.getElementById('teamHeader');
    const matchesContainer = document.getElementById('teamMatches');
    const allMatchesLink = document.getElementById('allMatchesLink');

    teamHeader.textContent = teamName;
    allMatchesLink.href = `#`; // Update with actual all matches page if needed

    async function loadTeamMatches() {
        try {
            const response = await fetch('data/scores_fixtures.json');
            const fixtures = await response.json();
            
            // Filter matches for the selected team
            const teamMatches = fixtures.filter(match => 
                match.Home === teamName || match.Away === teamName
            ).sort((a, b) => new Date(a.Date) - new Date(b.Date));

            // Separate played and upcoming matches
            const playedMatches = teamMatches.filter(m => m.Played);
            const upcomingMatches = teamMatches.filter(m => !m.Played);
            
            // Get last played match and next 3 upcoming
            const recentMatch = playedMatches.slice(-1)[0];
            const displayMatches = [recentMatch, ...upcomingMatches.slice(0, 3)];

            matchesContainer.innerHTML = displayMatches.map(match => `
                <div class="match-section">
                    <div class="league-header">${getCompetition(match)}</div>
                    <div class="match-row">
                        <div class="team-container">
                            <img src="logos/${match.HomeCode}.png" alt="${match.Home}" class="team-logo">
                            <span class="team-name">${match.Home}</span>
                        </div>
                        <div class="match-info">
                            ${match.Played ? `
                                <div class="score">${match.Score.split('-')[0]}</div>
                                <div class="score">${match.Score.split('-')[1]}</div>
                            ` : `
                                <div class="match-time">${formatTime(match.Time)}</div>
                                <div class="match-date">${formatDate(match.Date)}</div>
                            `}
                        </div>
                        <div class="team-container">
                            <img src="logos/${match.AwayCode}.png" alt="${match.Away}" class="team-logo">
                            <span class="team-name">${match.Away}</span>
                        </div>
                    </div>
                </div>
            `).join('');

        } catch (error) {
            console.error('Error loading matches:', error);
        }
    }

    function formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    }

    function formatTime(timeStr) {
        return new Date(`2000-01-01T${timeStr}`).toLocaleTimeString('en-US', 
            { hour: 'numeric', minute: '2-digit', hour12: true });
    }

    function getCompetition(match) {
        // Add logic to determine competition type if available in data
        return "Premier League"; // Default to PL
    }

    loadTeamMatches();
});
