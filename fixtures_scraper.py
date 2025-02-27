import requests
from bs4 import BeautifulSoup
import json

# URL for Premier League scores and fixtures
url = "https://fbref.com/en/comps/9/schedule/Premier-League-Scores-and-Fixtures"
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
}

# Fetch the page content
response = requests.get(url, headers=headers)
soup = BeautifulSoup(response.content, 'html.parser')

# Find the schedule table
table = soup.find('table', {'id': lambda x: x and x.startswith('sched_')})

# Initialize a list to store fixture data
data = []

if table:
    rows = table.find('tbody').find_all('tr')
    for row in rows:
        # Skip spacer or partial rows
        if 'spacer' in row.get('class', []) or 'partial_table' in row.get('class', []):
            continue
        
        # Extract gameweek
        wk_elem = row.find('th', {'data-stat': 'gameweek'})
        if not wk_elem or not wk_elem.text.strip().isdigit():
            continue
        wk = wk_elem.text.strip()
        if int(wk) < 1 or int(wk) > 38:
            continue

        # Extract other columns
        day = row.find('td', {'data-stat': 'dayofweek'}).text.strip()
        
        date_elem = row.find('td', {'data-stat': 'date'}).find('a')
        date = date_elem.text.strip() if date_elem else ""
        
        time_elem = row.find('td', {'data-stat': 'start_time'})
        time = time_elem.text.strip() if time_elem else ""
        
        home_elem = row.find('td', {'data-stat': 'home_team'}).find('a')
        home = home_elem.text.strip() if home_elem else ""
        
        home_xg = row.find('td', {'data-stat': 'home_xg'}).text.strip()
        
        score_elem = row.find('td', {'data-stat': 'score'}).find('a')
        score = score_elem.text.strip() if score_elem else ""
        
        away_xg = row.find('td', {'data-stat': 'away_xg'}).text.strip()
        
        away_elem = row.find('td', {'data-stat': 'away_team'}).find('a')
        away = away_elem.text.strip() if away_elem else ""
        
        venue = row.find('td', {'data-stat': 'venue'}).text.strip()

        # Append the match data to the list
        data.append({
            "Wk": wk,
            "Day": day,
            "Date": date,
            "Time": time,
            "Home": home,
            "Home xG": home_xg,
            "Score": score,
            "Away xG": away_xg,
            "Away": away,
            "Venue": venue
        })

# Save the data to a JSON file
with open('scores_fixtures.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Data saved to scores_fixtures.json")
