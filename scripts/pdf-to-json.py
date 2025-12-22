import pdfplumber
import pandas as pd
import re
import json

print("📖 Reading PDF and extracting activities...")

# Read PDF
with pdfplumber.open('data/raw/1_2024-adult-compendium_1_2024.pdf') as pdf:
    all_data = []
    
    for page_num, page in enumerate(pdf.pages):
        print(f"  Processing page {page_num + 1}...")
        text = page.extract_text()
        
        if not text:
            continue
        
        lines = text.split('\n')
        
        for line in lines:
            if not line.strip() or 'Major Heading' in line or 'Activity Code' in line:
                continue
            
            match = re.match(r'^(.+?)\s+(\d{5})\s+(\d+\.?\d*)\s+(.+)$', line.strip())
            
            if match:
                major_heading = match.group(1).strip()
                activity_code = match.group(2).strip()
                met_value = match.group(3).strip()
                description = match.group(4).strip()
                
                all_data.append([major_heading, activity_code, met_value, description])

print(f"✅ Extracted {len(all_data)} activities from PDF")

# Create DataFrame
df = pd.DataFrame(all_data, columns=['Major Heading', 'Activity Code', 'MET Value', 'Activity Description'])
df['MET Value'] = pd.to_numeric(df['MET Value'], errors='coerce')

print(f"\n🔍 Filtering activities...")

# FILTERING: Remove low-intensity and non-exercise activities
df = df[df['MET Value'] >= 2.0]

excluded_categories = [
    'Inactivity', 'Self Care', 'Sexual Activity', 'Miscellaneous',
    'Music Playing', 'Occupation', 'Home Activities', 'Home Repair',
    'Religious Activities', 'Volunteer Activities', 'Transportation',
    'Lawn & Garden', 'Fishing & Hunting', 'Video Games'
]
df = df[~df['Major Heading'].isin(excluded_categories)]

# Walking: Only keep exercise walking
walking_keywords = ['exercise', 'brisk', 'hiking', 'backpack', 'climbing', 'stairs', 'uphill', 'nordic']
df = df[~((df['Major Heading'] == 'Walking') & 
          (df['MET Value'] < 2.5) & 
          (~df['Activity Description'].str.lower().str.contains('|'.join(walking_keywords), na=False)))]

print(f"✅ {len(df)} activities after filtering")

# Convert imperial units to metric
print(f"\n🔄 Converting imperial units to metric...")

def convert_to_metric(description):
    """Convert imperial measurements to metric"""
    # mph to km/h
    def mph_to_kmh(match):
        mph = float(match.group(1))
        kmh = mph * 1.60934
        return f"{kmh:.1f} km/h"
    description = re.sub(r'(\d+\.?\d*)\s*mph', mph_to_kmh, description)
    
    # min/mile to min/km
    def min_per_mile_to_min_per_km(match):
        min_per_mile = float(match.group(1))
        min_per_km = min_per_mile / 1.60934
        return f"{min_per_km:.1f} min/km"
    description = re.sub(r'(\d+\.?\d*)\s*min/mile', min_per_mile_to_min_per_km, description)
    
    # pounds to kg
    def lb_to_kg(match):
        lb = float(match.group(1))
        kg = lb * 0.453592
        return f"{kg:.1f} kg"
    
    def lb_range_to_kg(match):
        lb1 = float(match.group(1))
        lb2 = float(match.group(2))
        kg1 = lb1 * 0.453592
        kg2 = lb2 * 0.453592
        return f"{kg1:.1f}-{kg2:.1f} kg"
    
    description = re.sub(r'(\d+\.?\d*)\s*-\s*(\d+\.?\d*)\s*lbs?', lb_range_to_kg, description)
    description = re.sub(r'(\d+\.?\d*)\s+to\s+(\d+\.?\d*)\s*lbs?', lb_range_to_kg, description)
    description = re.sub(r'(\d+\.?\d*)\s*lbs?(?!\s*-|\s+to)', lb_to_kg, description)
    description = re.sub(r'(\d+\.?\d*)\s*pounds?', lb_to_kg, description)
    
    # yards to meters
    def yards_to_meters(match):
        yards = float(match.group(1))
        meters = yards * 0.9144
        return f"{meters:.0f} meters"
    description = re.sub(r'(\d+\.?\d*)\s*yards?', yards_to_meters, description)
    
    # inches to cm
    def inches_to_cm(match):
        inches = float(match.group(1))
        cm = inches * 2.54
        return f"{cm:.0f} cm"
    description = re.sub(r'(\d+\.?\d*)\s*-?\s*inch', inches_to_cm, description)
    
    return description

