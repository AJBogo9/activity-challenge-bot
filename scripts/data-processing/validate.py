from models import ValidationResult


def validate_hierarchy(data: dict) -> ValidationResult:
    """
    Validate that all paths in the hierarchy have exactly 4 levels.
    
    Args:
        data: The nested hierarchy dictionary
    
    Returns:
        ValidationResult with validation status and details
    """
    depths = _collect_path_depths(data)
    
    depth_dist = {}
    for depth, path in depths:
        depth_dist[depth] = depth_dist.get(depth, 0) + 1
    
    errors = []
    for depth, path in depths:
        if depth != 4:
            errors.append(f"Path with depth {depth}: {path}")
    
    is_valid = len(errors) == 0
    
    return ValidationResult(
        is_valid=is_valid,
        total_paths=len(depths),
        depth_distribution=depth_dist,
        errors=errors
    )


def _collect_path_depths(
    data: dict, 
    current_depth: int = 0, 
    path: str = ""
) -> list[tuple[int, str]]:
    """
    Recursively collect all path depths.
    
    Args:
        data: Current level of hierarchy
        current_depth: Current depth in the tree
        path: Current path string
    
    Returns:
        List of (depth, path) tuples
    """
    if isinstance(data, list):
        # Reached a leaf node (list of activities)
        return [(current_depth, path)]
    
    results = []
    for key, value in data.items():
        new_path = f"{path}/{key}" if path else key
        results.extend(_collect_path_depths(value, current_depth + 1, new_path))
    
    return results  # ✅ FIXED: was 'result'