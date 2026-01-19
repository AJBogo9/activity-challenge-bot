import re
from pathlib import Path
from typing import Iterator

import pandas as pd
import pdfplumber


def extract_activities_from_pdf(pdf_path: Path) -> pd.DataFrame:
    """
    Extract activities from the Physical Activity Compendium PDF.
    
    Args:
        pdf_path: Path to the PDF file
    
    Returns:
        DataFrame with columns: major_heading, activity_code, met_value, description
    """
    activities = list(_parse_pdf_pages(pdf_path))
    
    if not activities:
        raise ValueError(f"No activities extracted from {pdf_path}")
    
    df = pd.DataFrame(activities)
    df['met_value'] = pd.to_numeric(df['met_value'], errors='coerce')
    df = df.dropna(subset=['met_value'])
    
    print(f"✅ Extracted {len(df)} activities from PDF")
    return df


def _parse_pdf_pages(pdf_path: Path) -> Iterator[dict]:
    """Parse all pages and yield activity records"""
    with pdfplumber.open(pdf_path) as pdf:
        for page_num, page in enumerate(pdf.pages, 1):
            text = page.extract_text()
            if not text:
                continue
            
            for line in text.split('\n'):
                activity = _parse_activity_line(line)
                if activity:
                    yield activity


def _parse_activity_line(line: str) -> dict | None:
    """
    Parse a single line into activity components.
    
    Expected format: "Category 01234 5.6 Description text"
    Where Category can have spaces (e.g., "Conditioning Exercise")
    """
    if not line.strip() or 'Major Heading' in line or 'Activity Code' in line:
        return None
    
    # Pattern: Match everything before 5-digit code, then code, then MET, then description
    # Using a lookbehind to ensure we capture multi-word categories correctly
    pattern = r'^(.+?)\s+(\d{5})\s+(\d+\.?\d*)\s+(.+)$'
    match = re.match(pattern, line.strip())
    
    if not match:
        return None
    
    major_heading = match.group(1).strip()
    activity_code = match.group(2).strip()
    met_value = match.group(3).strip()
    description = match.group(4).strip()
    
    # Additional validation: activity code should be numeric
    if not activity_code.isdigit() or len(activity_code) != 5:
        return None
    
    return {
        'major_heading': major_heading,
        'activity_code': activity_code,
        'met_value': met_value,
        'description': description
    }