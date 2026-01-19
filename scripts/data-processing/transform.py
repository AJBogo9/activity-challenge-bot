import re

import pandas as pd

from config import CONVERSION_FACTORS


def convert_imperial_to_metric(df: pd.DataFrame) -> pd.DataFrame:
    """
    Convert all imperial units to metric in activity descriptions.
    
    Conversions:
    - mph → km/h
    - min/mile → min/km
    - pounds/lb → kg
    - yards → meters
    - inches → cm
    
    Args:
        df: DataFrame with description column
    
    Returns:
        DataFrame with converted descriptions
    """
    df = df.copy()
    df['description'] = df['description'].apply(_convert_description)
    print(f"✅ Converted imperial units to metric")
    return df


def _convert_description(text: str) -> str:
    """Apply all unit conversions to a description"""
    text = _convert_speed(text)
    text = _convert_pace(text)
    text = _convert_weight(text)
    text = _convert_distance(text)
    return text


def _convert_speed(text: str) -> str:
    """Convert mph to km/h"""
    def replace(match):
        mph = float(match.group(1))
        kmh = mph * CONVERSION_FACTORS['mph_to_kmh']
        return f"{kmh:.1f} km/h"
    
    return re.sub(r'(\d+\.?\d*)\s*mph', replace, text)


def _convert_pace(text: str) -> str:
    """Convert min/mile to min/km"""
    def replace(match):
        min_per_mile = float(match.group(1))
        min_per_km = min_per_mile / CONVERSION_FACTORS['mph_to_kmh']
        return f"{min_per_km:.1f} min/km"
    
    return re.sub(r'(\d+\.?\d*)\s*min/mile', replace, text)


def _convert_weight(text: str) -> str:
    """Convert pounds to kg"""
    factor = CONVERSION_FACTORS['lb_to_kg']
    
    # Range: "10-20 lb" or "10 to 20 lb"
    def replace_range(match):
        lb1, lb2 = float(match.group(1)), float(match.group(2))
        return f"{lb1 * factor:.1f}-{lb2 * factor:.1f} kg"
    
    text = re.sub(r'(\d+\.?\d*)\s*-\s*(\d+\.?\d*)\s*lbs?', replace_range, text)
    text = re.sub(r'(\d+\.?\d*)\s+to\s+(\d+\.?\d*)\s*lbs?', replace_range, text)
    
    # Single value: "10 lb"
    def replace_single(match):
        lb = float(match.group(1))
        return f"{lb * factor:.1f} kg"
    
    text = re.sub(r'(\d+\.?\d*)\s*lbs?(?!\s*-|\s+to)', replace_single, text)
    text = re.sub(r'(\d+\.?\d*)\s*pounds?', replace_single, text)
    
    return text


def _convert_distance(text: str) -> str:
    """Convert yards and inches to metric"""
    # Yards to meters
    def replace_yards(match):
        yards = float(match.group(1))
        meters = yards * CONVERSION_FACTORS['yards_to_meters']
        return f"{meters:.0f} meters"
    
    text = re.sub(r'(\d+\.?\d*)\s*yards?', replace_yards, text)
    
    # Inches to cm
    def replace_inches(match):
        inches = float(match.group(1))
        cm = inches * CONVERSION_FACTORS['inches_to_cm']
        return f"{cm:.0f} cm"
    
    text = re.sub(r'(\d+\.?\d*)\s*-?\s*inch', replace_inches, text)
    
    return text