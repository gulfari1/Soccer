import requests
from bs4 import BeautifulSoup
import json

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

# Team name mapping to ensure consistency (scraped names → full names)
team_name_mapping = {
    # Understat mappings
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

    # FBRef-specific mappings
    "Nott'ham Forest": "Nottingham Forest",
    "Newcastle Utd": "Newcastle United",
    "Manchester Utd": "Manchester United",
    "Nott'm Forest": "Nottingham Forest",
    "Nottingham F...": "Nottingham Forest",
    "Manchester C...": "Manchester City",
    "Wolverhampt...": "Wolverhampton Wanderers",
    "Manchester U...": "Manchester United",
    "Newcastle Un...": "Newcastle United",
    "Leicester C...": "Leicester City",
    "Brighton &...": "Brighton & Hove Albion",
    "AFC Bournem...": "AFC Bournemouth",
    "Ipswich Tow...": "Ipswich Town",
    "Tottenham H...": "Tottenham Hotspur",
}

# Scrape data from Understat
url_understat = "https://understat.com/league/EPL"
response = requests.get(url_understat)
soup = BeautifulSoup(response.content, 'html.parser')

# Extract JSON data from Understat
for script in soup.find_all('script'):
    if 'JSON.parse' in script.text:
        json_str = script.text.split("JSON.parse('")[1].split("')")[0]
        decoded_data = json_str.encode().decode('unicode_escape')
        data_understat = json.loads(decoded_data)
        break

# Process Understat data
teams = {}
for match in data_understat:
    if match['isResult']:
        # Map scraped names to full names
        home = team_name_mapping.get(match['h']['title'], match['h']['title'])
        away = team_name_mapping.get(match['a']['title'], match['a']['title'])
        h_goals = int(match['goals']['h'])
        a_goals = int(match['goals']['a'])

        # Initialize teams
        teams.setdefault(home, {'matches': 0, 'wins': 0, 'draws': 0, 'losses': 0, 'gf': 0, 'ga': 0})
        teams.setdefault(away, {'matches': 0, 'wins': 0, 'draws': 0, 'losses': 0, 'gf': 0, 'ga': 0})

        # Update stats
        for team, goals_for, goals_against in [(home, h_goals, a_goals), (away, a_goals, h_goals)]:
            teams[team]['matches'] += 1
            teams[team]['gf'] += goals_for
            teams[team]['ga'] += goals_against

        # Update wins/losses/draws
        if h_goals > a_goals:
            teams[home]['wins'] += 1
            teams[away]['losses'] += 1
        elif a_goals > h_goals:
            teams[away]['wins'] += 1
            teams[home]['losses'] += 1
        else:
            teams[home]['draws'] += 1
            teams[away]['draws'] += 1

# Scrape FBRef for Form data
url_fbref = "https://fbref.com/en/comps/9/Premier-League-Stats"
headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'}
response_fbref = requests.get(url_fbref, headers=headers)
soup_fbref = BeautifulSoup(response_fbref.content, 'html.parser')

form_data = {}
table_fbref = soup_fbref.find('table', id='results2024-202591_overall')

if table_fbref:
    for row in table_fbref.find('tbody').find_all('tr'):
        squad = row.find('td', {'data-stat': 'team'}).find('a').text.strip()
        # Map FBRef team names to full names
        full_name = team_name_mapping.get(squad, squad)
        last_5_cell = row.find('td', {'data-stat': 'last_5'})
        if last_5_cell:
            last_5_matches = [div.find('a').text.strip() for div in last_5_cell.find_all('div', class_='poptip')]
            form_data[full_name] = ' '.join(last_5_matches)

# Prepare standings with Form data
standings = []
for team, stats in teams.items():
    standings.append({
        'team': team,  # Already mapped to full name
        'logo': team_logos.get(team),  # Use full name to fetch logo
        **stats,
        'gd': stats['gf'] - stats['ga'],
        'points': (stats['wins'] * 3) + stats['draws'],
        'form': form_data.get(team, '')  # Add Form data
    })

# Sort standings by points, goal difference, and goals scored
standings.sort(key=lambda x: (-x['points'], -x['gd'], -x['gf']))

# Save to JSON
with open('../data/data.json', 'w') as f:
    json.dump(standings, f, indent=2)

print("Data saved to data.json")
