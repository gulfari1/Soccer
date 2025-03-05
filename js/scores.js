let currentGameweek;

function getOrdinal(n) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
}

function formatDate(dateString) {
    const date = new Date(dateString + 'T00:00:00Z');
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    const parts = date.toLocaleDateString('en-GB', options).split(' ');
    const day = parseInt(parts[1]);
    return `${parts[0]} ${day}${getOrdinal(day)} ${parts[2]}`;
}

function formatTimeGMT5(dateStr, timeStr) {
    try {
        const [year, month, day] = dateStr.split('-').map(Number);
        const [hours, minutes] = timeStr.split(':').map(Number);
        const date = new Date(Date.UTC(year, month - 1, day, hours, minutes));
        
        return new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            timeZone: 'Asia/Karachi', // GMT+5 timezone
            hour12: true
        }).format(date);
    } catch {
        return timeStr; // Fallback to original time
    }
}

async function loadFixtures() {
    try {
        const response = await fetch('data/scores_fixtures.json');
        if (!response.ok) throw new Error('Network response was not ok');
        
        const fixtures = await response.json();
        const grouped = groupByGameweek(fixtures);

        // Get today's date in UTC
        const today = new Date();
        const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
        
        // Determine current gameweek
        currentGameweek = findCurrentGameweek(grouped, todayUTC);
        
        renderGameweekButtons(grouped);
        renderFixtures(grouped);
        document.getElementById('loading').style.display = 'none';
    } catch (error) {
        showError(`Error loading fixtures: ${error.message}`);
    }
}

function findCurrentGameweek(groupedFixtures, today) {
    const gameweeks = Object.keys(groupedFixtures)
        .map(Number)
        .sort((a, b) => a - b);

    // Find the latest fully completed gameweek
    let lastCompleted = 0;
    for (const week of gameweeks) {
        const allMatchesPlayed = groupedFixtures[week].every(match => {
            const matchDate = new Date(match.Date + 'T00:00:00Z');
            return matchDate < today;
        });
        
        if (allMatchesPlayed) {
            lastCompleted = week;
        } else {
            break;
        }
    }

    // Current gameweek is next after last completed
    const current = gameweeks.find(w => w > lastCompleted) || gameweeks[gameweeks.length - 1];
    return current || gameweeks[0];
}

function groupByGameweek(fixtures) {
    return fixtures.reduce((acc, fixture) => {
        const week = fixture.Wk;
        if (!acc[week]) acc[week] = [];
        acc[week].push(fixture);
        return acc;
    }, {});
}

function groupByDate(fixtures) {
    return fixtures.reduce((acc, fixture) => {
        const date = formatDate(fixture.Date);
        if (!acc[date]) acc[date] = [];
        acc[date].push(fixture);
        return acc;
    }, {});
}

function renderGameweekButtons(grouped) {
    const buttonsContainer = document.getElementById('gameweek-buttons');
    const gameweeks = Object.keys(grouped).sort((a, b) => a - b);

    buttonsContainer.innerHTML = '';

    gameweeks.forEach(week => {
        const button = document.createElement('button');
        button.className = `gameweek-button ${week == currentGameweek ? 'active' : ''}`;
        button.textContent = `Gameweek ${week}`;
        button.dataset.week = week;
        
        button.addEventListener('click', () => {
            currentGameweek = parseInt(week);
            document.querySelectorAll('.gameweek-button').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.gameweek-section').forEach(s => s.classList.remove('active'));
            button.classList.add('active');
            document.querySelector(`.gameweek-section[data-week="${week}"]`).classList.add('active');
            scrollToActiveGameweek();
        });

        buttonsContainer.appendChild(button);
    });

    scrollToActiveGameweek();
}

function renderFixtures(grouped) {
    const container = document.getElementById('fixtures-list');
    
    Object.entries(grouped).forEach(([week, matches]) => {
        const section = document.createElement('div');
        section.className = `gameweek-section ${week == currentGameweek ? 'active' : ''}`;
        section.dataset.week = week;
        
        const dateGrouped = groupByDate(matches);
        
        Object.entries(dateGrouped).forEach(([date, dateMatches]) => {
            const dateSection = document.createElement('div');
            dateSection.className = 'date-section';
            
            const dateHeader = document.createElement('div');
            dateHeader.className = 'date-header';
            dateHeader.textContent = date;
            dateSection.appendChild(dateHeader);
            
            const list = document.createElement('ul');
            list.className = 'match-list';
            
            dateMatches.forEach(match => {
                const li = document.createElement('li');
                li.className = 'match-item';
                
                const isCompleted = match.Score && match.Score.includes('-');
                let homeClass = '';
                let awayClass = '';
                let homeScoreClass = '';
                let awayScoreClass = '';

                if (isCompleted) {
                    const scores = match.Score.split('-').map(Number);
                    const homeGoals = scores[0];
                    const awayGoals = scores[1];

                    if (homeGoals > awayGoals) {
                        homeClass = 'winner';
                        awayClass = 'loser';
                        homeScoreClass = '';
                        awayScoreClass = 'loser-score';
                    } else if (awayGoals > homeGoals) {
                        homeClass = 'loser';
                        awayClass = 'winner';
                        homeScoreClass = 'loser-score';
                        awayScoreClass = '';
                    } else {
                        homeClass = 'winner';
                        awayClass = 'winner';
                        homeScoreClass = '';
                        awayScoreClass = '';
                    }
                }

                li.innerHTML = `
                    <div class="team-container home-container">
                        <span class="team-code ${homeClass}">${match.HomeCode}</span>
                        <img class="team-logo" src="logos/${match.HomeCode}.png" alt="${match.Home}">
                    </div>
                    
                    <div class="score-container">
                        ${isCompleted ? 
                            `<div class="score ${homeScoreClass}">${match.Score.split('-')[0]}</div>
                             <div class="score ${awayScoreClass}">${match.Score.split('-')[1]}</div>` :
                            `<div class="match-time">${formatTimeGMT5(match.Date, match.Time)}</div>`
                        }
                    </div>
                    
                    <div class="team-container away-container">
                        <img class="team-logo" src="logos/${match.AwayCode}.png" alt="${match.Away}">
                        <span class="team-code ${awayClass}">${match.AwayCode}</span>
                    </div>
                `;
                
                list.appendChild(li);
            });
            
            dateSection.appendChild(list);
            section.appendChild(dateSection);
        });
        
        container.appendChild(section);
    });
}

function scrollToActiveGameweek() {
    const container = document.querySelector('.gameweek-nav');
    const activeButton = document.querySelector(`.gameweek-button[data-week="${currentGameweek}"]`);
    
    if (activeButton && container) {
        const containerWidth = container.offsetWidth;
        const buttonPosition = activeButton.offsetLeft;
        const buttonWidth = activeButton.offsetWidth;
        container.scrollTo({
            left: buttonPosition - (containerWidth / 2) + (buttonWidth / 2),
            behavior: 'smooth'
        });
    }
}

function showError(message) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('error').style.display = 'block';
    document.getElementById('error').textContent = message;
}

// Load fixtures when the page loads
window.addEventListener('DOMContentLoaded', loadFixtures);
