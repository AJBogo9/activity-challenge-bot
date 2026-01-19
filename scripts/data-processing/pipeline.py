import argparse
import json
from datetime import datetime
from pathlib import Path

import pandas as pd

from categorize import assign_hierarchy
from config import INPUT_PDF, OUTPUT_JSON
from consolidate import consolidate_activities
from export import export_to_json
from extract import extract_activities_from_pdf
from filter import filter_activities
from models import ValidationResult
from transform import convert_imperial_to_metric
from validate import validate_hierarchy


def run_pipeline(
    input_pdf: Path = INPUT_PDF,
    output_json: Path = OUTPUT_JSON,
    validate_only: bool = False
) -> dict:
    """
    Run the complete data processing pipeline.
    
    Args:
        input_pdf: Path to input PDF file
        output_json: Path to output JSON file
        validate_only: If True, only validate existing output
    
    Returns:
        The generated hierarchy dictionary
    """
    print("=" * 80)
    print("ACTIVITY DATA PROCESSING PIPELINE")
    print("=" * 80)
    print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Validation only mode
    if validate_only:
        if not output_json.exists():
            raise FileNotFoundError(f"Output file not found: {output_json}")
        
        print("📋 Loading existing output for validation...")
        with open(output_json) as f:
            hierarchy = json.load(f)
        
        result = validate_hierarchy(hierarchy)
        _print_validation_result(result)
        return hierarchy
    
    # Full pipeline
    print(f"📖 Input: {input_pdf}")
    print(f"💾 Output: {output_json}")
    print()
    
    # Step 1: Extract
    print("Step 1: Extracting from PDF...")
    df = extract_activities_from_pdf(input_pdf)
    
    # Step 2: Filter
    print("\nStep 2: Filtering activities...")
    df = filter_activities(df)
    
    # Step 3: Transform
    print("\nStep 3: Converting units...")
    df = convert_imperial_to_metric(df)
    
    # Step 4: Categorize
    print("\nStep 4: Assigning hierarchy...")
    df = assign_hierarchy(df)
    
    # Step 5: Consolidate
    print("\nStep 5: Consolidating activities...")
    df = consolidate_activities(df)
    
    # Step 6: Export
    print("\nStep 6: Exporting to JSON...")
    hierarchy = export_to_json(df, output_json)
    
    # Step 7: Validate
    print("\nStep 7: Validating structure...")
    result = validate_hierarchy(hierarchy)
    _print_validation_result(result)
    
    # Summary
    _print_summary(df, result)
    
    print("=" * 80)
    print("✅ Pipeline completed successfully!")
    print("=" * 80)
    
    return hierarchy


def _print_validation_result(result: ValidationResult):
    """Print validation results"""
    if result.is_valid:
        print(f"✅ Structure valid: All {result.total_paths} paths have 4 levels")
    else:
        print(f"❌ Structure invalid: Found {len(result.errors)} inconsistent paths")
        for error in result.errors[:10]:  # Show first 10
            print(f"   {error}")
        if len(result.errors) > 10:
            print(f"   ... and {len(result.errors) - 10} more")


def _print_summary(df: pd.DataFrame, validation: ValidationResult):
    """Print pipeline summary"""
    print("\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print(f"Total activities: {len(df)}")
    print(f"Level 1 (Main): {df['level1_main'].nunique()}")
    print(f"Level 2 (Sub): {df['level2_subcategory'].nunique()}")
    print(f"Level 3 (Activity): {df['level3_activity'].nunique()}")
    print(f"Level 4 (Intensity): {df['level4_intensity'].nunique()}")
    print(f"MET range: {df['met_value'].min():.1f} - {df['met_value'].max():.1f}")
    print()
    
    print("Activities by category:")
    for cat in sorted(df['level1_main'].unique()):
        count = len(df[df['level1_main'] == cat])
        print(f"  {cat}: {count}")


def main():
    """CLI entry point"""
    parser = argparse.ArgumentParser(
        description="Process Physical Activity Compendium data"
    )
    parser.add_argument(
        '--input', 
        type=Path,
        default=INPUT_PDF,
        help='Input PDF file'
    )
    parser.add_argument(
        '--output',
        type=Path,
        default=OUTPUT_JSON,
        help='Output JSON file'
    )
    parser.add_argument(
        '--validate-only',
        action='store_true',
        help='Only validate existing output'
    )
    
    args = parser.parse_args()
    
    try:
        run_pipeline(
            input_pdf=args.input,
            output_json=args.output,
            validate_only=args.validate_only
        )
    except Exception as e:
        print(f"\n❌ Pipeline failed: {e}")
        raise


if __name__ == '__main__':
    main()