from pathlib import Path
from typing import Final

# Paths
PROJECT_ROOT: Final = Path(__file__).parent.parent.parent
DATA_DIR: Final = PROJECT_ROOT / "data"
RAW_DATA_DIR: Final = DATA_DIR / "raw"
PROCESSED_DATA_DIR: Final = DATA_DIR / "processed"

INPUT_PDF: Final = RAW_DATA_DIR / "compendium-2024.pdf"
OUTPUT_JSON: Final = PROCESSED_DATA_DIR / "activity-hierarchy.json"

# Filtering thresholds
MIN_MET_VALUE: Final[float] = 2.0

# Categories to exclude (non-exercise activities)
EXCLUDED_CATEGORIES: Final[frozenset[str]] = frozenset([
    'Inactivity', 'Self Care', 'Sexual Activity', 'Miscellaneous',
    'Music Playing', 'Occupation', 'Home Activities', 'Home Repair',
    'Religious Activities', 'Volunteer Activities', 'Transportation',
    'Lawn & Garden', 'Fishing & Hunting', 'Video Games'
])

# Walking filtering - keywords that indicate exercise walking
WALKING_EXERCISE_KEYWORDS: Final[frozenset[str]] = frozenset([
    'exercise', 'brisk', 'hiking', 'backpack', 'climbing', 
    'stairs', 'uphill', 'nordic'
])

# Intensity thresholds (MET values)
INTENSITY_THRESHOLDS: Final[dict[str, tuple[float, float]]] = {
    'Light': (0.0, 4.0),
    'Moderate': (4.0, 7.0),
    'Vigorous': (7.0, 11.0),
    'Very Vigorous': (11.0, float('inf'))
}

# Intensity ordering for sorting
INTENSITY_ORDER: Final[list[str]] = ['Light', 'Moderate', 'Vigorous', 'Very Vigorous']

# Unit conversion factors
CONVERSION_FACTORS: Final[dict[str, float]] = {
    'mph_to_kmh': 1.60934,
    'lb_to_kg': 0.453592,
    'yards_to_meters': 0.9144,
    'inches_to_cm': 2.54
}