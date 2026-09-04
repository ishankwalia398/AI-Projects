from __future__ import annotations


def adf_to_text(value: object) -> str:
    """Safely flatten Atlassian Document Format without interpreting its content."""
    if value is None: return ""
    if isinstance(value, str): return value
    if isinstance(value, list): return "".join(adf_to_text(item) for item in value)
    if not isinstance(value, dict): return str(value)
    node_type = value.get("type", "")
    text = str(value.get("text", ""))
    content = "".join(adf_to_text(item) for item in value.get("content", []))
    if node_type == "hardBreak": return "\n"
    if node_type in {"paragraph", "heading", "blockquote", "listItem"}: return f"{text}{content}\n"
    if node_type in {"bulletList", "orderedList", "doc"}: return f"{text}{content}"
    return f"{text}{content}"
