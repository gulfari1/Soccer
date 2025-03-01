import requests
from bs4 import BeautifulSoup
import json
from datetime import datetime

# URL for Premier League scores and fixtures
url = "https://fbref.com/en/comps/9/schedule/Premier-League-Scores-and-Fixtures"
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
}

# Team code mapping
TEAM_CODES = {
    "Nott'ham Forest": "NFO",
    "Manchester City": "MCI",
    "Liverpool": "LIV",
    "Southampton": "SOU",
    "Brighton": "BHA",
    "Fulham": "FUL",
    "Crystal Palace": "CRY",
    "Ipswich Town": "IPS",
    "Brentford": "BRE",
    "Aston Villa": "AVL",
    "Wolverhampton Wanderers": "WOL",
    "Everton": "EVE",
    "Tottenham": "TOT",
    "Bournemouth": "BOU",
    "Chelsea": "CHE",
    "Leicester City": "LEI",
    "Manchester Utd": "MUN",
    "Arsenal": "ARS"
}

def fetch_fixtures():
    response = requests.get(url, headers=headers)
    soup = BeautifulSoup(response.content, 'html.parser')
    table = soup.find('table', {'id': lambda x: x and x.startswith('sched_')})
    data = []

    if table:
        rows = table.find('tbody').find_all('tr')
        for row in rows:
            if 'spacer' in row.get('class', []) or 'partial_table' in row.get('class', []):
                continue
            
            wk_elem = row.find('th', {'data-stat': 'gameweek'})
            if not wk_elem or not wk_elem.text.strip().isdigit():
                continue
            wk = int(wk_elem.text.strip())
            if wk < 1 or wk > 38:
                continue

            date_elem = row.find('td', {'data-stat': 'date'})
            date = date_elem.text.strip() if date_elem else ""
            if date:
                try:
                    date_obj = datetime.strptime(date, '%Y-%m-%d')
                    date = date_obj.strftime('%Y-%m-%d')
                except ValueError:
                    continue

            time_elem = row.find('td', {'data-stat': 'start_time'})
            time = time_elem.text.strip() if time_elem else ""

            home_elem = row.find('td', {'data-stat': 'home_team'}).find('a')
            home = home_elem.text.strip() if home_elem else ""

            score_elem = row.find('td', {'data-stat': 'score'}).find('a')
            score = score_elem.text.strip().replace('–', '-') if score_elem else ""

            away_elem = row.find('td', {'data-stat': 'away_team'}).find('a')
            away = away_elem.text.strip() if away_elem else ""

            data.append({
                "Wk": wk,
                "Date": date,
                "Time": time,
                "Home": home,
                "HomeCode": TEAM_CODES.get(home, "TBD"),
                "Score": score,
                "Away": away,
                "AwayCode": TEAM_CODES.get(away, "TBD")
            })

    return data

def save_fixtures(data):
    with open('scores_fixtures.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    fixtures = fetch_fixtures()
    save_fixtures(fixtures)
    print("Data saved to scores_fixtures.json")