df['Activity Description'] = df['Activity Description'].apply(convert_to_metric)

print(f"\n🏗️  Creating CONSISTENT 4-level hierarchical structure...")

def categorize_to_4_levels(row):
    """
    Assign EXACTLY 4 levels consistently:
    Level 1: Main Category (e.g., "Endurance Sports")
    Level 2: Subcategory (e.g., "Bicycling")
    Level 3: Activity Type (e.g., "Outdoor Cycling" or "Stationary Bike")
    Level 4: Intensity (e.g., "Vigorous")
    
    CRITICAL: Every path must have all 4 levels!
    """
    heading = row['Major Heading']
    description = row['Activity Description'].lower()
    met = row['MET Value']
    
    # Default values
    level1 = None
    level2 = None
    level3 = None
    
    # === ENDURANCE SPORTS ===
    if heading == 'Running':
        level1 = 'Endurance Sports'
        level2 = 'Running'
        level3 = 'Running'  # Single activity type
    
    elif heading == 'Bicycling':
        level1 = 'Endurance Sports'
        level2 = 'Bicycling'
        if 'stationary' in description:
            level3 = 'Stationary Bike'
        else:
            level3 = 'Bicycling'
    
    elif heading == 'Walking':
        level1 = 'Endurance Sports'
        level2 = 'Walking'
        level3 = 'Walking'  # Single activity type
    
    elif heading == 'Winter Activities':
        level1 = 'Endurance Sports'
        level2 = 'Winter Sports'
        if 'skiing' in description and 'cross' in description:
            level3 = 'Cross-Country Skiing'
        elif 'skiing' in description and 'downhill' in description:
            level3 = 'Downhill Skiing'
        elif 'snowboard' in description:
            level3 = 'Snowboarding'
        elif 'skating' in description and 'ice' in description:
            level3 = 'Ice Skating'
        else:
            return pd.Series({'level1': None, 'level2': None, 'level3': None, 'level4': None})
    
    # === FITNESS & WELLNESS ===
    elif heading == 'Conditioning Exercise':
        level1 = 'Fitness & Wellness'
        
        if 'yoga' in description:
            level2 = 'Mind-Body'
            level3 = 'Yoga'
        elif 'pilates' in description:
            level2 = 'Mind-Body'
            level3 = 'Pilates'
        elif 'aerobic' in description:
            level2 = 'Strength & Conditioning'
            level3 = 'Aerobics & Cardio Classes'
        elif 'rowing' in description and 'stationary' in description:
            level2 = 'Indoor Cardio'
            level3 = 'Rowing Machine'
        elif 'elliptical' in description:
            level2 = 'Indoor Cardio'
            level3 = 'Elliptical Trainer'
        elif 'stationary' in description and 'bike' in description:
            level2 = 'Indoor Cardio'
            level3 = 'Stationary Bike'
        elif 'weight' in description or 'resistance' in description:
            level2 = 'Strength & Conditioning'
            level3 = 'Weight Training'
        elif 'circuit' in description:
            level2 = 'Strength & Conditioning'
            level3 = 'Circuit Training'
        elif 'calisthenics' in description or 'rope' in description or 'conditioning' in description:
            level2 = 'Strength & Conditioning'
            level3 = 'General Conditioning'
        else:
            return pd.Series({'level1': None, 'level2': None, 'level3': None, 'level4': None})
    
    elif heading == 'Dancing':
        level1 = 'Fitness & Wellness'
        level2 = 'Dancing'
        level3 = 'Dancing'  # Single activity type
    
    # === SPORTS ===
    elif heading == 'Sports':
        level1 = 'Sports'
        
        if 'basketball' in description:
            level2 = 'Team Sports'
            level3 = 'Basketball'
        elif 'soccer' in description or ('football' in description and 'touch' in description):
            level2 = 'Team Sports'
            level3 = 'Soccer'
        elif 'volleyball' in description:
            level2 = 'Team Sports'
            level3 = 'Volleyball'
        elif 'hockey' in description and 'ice' in description:
            level2 = 'Team Sports'
            level3 = 'Ice Hockey'
        elif 'hockey' in description and 'field' in description:
            level2 = 'Team Sports'
            level3 = 'Field Hockey'
        elif 'floorball' in description:
            level2 = 'Team Sports'
            level3 = 'Floorball'
        elif 'tennis' in description and 'table' not in description:
            level2 = 'Racket Sports'
            level3 = 'Tennis'
        elif 'badminton' in description:
            level2 = 'Racket Sports'
            level3 = 'Badminton'
        elif 'squash' in description:
            level2 = 'Racket Sports'
            level3 = 'Squash'
        elif 'boxing' in description:
            level2 = 'Combat Sports'
            level3 = 'Boxing'
        elif any(x in description for x in ['martial', 'karate', 'judo', 'taekwondo']):
            level2 = 'Combat Sports'
            level3 = 'Martial Arts'
        elif 'climbing' in description or 'rock' in description:
            level2 = 'Climbing'
            level3 = 'Climbing'
        else:
            return pd.Series({'level1': None, 'level2': None, 'level3': None, 'level4': None})
    
    elif heading == 'Water Activities':
        level1 = 'Sports'
        level2 = 'Water Sports'
        
        if 'swimming' in description:
            level3 = 'Swimming'
        elif 'kayak' in description:
            level3 = 'Kayaking'
        elif 'rowing' in description or 'canoe' in description:
            level3 = 'Rowing'
        elif 'water aerobic' in description:
            level3 = 'Water Aerobics'
        else:
            return pd.Series({'level1': None, 'level2': None, 'level3': None, 'level4': None})
    
    else:
        return pd.Series({'level1': None, 'level2': None, 'level3': None, 'level4': None})
    
    # Level 4: Intensity based on MET value (ALWAYS PRESENT)
    if met < 4.0:
        level4 = 'Light'
    elif met < 7.0:
        level4 = 'Moderate'
    elif met < 11.0:
        level4 = 'Vigorous'
    else:
        level4 = 'Very Vigorous'
    
    return pd.Series({
        'level1': level1,
        'level2': level2,
        'level3': level3,
        'level4': level4
    })

