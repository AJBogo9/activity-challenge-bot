from dataclasses import dataclass, field
from typing import Literal

IntensityLevel = Literal['Light', 'Moderate', 'Vigorous', 'Very Vigorous']

@dataclass
class RawActivity:
    """Raw activity extracted from PDF"""
    major_heading: str
    activity_code: str
    met_value: float
    description: str

@dataclass
class ProcessedActivity:
    """Activity with hierarchy and processed description"""
    level1_main: str
    level2_subcategory: str
    level3_activity: str
    level4_intensity: IntensityLevel
    met_value: float
    description: str

@dataclass
class ConsolidatedActivity:
    """Aggregated activity with multiple examples"""
    level1_main: str
    level2_subcategory: str
    level3_activity: str
    level4_intensity: IntensityLevel
    met_value: float  # Median MET value
    examples: list[str] = field(default_factory=list)

@dataclass
class ValidationResult:
    """Result of hierarchy validation"""
    is_valid: bool
    total_paths: int
    depth_distribution: dict[int, int]
    errors: list[str] = field(default_factory=list)
