import pandas as pd


def consolidate_activities(df: pd.DataFrame) -> pd.DataFrame:
    """
    Consolidate similar activities by taking median MET values
    and combining example descriptions.
    
    Groups by all 4 hierarchy levels and aggregates:
    - MET value: median
    - Examples: up to 3 sample descriptions
    
    Args:
        df: DataFrame with hierarchy columns and met_value, description
    
    Returns:
        Consolidated DataFrame with renamed columns
    """
    # ✅ FIXED: Group by the correct column names from categorize.py
    consolidated = df.groupby(
        ['level1_main', 'level2_subcategory', 'level3_activity', 'level4_intensity'],
        as_index=False
    ).agg({
        'met_value': 'median',
        'description': lambda x: ' / '.join(x.head(3))  # Take up to 3 examples
    })
    
    # Rename description column to examples for clarity
    consolidated = consolidated.rename(columns={'description': 'examples'})
    
    # Round MET values to 1 decimal place
    consolidated['met_value'] = consolidated['met_value'].round(1)
    
    # Sort by hierarchy and MET value (descending within each activity)
    consolidated = consolidated.sort_values(
        ['level1_main', 'level2_subcategory', 'level3_activity', 'met_value'],
        ascending=[True, True, True, False]
    )
    
    print(f"✅ Consolidated to {len(consolidated)} unique activities")
    return consolidated