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
    "Nottm Forest": "Nottingham Forest",
    "Man City": "Manchester City",
    "Man Utd": "Manchester United",
    "Newcastle": "Newcastle United",
    "Wolves": "Wolverhampton Wanderers",
    "Tottenham": "Tottenham Hotspur",
    "West Ham": "West Ham United",
    "Nott'm Forest": "Nottingham Forest",
    "Nottingham F...": "Nott'ham Forest",
    "Manchester C...": "Manchester City",
    "Wolverhampt...": "Wolverhampton Wanderers",
    "Manchester U...": "Manchester United",
    "Newcastle Un...": "Newcastle United",
    "Leicester": "Leicester City",
    "Bournemouth": "AFC Bournemouth",
    "Brighton": "Brighton & Hove Albion",
    "Ipswich": "Ipswich Town",
    "Leicester C...": "Leicester City",
    "Brighton &...": "Brighton & Hove Albion",
    "AFC Bournem...": "AFC Bournemouth",
    "Ipswich Tow...": "Ipswich Town"
}

# Fetch data from FBref
url = "https://fbref.com/en/comps/9/Premier-League-Stats"
headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'}

try:
    response = requests.get(url, headers=headers)
    response.raise_for_status()
except requests.exceptions.RequestException as e:
    print(f"Error fetching data: {e}")
    exit()

soup = BeautifulSoup(response.content, 'html.parser')
table = soup.find('table', id='results2024-202591_overall')

teams = []
for row in table.find('tbody').find_all('tr'):
    # Extract and map team name
    team_cell = row.find('td', {'data-stat': 'team'})
    if not team_cell: continue
    team = team_name_mapping.get(team_cell.text.strip(), team_cell.text.strip())
    
    # Extract stats
    teams.append({
        'team': team,
        'logo': team_logos.get(team, ''),
        'matches': int(row.find('td', {'data-stat': 'games'}).text),
        'wins': int(row.find('td', {'data-stat': 'wins'}).text),
        'draws': int(row.find('td', {'data-stat': 'ties'}).text),
        'losses': int(row.find('td', {'data-stat': 'losses'}).text),
        'gf': int(row.find('td', {'data-stat': 'goals_for'}).text),
        'ga': int(row.find('td', {'data-stat': 'goals_against'}).text),
        'gd': int(row.find('td', {'data-stat': 'goal_diff'}).text),
        'points': int(row.find('td', {'data-stat': 'points'}).text),
        'xg': float(row.find('td', {'data-stat': 'xg_for'}).text),
        'xga': float(row.find('td', {'data-stat': 'xg_against'}).text),
        'last_5': ' '.join([div.text.strip() for div in row.find('td', {'data-stat': 'last_5'}).find_all('div', class_='poptip')])
    })

# Sort and save
teams.sort(key=lambda x: (-x['points'], -x['gd'], -x['gf']))
with open('data.json', 'w') as f:
    json.dump(teams, f, indent=2)

print("Data successfully saved to data.json")
