import requests
from bs4 import BeautifulSoup
import json
import re

# Team logo URLs (using FULL team names as keys)
team_logos = {
    "Arsenal": "logos/ARS.png",
    "Aston Villa": "logos/AVL.png",
    "AFC Bournemouth": "logos/BOU.png",
    "Brentford": "logos/BRE.png",
    "Brighton & Hove Albion": "logos/BHA.png",
    "Chelsea": "logos/CHE.png",
    "Crystal Palace": "logos/CRY.png",
    "Everton": "logos/EVE.png",
    "Fulham": "logos/FUL.png",
    "Liverpool": "logos/LIV.png",
    "Leicester City": "logos/LEI.png",
    "Manchester City": "logos/MCI.png",
    "Manchester United": "logos/MUN.png",
    "Newcastle United": "logos/NEW.png",
    "Nottingham Forest": "logos/NFO.png",
    "Southampton": "logos/SOU.png",
    "Ipswich Town": "logos/IPS.png",
    "Tottenham Hotspur": "logos/TOT.png",
    "West Ham United": "logos/WHU.png",
    "Wolverhampton Wanderers": "logos/WOL.png",
}

# Team name mapping (scraped names → full names)
team_name_mapping = {
    "Nottm Forest": "Nottingham Forest",
    "Man City": "Manchester City",
    "Man Utd": "Manchester United",
    "Newcastle": "Newcastle United",
    "Wolves": "Wolverhampton Wanderers",
    "Tottenham": "Tottenham Hotspur",
    "West Ham": "West Ham United",
    "Leicester": "Leicester City",
    "Bournemouth": "AFC Bournemouth",
    "Brighton": "Brighton & Hove Albion",
    "Ipswich": "Ipswich Town",
    "Nott'ham Forest": "Nottingham Forest",
    "Newcastle Utd": "Newcastle United",
    "Manchester Utd": "Manchester United",
    "Nottingham F": "Nottingham Forest",
    "Manchester C": "Manchester City",
    "Wolverhampton...": "Wolverhampton Wanderers",
    "Manchester U": "Manchester United",
    "Newcastle Un": "Newcastle United",
    "Leicester C": "Leicester City",
    "Brighton &": "Brighton & Hove Albion",
    "AFC Bournem": "AFC Bournemouth",
    "Ipswich Tow": "Ipswich Town",
    "Tottenham H": "Tottenham Hotspur",
}

# Scrape Understat data
url_understat = "https://understat.com/league/EPL"
response = requests.get(url_understat)
soup = BeautifulSoup(response.content, 'html.parser')

# Extract Understat JSON data
for script in soup.find_all('script'):
    if 'JSON.parse' in script.text:
        json_str = script.text.split("JSON.parse('")[1].split("')")[0]
        decoded_data = json_str.encode().decode('unicode_escape')
        data_understat = json.loads(decoded_data)
        break

# Process match results
teams = {}
for match in data_understat:
    if match['isResult']:
        home = team_name_mapping.get(match['h']['title'], match['h']['title'])
        away = team_name_mapping.get(match['a']['title'], match['a']['title'])
        h_goals = int(match['goals']['h'])
        a_goals = int(match['goals']['a'])

        teams.setdefault(home, {'matches': 0, 'wins': 0, 'draws': 0, 'losses': 0, 'gf': 0, 'ga': 0})
        teams.setdefault(away, {'matches': 0, 'wins': 0, 'draws': 0, 'losses': 0, 'gf': 0, 'ga': 0})

        for team, goals_for, goals_against in [(home, h_goals, a_goals), (away, a_goals, h_goals)]:
            teams[team]['matches'] += 1
            teams[team]['gf'] += goals_for
            teams[team]['ga'] += goals_against

        if h_goals > a_goals:
            teams[home]['wins'] += 1
            teams[away]['losses'] += 1
        elif a_goals > h_goals:
            teams[away]['wins'] += 1
            teams[home]['losses'] += 1
        else:
            teams[home]['draws'] += 1
            teams[away]['draws'] += 1

# Scrape form data from The Athletic
url_athletic = "https://www.nytimes.com/athletic/football/premier-league/standings/"
headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
response_athletic = requests.get(url_athletic, headers=headers)
response_athletic.raise_for_status()

soup_athletic = BeautifulSoup(response_athletic.content, 'html.parser')
form_data = {}
table_athletic = soup_athletic.find('table', {'class': 'grqrjN'})

if table_athletic:
    for row in table_athletic.find_all('tr')[1:]:
        columns = row.find_all('td')
        if len(columns) >= 9:
            team_cell = columns[0].find('a')
            if team_cell:
                team_str = team_cell.text.strip()
                # Clean team name
                team_str_clean = re.sub(r'^\d+', '', team_str)
                if len(team_str_clean) >= 3 and team_str_clean[-3:].isupper():
                    team_part = team_str_clean[:-3].strip()
                else:
                    team_part = team_str_clean.strip()
                full_name = team_name_mapping.get(team_part, team_part)
                
                # Extract last 5 matches
                form_cell = columns[-1]
                form_elements = form_cell.find_all('div', class_=lambda x: x and x.startswith('sc-'))
                form_chars = []
                for e in form_elements:
                    form_chars.extend(list(e.text.strip()))  # Split into individual characters
                
                # Keep only last 5 results and format
                last_5 = form_chars[-5:]
                form = ' '.join(last_5)
                
                form_data[full_name] = form

# Prepare final standings
standings = []
for team, stats in teams.items():
    standings.append({
        'team': team,
        'logo': team_logos.get(team),
        **stats,
        'gd': stats['gf'] - stats['ga'],
        'points': (stats['wins'] * 3) + stats['draws'],
        'form': form_data.get(team, '')
    })

# Sort standings
standings.sort(key=lambda x: (-x['points'], -x['gd'], -x['gf']))

# Save to JSON
with open('data.json', 'w') as f:
    json.dump(standings, f, indent=2)

print("Data saved to data.json")
