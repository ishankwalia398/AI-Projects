import re


def redact(value: str, secrets=()) -> str:
    result = value
    for secret in secrets:
        if secret: result = result.replace(secret, "[REDACTED]")
    result = re.sub(r"(?i)(token|password|secret|authorization|api[_-]?key)(\s*[:=]\s*)([^\s,;]+)", r"\1\2[REDACTED]", result)
    return result
