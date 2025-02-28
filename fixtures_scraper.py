import requests
from bs4 import BeautifulSoup
import json
from datetime import datetime

# Team logo mapping (predefined from your data)
TEAM_LOGO_MAP = {
    "Liverpool": "https://static.files.bbci.co.uk/core/website/assets/static/sport/football/liverpool.0d2ced3f9a.svg",
    "Arsenal": "https://upload.wikimedia.org/wikipedia/en/thumb/5/53/Arsenal_FC.svg/1200px-Arsenal_FC.svg.png",
    "Nottingham Forest": "https://upload.wikimedia.org/wikipedia/en/thumb/e/e5/Nottingham_Forest_F.C._logo.svg/1200px-Nottingham_Forest_F.C._logo.svg.png",
    "Manchester City": "https://upload.wikimedia.org/wikipedia/en/thumb/e/eb/Manchester_City_FC_badge.svg/1200px-Manchester_City_FC_badge.svg.png",
    "Chelsea": "https://upload.wikimedia.org/wikipedia/en/thumb/c/cc/Chelsea_FC.svg/1200px-Chelsea_FC.svg.png",
    "Newcastle United": "https://upload.wikimedia.org/wikipedia/en/thumb/5/56/Newcastle_United_Logo.svg/1200px-Newcastle_United_Logo.svg.png",
    "AFC Bournemouth": "https://upload.wikimedia.org/wikipedia/en/thumb/e/e5/AFC_Bournemouth_%282013%29.svg/1200px-AFC_Bournemouth_%282013%29.svg.png",
    "Brighton & Hove Albion": "https://upload.wikimedia.org/wikipedia/en/thumb/f/fd/Brighton_%26_Hove_Albion_logo.svg/1200px-Brighton_%26_Hove_Albion_logo.svg.png",
    "Fulham": "https://upload.wikimedia.org/wikipedia/en/thumb/e/eb/Fulham_FC_%28shield%29.svg/1200px-Fulham_FC_%28shield%29.svg.png",
    "Aston Villa": "https://static.files.bbci.co.uk/core/website/assets/static/sport/football/aston-villa.7462c0d498.svg",
    "Brentford": "https://upload.wikimedia.org/wikipedia/en/thumb/2/2a/Brentford_FC_crest.svg/1200px-Brentford_FC_crest.svg.png",
    "Crystal Palace": "https://upload.wikimedia.org/wikipedia/en/thumb/a/a2/Crystal_Palace_FC_logo_%282022%29.svg/1200px-Crystal_Palace_FC_logo_%282022%29.svg.png",
    "Tottenham Hotspur": "https://static.files.bbci.co.uk/core/website/assets/static/sport/football/tottenham-hotspur.0bfa51c9f1.svg",
    "Manchester United": "https://upload.wikimedia.org/wikipedia/en/thumb/7/7a/Manchester_United_FC_crest.svg/1200px-Manchester_United_FC_crest.svg.png",
    "West Ham United": "https://static.files.bbci.co.uk/core/website/assets/static/sport/football/west-ham-united.8031b8c4c7.svg",
    "Everton": "https://upload.wikimedia.org/wikipedia/en/thumb/7/7c/Everton_FC_logo.svg/1200px-Everton_FC_logo.svg.png",
    "Wolverhampton Wanderers": "https://upload.wikimedia.org/wikipedia/en/thumb/f/fc/Wolverhampton_Wanderers.svg/1200px-Wolverhampton_Wanderers.svg.png",
    "Ipswich Town": "https://static.files.bbci.co.uk/core/website/assets/static/sport/football/ipswich-town.932422801d.svg",
    "Leicester City": "https://static.files.bbci.co.uk/core/website/assets/static/sport/football/leicester-city.84a92b176c.svg",
    "Southampton": "https://upload.wikimedia.org/wikipedia/en/thumb/c/c9/FC_Southampton.svg/1200px-FC_Southampton.svg.png"
}

# URL for Premier League scores and fixtures
url = "https://fbref.com/en/comps/9/schedule/Premier-League-Scores-and-Fixtures"
headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'}

response = requests.get(url, headers=headers)
soup = BeautifulSoup(response.content, 'html.parser')
table = soup.find('table', {'id': lambda x: x and x.startswith('sched_')})
data = []

if table:
    rows = table.find('tbody').find_all('tr')
    for row in rows:
        if 'spacer' in row.get('class', []) or 'partial_table' in row.get('class', []):
            continue
        
        # Extract gameweek
        wk_elem = row.find('th', {'data-stat': 'gameweek'})
        if not wk_elem or not wk_elem.text.strip().isdigit():
            continue
        wk = int(wk_elem.text.strip())
        if wk < 1 or wk > 38:
            continue

        # Extract teams
        home_elem = row.find('td', {'data-stat': 'home_team'}).find('a')
        home = home_elem.text.strip() if home_elem else ""
        away_elem = row.find('td', {'data-stat': 'away_team'}).find('a')
        away = away_elem.text.strip() if away_elem else ""

        # Get logos from mapping
        home_logo = TEAM_LOGO_MAP.get(home, "")
        away_logo = TEAM_LOGO_MAP.get(away, "")

        # Extract other data
        date_elem = row.find('td', {'data-stat': 'date'})
        date = date_elem.text.strip() if date_elem else ""
        time_elem = row.find('td', {'data-stat': 'start_time'})
        time = time_elem.text.strip() if time_elem else ""
        score_elem = row.find('td', {'data-stat': 'score'}).find('a')
        score = score_elem.text.strip().replace('–', '-') if score_elem else ""

        data.append({
            "Wk": wk,
            "Date": date,
            "Time": time,
            "Home": home,
            "HomeLogo": home_logo,
            "Score": score,
            "Away": away,
            "AwayLogo": away_logo
        })

# Save to JSON
with open('scores_fixtures.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Data saved to scores_fixtures.json")