# Apply categorization
df[['level1', 'level2', 'level3', 'level4']] = df.apply(categorize_to_4_levels, axis=1)

# Remove rows where categorization returned None
df = df.dropna(subset=['level1', 'level2', 'level3', 'level4'])

# Consolidate similar activities
print(f"📊 Consolidating similar activities...")
consolidated = df.groupby(['level1', 'level2', 'level3', 'level4']).agg({
    'MET Value': 'median',
    'Activity Description': lambda x: ' / '.join(x.head(3))
}).reset_index()

consolidated.columns = ['level1_main', 'level2_subcategory', 'level3_activity', 'level4_intensity', 'MET_Value', 'Example_Descriptions']
consolidated['MET_Value'] = consolidated['MET_Value'].round(1)
consolidated = consolidated.sort_values(['level1_main', 'level2_subcategory', 'level3_activity', 'MET_Value'], ascending=[True, True, True, False])

print(f"\n✅ Data consolidation complete: {len(consolidated)} activities")

# Create JSON structure (ALWAYS 4 levels)
print("\n💾 Creating CONSISTENT 4-level JSON hierarchy...")

hierarchy_json = {}
for _, row in consolidated.iterrows():
    l1 = row['level1_main']
    l2 = row['level2_subcategory']
    l3 = row['level3_activity']
    l4 = row['level4_intensity']
    
    # Build hierarchy: Main → Sub → Activity → Intensity
    if l1 not in hierarchy_json:
        hierarchy_json[l1] = {}
    if l2 not in hierarchy_json[l1]:
        hierarchy_json[l1][l2] = {}
    if l3 not in hierarchy_json[l1][l2]:
        hierarchy_json[l1][l2][l3] = {}
    if l4 not in hierarchy_json[l1][l2][l3]:
        hierarchy_json[l1][l2][l3][l4] = []
    
    hierarchy_json[l1][l2][l3][l4].append({
        'met_value': float(row['MET_Value']),
        'examples': row['Example_Descriptions']
    })

