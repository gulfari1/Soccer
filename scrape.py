import requests
from bs4 import BeautifulSoup
import json

# Team logo URLs (using FULL team names as keys)
team_logos = {
    "Arsenal": "https://upload.wikimedia.org/wikipedia/en/thumb/5/53/Arsenal_FC.svg/1200px-Arsenal_FC.svg.png",
    "Aston Villa": "https://static.files.bbci.co.uk/core/website/assets/static/sport/football/aston-villa.7462c0d498.svg",
    "AFC Bournemouth": "https://upload.wikimedia.org/wikipedia/en/thumb/e/e5/AFC_Bournemouth_%282013%29.svg/1200px-AFC_Bournemouth_%282013%29.svg.png",
    "Brentford": "https://upload.wikimedia.org/wikipedia/en/thumb/2/2a/Brentford_FC_crest.svg/1200px-Brentford_FC_crest.svg.png",
    "Brighton & Hove Albion": "https://upload.wikimedia.org/wikipedia/en/thumb/f/fd/Brighton_%26_Hove_Albion_logo.svg/1200px-Brighton_%26_Hove_Albion_logo.svg.png",
    "Chelsea": "https://upload.wikimedia.org/wikipedia/en/thumb/c/cc/Chelsea_FC.svg/1200px-Chelsea_FC.svg.png",
    "Crystal Palace": "https://upload.wikimedia.org/wikipedia/en/thumb/a/a2/Crystal_Palace_FC_logo_%282022%29.svg/1200px-Crystal_Palace_FC_logo_%282022%29.svg.png",
    "Everton": "https://upload.wikimedia.org/wikipedia/en/thumb/7/7c/Everton_FC_logo.svg/1200px-Everton_FC_logo.svg.png",
    "Fulham": "https://upload.wikimedia.org/wikipedia/en/thumb/e/eb/Fulham_FC_%28shield%29.svg/1200px-Fulham_FC_%28shield%29.svg.png",
    "Liverpool": "https://static.files.bbci.co.uk/core/website/assets/static/sport/football/liverpool.0d2ced3f9a.svg",
    "Leicester City": "https://static.files.bbci.co.uk/core/website/assets/static/sport/football/leicester-city.84a92b176c.svg",
    "Manchester City": "https://upload.wikimedia.org/wikipedia/en/thumb/e/eb/Manchester_City_FC_badge.svg/1200px-Manchester_City_FC_badge.svg.png",
    "Manchester United": "https://upload.wikimedia.org/wikipedia/en/thumb/7/7a/Manchester_United_FC_crest.svg/1200px-Manchester_United_FC_crest.svg.png",
    "Newcastle United": "https://upload.wikimedia.org/wikipedia/en/thumb/5/56/Newcastle_United_Logo.svg/1200px-Newcastle_United_Logo.svg.png",
    "Nottingham Forest": "https://upload.wikimedia.org/wikipedia/en/thumb/e/e5/Nottingham_Forest_F.C._logo.svg/1200px-Nottingham_Forest_F.C._logo.svg.png",
    "Southampton": "https://upload.wikimedia.org/wikipedia/en/thumb/c/c9/FC_Southampton.svg/1200px-FC_Southampton.svg.png",
    "Ipswich Town": "https://static.files.bbci.co.uk/core/website/assets/static/sport/football/ipswich-town.932422801d.svg",
    "Tottenham Hotspur": "https://static.files.bbci.co.uk/core/website/assets/static/sport/football/tottenham-hotspur.0bfa51c9f1.svg",
    "West Ham United": "https://static.files.bbci.co.uk/core/website/assets/static/sport/football/west-ham-united.8031b8c4c7.svg",
    "Wolverhampton Wanderers": "https://upload.wikimedia.org/wikipedia/en/thumb/f/fc/Wolverhampton_Wanderers.svg/1200px-Wolverhampton_Wanderers.svg.png",
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
with open('data.json', 'w') as f:
    json.dump(standings, f, indent=2)

print("Data saved to data.json")
