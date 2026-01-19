# ============================================================================
# OPTIMIZED ACTIVITY DATA PROCESSING PIPELINE
# ============================================================================
# This refactored version provides:
# - 3 intensity levels instead of 4 (removed "Very Vigorous")
# - Configuration-driven categorization (no hardcoded matchers)
# - Simpler, more maintainable code structure
# - Better separation of concerns
# ============================================================================

import json
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Iterator

import pandas as pd
import pdfplumber
import yaml


# ============================================================================
# CONFIGURATION
# ============================================================================

PROJECT_ROOT = Path(__file__).parent.parent.parent
DATA_DIR = PROJECT_ROOT / "data"
RAW_DATA_DIR = DATA_DIR / "raw"
PROCESSED_DATA_DIR = DATA_DIR / "processed"

INPUT_PDF = RAW_DATA_DIR / "compendium-2024.pdf"
OUTPUT_JSON = PROCESSED_DATA_DIR / "activity-hierarchy.json"
CATEGORY_CONFIG = Path(__file__).parent / "category-config.yaml"

# Simplified intensity thresholds (3 levels instead of 4)
INTENSITY_THRESHOLDS = {
    'Light': (0.0, 4.0),
    'Moderate': (4.0, 7.0),
    'Vigorous': (7.0, float('inf'))  # Combines old "Vigorous" + "Very Vigorous"
}

INTENSITY_ORDER = ['Light', 'Moderate', 'Vigorous']

# Filtering
MIN_MET_VALUE = 2.0
EXCLUDED_CATEGORIES = frozenset([
    'Inactivity', 'Self Care', 'Sexual Activity', 'Miscellaneous',
    'Music Playing', 'Occupation', 'Home Activities', 'Home Repair',
    'Religious Activities', 'Volunteer Activities', 'Transportation',
    'Lawn & Garden', 'Fishing & Hunting', 'Video Games'
])

# Unit conversions
CONVERSION_FACTORS = {
    'mph_to_kmh': 1.60934,
    'lb_to_kg': 0.453592,
    'yards_to_meters': 0.9144,
    'inches_to_cm': 2.54
}


# ============================================================================
# DATA MODELS
# ============================================================================

@dataclass
class Activity:
    """Represents a processed activity with full hierarchy"""
    level1_main: str
    level2_subcategory: str
    level3_activity: str
    level4_intensity: str
    met_value: float
    examples: str


# ============================================================================
# STEP 1: EXTRACT FROM PDF
# ============================================================================

def extract_activities_from_pdf(pdf_path: Path) -> pd.DataFrame:
    """
    Extract activities from PDF using simple regex pattern matching.
    
    Expected format: "Category 01234 5.6 Description text"
    """
    activities = []
    
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if not text:
                continue
            
            for line in text.split('\n'):
                activity = _parse_activity_line(line)
                if activity:
                    activities.append(activity)
    
    if not activities:
        raise ValueError(f"No activities extracted from {pdf_path}")
    
    df = pd.DataFrame(activities)
    df['met_value'] = pd.to_numeric(df['met_value'], errors='coerce')
    df = df.dropna(subset=['met_value'])
    
    print(f"✅ Extracted {len(df)} activities from PDF")
    return df


def _parse_activity_line(line: str) -> dict | None:
    """Parse a single line into activity components."""
    if not line.strip() or 'Major Heading' in line or 'Activity Code' in line:
        return None
    
    pattern = r'^(.+?)\s+(\d{5})\s+(\d+\.?\d*)\s+(.+)$'
    match = re.match(pattern, line.strip())
    
    if not match:
        return None
    
    major_heading = match.group(1).strip()
    activity_code = match.group(2).strip()
    met_value = match.group(3).strip()
    description = match.group(4).strip()
    
    if not activity_code.isdigit() or len(activity_code) != 5:
        return None
    
    return {
        'major_heading': major_heading,
        'activity_code': activity_code,
        'met_value': met_value,
        'description': description
    }


# ============================================================================
# STEP 2: FILTER ACTIVITIES
# ============================================================================

def filter_activities(df: pd.DataFrame) -> pd.DataFrame:
    """Remove non-exercise activities and low-intensity activities."""
    df = df.copy()
    
    # Filter by category
    df = df[~df['major_heading'].isin(EXCLUDED_CATEGORIES)]
    
    # Filter by minimum MET value
    df = df[df['met_value'] >= MIN_MET_VALUE]
    
    print(f"✅ Filtered to {len(df)} exercise activities")
    return df


# ============================================================================
# STEP 3: CONVERT UNITS
# ============================================================================

