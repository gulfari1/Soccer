import requests
from bs4 import BeautifulSoup
import json

# Team logo URLs (using FULL team names as keys)
team_logos = {
    "Arsenal": "https://upload.wikimedia.org/wikipedia/en/thumb/5/53/Arsenal_FC.svg/1200px-Arsenal_FC.svg.png",
    "Aston Villa": "https://static.files.bbci.co.uk/core/website/assets/static/sport/football/aston-villa.7462c0d498.svg",
    "Bournemouth": "https://upload.wikimedia.org/wikipedia/en/thumb/e/e5/AFC_Bournemouth_%282013%29.svg/1200px-AFC_Bournemouth_%282013%29.svg.png",
    "Brentford": "https://upload.wikimedia.org/wikipedia/en/thumb/2/2a/Brentford_FC_crest.svg/1200px-Brentford_FC_crest.svg.png",
    "Brighton": "https://upload.wikimedia.org/wikipedia/en/thumb/f/fd/Brighton_%26_Hove_Albion_logo.svg/1200px-Brighton_%26_Hove_Albion_logo.svg.png",
    "Chelsea": "https://upload.wikimedia.org/wikipedia/en/thumb/c/cc/Chelsea_FC.svg/1200px-Chelsea_FC.svg.png",
    "Crystal Palace": "https://upload.wikimedia.org/wikipedia/en/thumb/a/a2/Crystal_Palace_FC_logo_%282022%29.svg/1200px-Crystal_Palace_FC_logo_%282022%29.svg.png",
    "Everton": "https://upload.wikimedia.org/wikipedia/en/thumb/7/7c/Everton_FC_logo.svg/1200px-Everton_FC_logo.svg.png",
    "Fulham": "https://upload.wikimedia.org/wikipedia/en/thumb/e/eb/Fulham_FC_%28shield%29.svg/1200px-Fulham_FC_%28shield%29.svg.png",
    "Liverpool": "https://static.files.bbci.co.uk/core/website/assets/static/sport/football/liverpool.0d2ced3f9a.svg",
    "Leicester": "https://static.files.bbci.co.uk/core/website/assets/static/sport/football/leicester-city.84a92b176c.svg",
    "Manchester City": "https://upload.wikimedia.org/wikipedia/en/thumb/e/eb/Manchester_City_FC_badge.svg/1200px-Manchester_City_FC_badge.svg.png",
    "Manchester United": "https://upload.wikimedia.org/wikipedia/en/thumb/7/7a/Manchester_United_FC_crest.svg/1200px-Manchester_United_FC_crest.svg.png",
    "Newcastle United": "https://upload.wikimedia.org/wikipedia/en/thumb/5/56/Newcastle_United_Logo.svg/1200px-Newcastle_United_Logo.svg.png",
    "Nottingham Forest": "https://upload.wikimedia.org/wikipedia/en/thumb/e/e5/Nottingham_Forest_F.C._logo.svg/1200px-Nottingham_Forest_F.C._logo.svg.png",
    "Southampton": "https://upload.wikimedia.org/wikipedia/en/thumb/c/c9/FC_Southampton.svg/1200px-FC_Southampton.svg.png",
    "Ipswich": "https://static.files.bbci.co.uk/core/website/assets/static/sport/football/ipswich-town.932422801d.svg",
    "Tottenham Hotspur": "https://static.files.bbci.co.uk/core/website/assets/static/sport/football/tottenham-hotspur.0bfa51c9f1.svg",
    "West Ham United": "https://static.files.bbci.co.uk/core/website/assets/static/sport/football/west-ham-united.8031b8c4c7.svg",
    "Wolverhampton Wanderers": "https://upload.wikimedia.org/wikipedia/en/thumb/f/fc/Wolverhampton_Wanderers.svg/1200px-Wolverhampton_Wanderers.svg.png",
}

# Team name mapping to ensure consistency (scraped names → full names)
team_name_mapping = {
    "Nottm Forest": "Nottingham Forest",
    "Man City": "Manchester City",
    "Man Utd": "Manchester United",
    "Newcastle": "Newcastle United",
    "Wolves": "Wolverhampton Wanderers",
    "Tottenham": "Tottenham Hotspur",
    "West Ham": "West Ham United",
    "Nott'm Forest": "Nottingham Forest",
    "Nottingham F...": "Nottingham Forest",
    "Manchester C...": "Manchester City",
    "Wolverhampt...": "Wolverhampton Wanderers",
    "Manchester U...": "Manchester United",
    "Newcastle Un...": "Newcastle United"
}

# Scrape data from Understat
url = "https://understat.com/league/EPL"
response = requests.get(url)
soup = BeautifulSoup(response.content, 'html.parser')

# Extract JSON data
for script in soup.find_all('script'):
    if 'JSON.parse' in script.text:
        json_str = script.text.split("JSON.parse('")[1].split("')")[0]
        decoded_data = json_str.encode().decode('unicode_escape')
        data = json.loads(decoded_data)
        break

# Process data
teams = {}
for match in data:
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

# Add calculated fields and logos
standings = []
for team, stats in teams.items():
    standings.append({
        'team': team,  # Already mapped to full name
        'logo': team_logos.get(team),  # Use full name to fetch logo
        **stats,
        'gd': stats['gf'] - stats['ga'],
        'points': (stats['wins'] * 3) + stats['draws']
    })

# Sort standings by points, goal difference, and goals scored
standings.sort(key=lambda x: (-x['points'], -x['gd'], -x['gf']))

# Save to JSON
with open('data.json', 'w') as f:
    json.dump(standings, f, indent=2)

print("Data saved to data.json")
