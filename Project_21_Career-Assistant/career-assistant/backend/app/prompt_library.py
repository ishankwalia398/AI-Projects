"""Load user-maintained prompt sections without duplicating their text in code."""
import hashlib
import re
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2] / 'docs'

def section(module, purpose):
    name = 'Prompt_Interview.md' if module == 'interview' else 'Prompt_VISA_Sponsored_Jobs.md' if module == 'visa' else 'Prompt_Domestic_Jobs.md'
    text = (ROOT / name).read_text(encoding='utf-8-sig')
    parts = re.split(r'(?m)^(?=\d+\. )', text)
    parts = [part for part in parts if part.strip()]
    indexes = {'interview':{'technical':0,'hr':1},'domestic':{'titles':0,'search':1,'documents':2},'visa':{'titles':0,'countries':1,'search':2,'documents':3}}
    if purpose in {'resume','cover_letter','motivational_letter'}:
        body=parts[indexes[module]['documents']]
        labels={'resume':'RESUME','cover_letter':'CoverLetter','motivational_letter':'MotivationalLetter'}
        match=re.search(r'PROMPT FOR '+labels[purpose]+r':(.*?)(?=PROMPT FOR |\Z)',body,re.S)
        if not match: raise ValueError('Required document prompt is missing: '+purpose)
        return match.group(1).strip()
    return parts[indexes[module][purpose]].strip()

def version(module, purpose):
    return hashlib.sha256(section(module,purpose).encode()).hexdigest()[:16]