def convert_imperial_to_metric(df: pd.DataFrame) -> pd.DataFrame:
    """Convert imperial units to metric in descriptions."""
    df = df.copy()
    df['description'] = df['description'].apply(_convert_description)
    print(f"✅ Converted imperial units to metric")
    return df


def _convert_description(text: str) -> str:
    """Apply all unit conversions to a description."""
    # Speed: mph → km/h
    text = re.sub(
        r'(\d+\.?\d*)\s*mph',
        lambda m: f"{float(m.group(1)) * CONVERSION_FACTORS['mph_to_kmh']:.1f} km/h",
        text
    )
    
    # Weight: lb/pounds → kg
    text = re.sub(
        r'(\d+\.?\d*)\s*(?:lb|lbs|pounds?)',
        lambda m: f"{float(m.group(1)) * CONVERSION_FACTORS['lb_to_kg']:.1f} kg",
        text
    )
    
    # Distance: yards → meters
    text = re.sub(
        r'(\d+\.?\d*)\s*yards?',
        lambda m: f"{float(m.group(1)) * CONVERSION_FACTORS['yards_to_meters']:.0f} meters",
        text
    )
    
    # Distance: inches → cm
    text = re.sub(
        r'(\d+\.?\d*)\s*-?\s*inch(?:es)?',
        lambda m: f"{float(m.group(1)) * CONVERSION_FACTORS['inches_to_cm']:.0f} cm",
        text
    )
    
    return text


# ============================================================================
# STEP 4: CATEGORIZE USING CONFIG
# ============================================================================

def assign_hierarchy(df: pd.DataFrame, config_path: Path = CATEGORY_CONFIG) -> pd.DataFrame:
    """
    Assign 4-level hierarchy using configuration-driven rules.
    
    This replaces the old hardcoded matcher functions with a simple
    YAML configuration file that's easy to maintain.
    """
    df = df.copy()
    
    # Load category configuration
    with open(config_path) as f:
        config = yaml.safe_load(f)
    
    # Apply categorization rules
    def categorize_row(row):
        heading = row['major_heading']
        desc = row['description'].lower()
        met = row['met_value']
        
        # Try to match against configuration rules
        for rule in config['rules']:
            if _matches_rule(heading, desc, rule):
                intensity = _classify_intensity(met)
                return (
                    rule['level1_main'],
                    rule['level2_subcategory'],
                    rule['level3_activity'],
                    intensity
                )
        
        return None, None, None, None
    
    hierarchy = df.apply(categorize_row, axis=1)
    df[['level1_main', 'level2_subcategory', 'level3_activity', 'level4_intensity']] = pd.DataFrame(
        hierarchy.tolist(),
        index=df.index
    )
    
    # Remove uncategorized activities
    before = len(df)
    df = df.dropna(subset=['level1_main'])
    after = len(df)
    
    if before > after:
        print(f"⚠️  Dropped {before - after} uncategorized activities")
    
    print(f"✅ Assigned hierarchy to {len(df)} activities")
    return df


def _matches_rule(heading: str, description: str, rule: dict) -> bool:
    """Check if an activity matches a categorization rule."""
    # Check heading match
    if 'heading' in rule:
        if rule['heading'] != heading:
            return False
    
    # Check keyword requirements (all must be present)
    if 'keywords_all' in rule:
        if not all(kw in description for kw in rule['keywords_all']):
            return False
    
    # Check keyword options (at least one must be present)
    if 'keywords_any' in rule:
        if not any(kw in description for kw in rule['keywords_any']):
            return False
    
    # Check excluded keywords (none should be present)
    if 'keywords_none' in rule:
        if any(kw in description for kw in rule['keywords_none']):
            return False
    
    return True


def _classify_intensity(met: float) -> str:
    """Classify intensity based on MET value (3 levels)."""
    for intensity, (min_met, max_met) in INTENSITY_THRESHOLDS.items():
        if min_met <= met < max_met:
            return intensity
    return 'Vigorous'  # Fallback


# ============================================================================
# STEP 5: CONSOLIDATE ACTIVITIES
# ============================================================================

def consolidate_activities(df: pd.DataFrame) -> pd.DataFrame:
    """
    Consolidate similar activities by taking median MET values
    and combining example descriptions.
    """
    consolidated = df.groupby(
        ['level1_main', 'level2_subcategory', 'level3_activity', 'level4_intensity'],
        as_index=False
    ).agg({
        'met_value': 'median',
        'description': lambda x: ' / '.join(x.head(3))
    })
    
    consolidated = consolidated.rename(columns={'description': 'examples'})
    consolidated['met_value'] = consolidated['met_value'].round(1)
    
    # Sort by hierarchy
    consolidated = consolidated.sort_values(
        ['level1_main', 'level2_subcategory', 'level3_activity', 'met_value'],
        ascending=[True, True, True, False]
    )
    
    print(f"✅ Consolidated to {len(consolidated)} unique activities")
    return consolidated


