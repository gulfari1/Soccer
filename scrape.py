import requests
from bs4 import BeautifulSoup
import json

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

# Process data and save to JSON
teams = {}

for match in data:
    if match['isResult']:
        home = match['h']['title']
        away = match['a']['title']
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

# Add calculated fields
standings = []
for team, stats in teams.items():
    standings.append({
        'team': team,
        **stats,
        'gd': stats['gf'] - stats['ga'],
        'points': (stats['wins'] * 3) + stats['draws']
    })

# Sort standings
standings.sort(key=lambda x: (-x['points'], -x['gd'], -x['gf']))

# Save to JSON
with open('data.json', 'w') as f:
    json.dump(standings, f, indent=2)
