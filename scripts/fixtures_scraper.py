import requests
import json
import re
from datetime import datetime
from bs4 import BeautifulSoup
from pathlib import Path

# Configuration
UNDERSTAT_URL = "https://understat.com/league/EPL"
GAMEWEEK_FILE = Path("../data/gameweek.json")
OUTPUT_FILE = Path("../data/scores_fixtures.json")
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
}

TEAM_CODES = {
    "Nottingham Forest": "NFO",
    "Manchester City": "MCI",
    "Liverpool": "LIV",
    "Newcastle United": "NEW",
    "West Ham": "WHU",
    "Southampton": "SOU",
    "Brighton": "BHA",
    "Fulham": "FUL",
    "Crystal Palace": "CRY",
    "Ipswich": "IPS",
    "Brentford": "BRE",
    "Aston Villa": "AVL",
    "Wolverhampton Wanderers": "WOL",
    "Everton": "EVE",
    "Tottenham": "TOT",
    "Bournemouth": "BOU",
    "Chelsea": "CHE",
    "Leicester": "LEI",
    "Manchester United": "MUN",
    "Arsenal": "ARS"
}

def fetch_understat_matches():
    """Fetch match data from Understat including team codes"""
    response = requests.get(UNDERSTAT_URL, headers=HEADERS)
    soup = BeautifulSoup(response.content, 'html.parser')
    scripts = soup.find_all('script')
    
    matches = []
    
    for script in scripts:
        if script.string and 'datesData' in script.string:
            json_match = re.search(r"JSON\.parse\('(.*?)'\)", script.string)
            if not json_match:
                continue
                
            json_str = json_match.group(1)
            try:
                decoded_json = bytes(json_str, 'utf-8').decode('unicode_escape')
                raw_matches = json.loads(decoded_json)
            except (UnicodeDecodeError, json.JSONDecodeError) as e:
                print(f"Error decoding JSON: {e}")
                return []

            for match in raw_matches:
                try:
                    dt = datetime.strptime(match['datetime'], '%Y-%m-%d %H:%M:%S')
                    home_team = match['h']['title']
                    away_team = match['a']['title']
                    
                    matches.append({
                        "Date": dt.strftime('%Y-%m-%d'),
                        "Time": dt.strftime('%H:%M'),
                        "Home": home_team,
                        "HomeCode": TEAM_CODES[home_team],
                        "Away": away_team,
                        "AwayCode": TEAM_CODES[away_team],
                        "Score": f"{match['goals']['h']}-{match['goals']['a']}" if match.get('isResult') else "TBD",
                        "Played": match.get('isResult', False)
                    })
                except (KeyError, ValueError) as e:
                    print(f"Skipping match due to error: {e}")
                    continue
            break
            
    return sorted(matches, key=lambda x: x['Date'])

def load_gameweek_data():
    """Load pre-existing gameweek data with week numbers"""
    try:
        with open(GAMEWEEK_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError) as e:
        print(f"Error loading gameweek data: {e}")
        return []

def create_understat_lookup(understat_matches):
    """Create lookup dictionary based on date and team codes"""
    return {
        (m['Date'], m['HomeCode'], m['AwayCode']): {
            'Score': m['Score'],
            'Played': m['Played']
        }
        for m in understat_matches
    }

def combine_data(gameweek_data, understat_lookup):
    """Merge Understat scores into gameweek data"""
    for match in gameweek_data:
        key = (match['Date'], match['HomeCode'], match['AwayCode'])
        understat_info = understat_lookup.get(key)
        if understat_info is not None:
            match['Score'] = understat_info['Score']
            match['Played'] = understat_info['Played']
        else:
            # Set default values if not found in Understat
            match['Score'] = "TBD"
            match['Played'] = False
    return gameweek_data

def save_data(data):
    """Save combined data to JSON file"""
    try:
        OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"Successfully saved {len(data)} matches to {OUTPUT_FILE}")
    except IOError as e:
        print(f"Error saving data: {e}")

def main():
    # Fetch data from both sources
    print("Fetching Understat matches...")
    understat_matches = fetch_understat_matches()
    
    print("Loading gameweek data...")
    gameweek_data = load_gameweek_data()
    
    # Create lookup table for Understat scores
    understat_lookup = create_understat_lookup(understat_matches)
    
    # Update gameweek data with scores from Understat
    print("Merging data...")
    combined_data = combine_data(gameweek_data, understat_lookup)
    
    # Verify and save results
    if not combined_data:
        print("No data to save")
        return
    
    missing_score = sum(1 for m in combined_data if m['Score'] == "TBD")
    print(f"Matches without scores: {missing_score}")
    
    save_data(combined_data)
    print("First match sample:", json.dumps(combined_data[0], indent=2))

if __name__ == "__main__":
    main()