# Verify structure depth
print("\n🔍 Verifying consistent 4-level structure...")

def check_depth(data, current_depth=0, path=""):
    """Recursively check if all paths have exactly 4 levels"""
    if isinstance(data, list):
        # Reached the leaf (activity data)
        return current_depth
    
    depths = []
    for key, value in data.items():
        new_path = f"{path}/{key}" if path else key
        depth = check_depth(value, current_depth + 1, new_path)
        if depth is not None:
            depths.append((depth, new_path))
    
    return depths if current_depth == 0 else max([d[0] for d in depths]) if depths else None

depth_info = check_depth(hierarchy_json)
if isinstance(depth_info, list):
    unique_depths = set(d[0] for d in depth_info)
    if len(unique_depths) == 1 and 4 in unique_depths:
        print(f"✅ Perfect! All {len(depth_info)} paths have exactly 4 levels")
    else:
        print(f"❌ ERROR: Inconsistent depths found: {unique_depths}")
        for depth, path in sorted(depth_info):
            if depth != 4:
                print(f"   Depth {depth}: {path}")

# Save JSON
json_path = 'data/processed/4_level_hierarchy.json'
with open(json_path, 'w') as f:
    json.dump(hierarchy_json, f, indent=2)

print(f"\n✅ JSON structure saved: {json_path}")

# Display summary
print("\n" + "=" * 80)
print("HIERARCHY STRUCTURE SUMMARY")
print("=" * 80)
print(f"Total activities: {len(consolidated)}")
print(f"Level 1 (Main Categories): {consolidated['level1_main'].nunique()}")
print(f"Level 2 (Subcategories): {consolidated['level2_subcategory'].nunique()}")
print(f"Level 3 (Activity Types): {consolidated['level3_activity'].nunique()}")
print(f"Level 4 (Intensity Levels): {consolidated['level4_intensity'].nunique()}")
print(f"MET Value Range: {consolidated['MET_Value'].min():.1f} - {consolidated['MET_Value'].max():.1f}")

print("\n" + "=" * 80)
print("STRUCTURE BY MAIN CATEGORY")
print("=" * 80)
for level1 in sorted(consolidated['level1_main'].unique()):
    subset_l1 = consolidated[consolidated['level1_main'] == level1]
    print(f"\n{level1} ({len(subset_l1)} activities):")
    for level2 in sorted(subset_l1['level2_subcategory'].unique()):
        subset_l2 = subset_l1[subset_l1['level2_subcategory'] == level2]
        print(f"  ├─ {level2}")
        for level3 in sorted(subset_l2['level3_activity'].unique()):
            subset_l3 = subset_l2[subset_l2['level3_activity'] == level3]
            intensities = sorted(subset_l3['level4_intensity'].unique(), 
                               key=lambda x: ['Light', 'Moderate', 'Vigorous', 'Very Vigorous'].index(x))
            print(f"      ├─ {level3} [{', '.join(intensities)}]")

print("\n" + "=" * 80)
print("✅ Script complete!")
print("=" * 80)