# ============================================================================
# STEP 6: EXPORT TO JSON
# ============================================================================

def export_to_json(df: pd.DataFrame, output_path: Path) -> dict:
    """
    Export consolidated activities to nested JSON hierarchy.
    
    Structure:
    {
      "Main Category": {
        "Subcategory": {
          "Activity": {
            "Intensity": [
              {"met_value": X, "examples": "..."}
            ]
          }
        }
      }
    }
    """
    hierarchy = {}
    
    for _, row in df.iterrows():
        level1 = row['level1_main']
        level2 = row['level2_subcategory']
        level3 = row['level3_activity']
        level4 = row['level4_intensity']
        
        # Build nested structure
        if level1 not in hierarchy:
            hierarchy[level1] = {}
        if level2 not in hierarchy[level1]:
            hierarchy[level1][level2] = {}
        if level3 not in hierarchy[level1][level2]:
            hierarchy[level1][level2][level3] = {}
        if level4 not in hierarchy[level1][level2][level3]:
            hierarchy[level1][level2][level3][level4] = []
        
        # Add MET data
        hierarchy[level1][level2][level3][level4].append({
            'met_value': row['met_value'],
            'examples': row['examples']
        })
    
    # Sort intensities in each activity
    for cat in hierarchy.values():
        for subcat in cat.values():
            for activity in subcat.values():
                sorted_activity = {
                    intensity: activity[intensity]
                    for intensity in INTENSITY_ORDER
                    if intensity in activity
                }
                activity.clear()
                activity.update(sorted_activity)
    
    # Write to file
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, 'w') as f:
        json.dump(hierarchy, f, indent=2)
    
    print(f"✅ Exported to {output_path}")
    return hierarchy


# ============================================================================
# MAIN PIPELINE
# ============================================================================

def run_pipeline(
    input_pdf: Path = INPUT_PDF,
    output_json: Path = OUTPUT_JSON,
    config_path: Path = CATEGORY_CONFIG
) -> dict:
    """Run the complete optimized data processing pipeline."""
    
    print("=" * 80)
    print("ACTIVITY DATA PROCESSING PIPELINE (OPTIMIZED)")
    print("=" * 80)
    print(f"📖 Input PDF: {input_pdf}")
    print(f"📋 Config: {config_path}")
    print(f"💾 Output: {output_json}")
    print()
    
    # Step 1: Extract from PDF
    print("Step 1: Extracting from PDF...")
    df = extract_activities_from_pdf(input_pdf)
    
    # Step 2: Filter non-exercise activities
    print("\nStep 2: Filtering activities...")
    df = filter_activities(df)
    
    # Step 3: Convert units
    print("\nStep 3: Converting units...")
    df = convert_imperial_to_metric(df)
    
    # Step 4: Assign hierarchy
    print("\nStep 4: Assigning hierarchy...")
    df = assign_hierarchy(df, config_path)
    
    # Step 5: Consolidate
    print("\nStep 5: Consolidating activities...")
    df = consolidate_activities(df)
    
    # Step 6: Export
    print("\nStep 6: Exporting to JSON...")
    hierarchy = export_to_json(df, output_json)
    
    # Summary
    print("\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print(f"Total activities: {len(df)}")
    print(f"Main categories: {df['level1_main'].nunique()}")
    print(f"Subcategories: {df['level2_subcategory'].nunique()}")
    print(f"Activity types: {df['level3_activity'].nunique()}")
    print(f"Intensity levels: {df['level4_intensity'].nunique()}")
    print(f"MET range: {df['met_value'].min():.1f} - {df['met_value'].max():.1f}")
    print()
    
    print("Activities by category:")
    for cat in sorted(df['level1_main'].unique()):
        count = len(df[df['level1_main'] == cat])
        print(f"  {cat}: {count}")
    
    print("\n" + "=" * 80)
    print("✅ Pipeline completed successfully!")
    print("=" * 80)
    
    return hierarchy


if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description="Process Physical Activity Compendium data")
    parser.add_argument('--input', type=Path, default=INPUT_PDF, help='Input PDF file')
    parser.add_argument('--output', type=Path, default=OUTPUT_JSON, help='Output JSON file')
    parser.add_argument('--config', type=Path, default=CATEGORY_CONFIG, help='Category config file')
    
    args = parser.parse_args()
    
    try:
        run_pipeline(
            input_pdf=args.input,
            output_json=args.output,
            config_path=args.config
        )
    except Exception as e:
        print(f"\n❌ Pipeline failed: {e}")
        raise