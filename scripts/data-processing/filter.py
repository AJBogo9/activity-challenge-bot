import pandas as pd

from config import MIN_MET_VALUE, EXCLUDED_CATEGORIES, WALKING_EXERCISE_KEYWORDS


def filter_activities(df: pd.DataFrame) -> pd.DataFrame:
    """
    Filter out low-intensity and non-exercise activities.
    
    Criteria:
    - MET value >= 2.0
    - Not in excluded categories
    - Walking activities must be exercise-related or MET >= 2.5
    
    Args:
        df: DataFrame with activities
    
    Returns:
        Filtered DataFrame
    """
    original_count = len(df)
    
    # Filter by MET value
    df = df[df['met_value'] >= MIN_MET_VALUE].copy()
    
    # Filter by category
    df = df[~df['major_heading'].isin(EXCLUDED_CATEGORIES)]
    
    # Special handling for walking
    df = _filter_walking_activities(df)
    
    filtered_count = len(df)
    print(f"✅ Filtered: {original_count} → {filtered_count} activities")
    
    return df


def _filter_walking_activities(df: pd.DataFrame) -> pd.DataFrame:
    """
    Keep only exercise-related walking activities.
    
    Filters out casual/utilitarian walking like:
    - Walking to work
    - Strolling
    - Window shopping
    
    Keeps exercise walking like:
    - Brisk walking
    - Hiking
    - Walking with weights
    
    Args:
        df: DataFrame with activities
    
    Returns:
        Filtered DataFrame
    """
    is_walking = df['major_heading'] == 'Walking'
    is_low_intensity = df['met_value'] < 2.5
    
    # Check if description contains exercise keywords
    has_exercise_keywords = df['description'].str.lower().str.contains(
        '|'.join(WALKING_EXERCISE_KEYWORDS), 
        na=False
    )
    
    # Keep if: not walking, OR high intensity, OR has exercise keywords
    keep_mask = ~is_walking | ~is_low_intensity | has_exercise_keywords
    
    return df[keep_mask]