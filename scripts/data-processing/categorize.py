from typing import Protocol

import pandas as pd

from config import INTENSITY_THRESHOLDS
from models import IntensityLevel


class ActivityMatcher(Protocol):
    """Protocol for activity category matchers"""
    def match(self, heading: str, description: str, met: float) -> tuple[str, str, str] | None:
        """Return (level2, level3, level4) if matched, None otherwise"""
        ...


def assign_hierarchy(df: pd.DataFrame) -> pd.DataFrame:
    """
    Assign 4-level hierarchy to each activity:
    Level 1: Main Category (e.g., "Endurance Sports")
    Level 2: Subcategory (e.g., "Bicycling")
    Level 3: Activity Type (e.g., "Stationary Bike")
    Level 4: Intensity (based on MET value)
    """
    df = df.copy()
    
    # Apply categorization
    hierarchy = df.apply(_categorize_activity, axis=1)
    
    # ✅ FIXED: Use descriptive column names to match export.py
    df[['level1_main', 'level2_subcategory', 'level3_activity', 'level4_intensity']] = pd.DataFrame(
        hierarchy.tolist(), 
        index=df.index
    )
    
    # Remove uncategorized activities
    before = len(df)
    df = df.dropna(subset=['level1_main', 'level2_subcategory', 'level3_activity', 'level4_intensity'])
    after = len(df)
    
    if before > after:
        print(f"⚠️  Dropped {before - after} uncategorized activities")
    
    print(f"✅ Assigned hierarchy to {len(df)} activities")
    return df


def _categorize_activity(row: pd.Series) -> tuple[str | None, str | None, str | None, str | None]:
    """Categorize a single activity into 4 levels"""
    heading = row['major_heading']
    desc = row['description'].lower()
    met = row['met_value']
    
    # Try each main category
    for level1, matcher in CATEGORY_MATCHERS.items():
        result = matcher(heading, desc, met)
        if result:
            level2, level3 = result
            level4 = _classify_intensity(met)
            return level1, level2, level3, level4
    
    return None, None, None, None


def _classify_intensity(met: float) -> IntensityLevel:
    """Classify intensity based on MET value"""
    for intensity, (min_met, max_met) in INTENSITY_THRESHOLDS.items():
        if min_met <= met < max_met:
            return intensity
    return 'Very Vigorous'  # Fallback for very high MET


# Category matching functions
def _match_endurance_sports(heading: str, desc: str, met: float) -> tuple[str, str] | None:
    """Match endurance sports activities"""
    if heading == 'Running':
        return 'Running', 'Running'
    
    elif heading == 'Bicycling':
        if 'stationary' in desc:
            return 'Bicycling', 'Stationary Bike'
        return 'Bicycling', 'Bicycling'
    
    elif heading == 'Walking':
        return 'Walking', 'Walking'
    
    elif heading == 'Winter Activities':
        if 'skiing' in desc and 'cross' in desc:
            return 'Winter Sports', 'Cross-Country Skiing'
        elif 'skiing' in desc and 'downhill' in desc:
            return 'Winter Sports', 'Downhill Skiing'
        elif 'snowboard' in desc:
            return 'Winter Sports', 'Snowboarding'
        elif 'skating' in desc and 'ice' in desc:
            return 'Winter Sports', 'Ice Skating'
    
    return None


def _match_fitness_wellness(heading: str, desc: str, met: float) -> tuple[str, str] | None:
    """Match fitness & wellness activities"""
    if heading == 'Dancing':
        return 'Dancing', 'Dancing'
    
    elif heading == 'Conditioning Exercise':
        if 'yoga' in desc:
            return 'Mind-Body', 'Yoga'
        elif 'pilates' in desc:
            return 'Mind-Body', 'Pilates'
        elif 'aerobic' in desc:
            return 'Strength & Conditioning', 'Aerobics & Cardio Classes'
        elif 'rowing' in desc and 'stationary' in desc:
            return 'Indoor Cardio', 'Rowing Machine'
        elif 'elliptical' in desc:
            return 'Indoor Cardio', 'Elliptical Trainer'
        elif 'weight' in desc or 'resistance' in desc:
            return 'Strength & Conditioning', 'Weight Training'
        elif 'circuit' in desc:
            return 'Strength & Conditioning', 'Circuit Training'
        elif any(kw in desc for kw in ['calisthenics', 'rope', 'conditioning']):
            return 'Strength & Conditioning', 'General Conditioning'
    
    return None


def _match_sports(heading: str, desc: str, met: float) -> tuple[str, str] | None:
    """Match sports activities"""
    if heading == 'Sports':
        # Team Sports
        if 'basketball' in desc:
            return 'Team Sports', 'Basketball'
        elif 'soccer' in desc or ('football' in desc and 'touch' in desc):
            return 'Team Sports', 'Soccer'
        elif 'volleyball' in desc:
            return 'Team Sports', 'Volleyball'
        elif 'hockey' in desc and 'ice' in desc:
            return 'Team Sports', 'Ice Hockey'
        elif 'hockey' in desc and 'field' in desc:
            return 'Team Sports', 'Field Hockey'
        elif 'floorball' in desc:
            return 'Team Sports', 'Floorball'
        
        # Racket Sports
        elif 'tennis' in desc and 'table' not in desc:
            return 'Racket Sports', 'Tennis'
        elif 'badminton' in desc:
            return 'Racket Sports', 'Badminton'
        elif 'squash' in desc:
            return 'Racket Sports', 'Squash'
        
        # Combat Sports
        elif 'boxing' in desc:
            return 'Combat Sports', 'Boxing'
        elif any(kw in desc for kw in ['martial', 'karate', 'judo', 'taekwondo']):
            return 'Combat Sports', 'Martial Arts'
        
        # Climbing
        elif 'climbing' in desc or 'rock' in desc:
            return 'Climbing', 'Climbing'
    
    elif heading == 'Water Activities':
        if 'swimming' in desc:
            return 'Water Sports', 'Swimming'
        elif 'kayak' in desc:
            return 'Water Sports', 'Kayaking'
        elif 'rowing' in desc or 'canoe' in desc:
            return 'Water Sports', 'Rowing'
        elif 'water aerobic' in desc:
            return 'Water Sports', 'Water Aerobics'
    
    return None


# Matcher registry
CATEGORY_MATCHERS: dict[str, callable] = {
    'Endurance Sports': _match_endurance_sports,
    'Fitness & Wellness': _match_fitness_wellness,
    'Sports': _match_sports,
}