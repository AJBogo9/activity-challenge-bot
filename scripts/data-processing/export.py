import json
from pathlib import Path

import pandas as pd


def export_to_json(df: pd.DataFrame, output_path: Path) -> dict:
    """
    Export consolidated activities to nested JSON structure.
    
    Structure: Main Category → Subcategory → Activity → Intensity → [Activities]
    
    Example output:
    {
        "Endurance Sports": {
            "Bicycling": {
                "Stationary Bike": {
                    "Moderate": [
                        {
                            "met_value": 6.8,
                            "examples": "50-100 watts / moderate effort"
                        }
                    ]
                }
            }
        }
    }
    
    Args:
        df: Consolidated DataFrame with hierarchy columns
        output_path: Where to save the JSON file
    
    Returns:
        The hierarchy dictionary
    """
    hierarchy = {}
    
    for _, row in df.iterrows():
        l1 = row['level1_main']
        l2 = row['level2_subcategory']
        l3 = row['level3_activity']
        l4 = row['level4_intensity']
        
        # Build nested structure
        if l1 not in hierarchy:
            hierarchy[l1] = {}
        if l2 not in hierarchy[l1]:
            hierarchy[l1][l2] = {}
        if l3 not in hierarchy[l1][l2]:
            hierarchy[l1][l2][l3] = {}
        if l4 not in hierarchy[l1][l2][l3]:
            hierarchy[l1][l2][l3][l4] = []
        
        # Add activity data
        hierarchy[l1][l2][l3][l4].append({
            'met_value': float(row['met_value']),
            'examples': row['examples']
        })
    
    # Ensure output directory exists
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Write JSON
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(hierarchy, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Exported to {output_path}")
    return hierarchy