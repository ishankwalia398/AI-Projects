"""Use saved, module-specific candidate recommendations as discovery constraints."""
import re

import json
from .db import get_record, digest


def profile_signature(profile):
    return digest(json.dumps({key:profile.get(key) for key in ('resume_version_id','designation','current_designation','skills','employments')},sort_keys=True))


def country_name(value):
    value = str(value or '').strip()
    aliases = {'in':'India', 'us':'United States', 'usa':'United States', 'uk':'United Kingdom',
               'gb':'United Kingdom', 'uae':'United Arab Emirates', 'de':'Germany', 'nl':'Netherlands',
               'ca':'Canada', 'au':'Australia', 'nz':'New Zealand', 'ie':'Ireland'}
    return aliases.get(value.casefold(), value)


def region_key(value):
    value = re.sub(r'\(.*?\)', '', str(value).casefold())
    value = re.sub(r'[^a-z]', '', value)
    if value.startswith(('europeanunion', 'europe')) or value == 'eu':
        return 'eu'
    if value.startswith('apac') or value.startswith('asiapacific') or value.startswith('asia'):
        return 'asiapacific'
    if value in {'unitedstates', 'usa', 'us', 'canada', 'northamerica', 'unitedstatesandcanada', 'usandcanada'}:
        return 'northamerica'
    if value in {'australia', 'newzealand', 'australianewzealand', 'australiaandnewzealand', 'oceania', 'anz'}:
        return 'australiaandnewzealand'
    if value in {'uk', 'unitedkingdom', 'wideremea', 'emea', 'otheremea', 'unitedkingdomandotheremea', 'nonemea'}:
        return 'unitedkingdom'
    if value in {'middleeast', 'gcc', 'middleeastgcc'}:
        return 'middleeast'
    return value


def strings(values):
    return list(dict.fromkeys(v.strip() for v in values if isinstance(v, str) and v.strip())) if isinstance(values, list) else []


def resolve_scope(db, user_id, module, profile):
    titles = get_record(db, user_id, 'research', module)
    countries = get_record(db, user_id, 'research', 'visa-countries') if module == 'visa' else None
    for row in (titles,countries):
        if row and row.data.get('profile_signature') and row.data['profile_signature']!=profile_signature(profile):
            raise ValueError('Your candidate profile has changed. Regenerate title and country suggestions before finding jobs.')
    preferences = get_record(db, user_id, 'preferences', 'active')
    prefs = preferences.data if preferences else {}
    groups = titles.data.get('regions', []) if titles else []
    country_groups = countries.data.get('regions', []) if countries else []
    resolved = []
    for group in groups:
        roles = strings(group.get('titles', []))
        if not roles:
            continue
        locations = ['India'] if module == 'domestic' else list(group.get('countries', []))
        if country_groups:
            suggested = [c for cg in country_groups if region_key(cg.get('region')) == region_key(group.get('region'))
                         for c in strings(cg.get('countries', []))]
            locations = suggested or locations
        locations = list(dict.fromkeys(country_name(c) for c in strings(locations)))
        if module == 'visa':
            locations = [c for c in locations if c.casefold() != 'india']
        if locations:
            resolved.append({'region': group.get('region', module), 'titles': roles, 'countries': locations})
    if not groups:
        roles = strings(prefs.get(module + '_target_titles', prefs.get('target_titles', [])))
        if not roles:
            roles = strings([profile.get('designation') or profile.get('current_designation', '')])
        locations = ['India'] if module == 'domestic' else [country_name(c) for c in strings(prefs.get('countries', []))]
        if country_groups:
            resolved = [{'region':g['region'], 'titles':roles, 'countries':[country_name(c) for c in strings(g.get('countries', [])) if country_name(c).casefold()!='india']}
                        for g in country_groups if roles]
        elif roles and locations:
            resolved = [{'region':module, 'titles':roles, 'countries':locations}]
    resolved = [g for g in resolved if g['countries'] and g['titles']]
    if not resolved:
        raise ValueError('Generate title suggestions' + (' and country suggestions' if module == 'visa' else '') + ' for this module before finding jobs.')
    return {'module':module, 'regions':resolved,
            'titles':list(dict.fromkeys(t for g in resolved for t in g['titles'])),
            'countries':list(dict.fromkeys(c for g in resolved for c in g['countries'])),
            'source':'candidate suggestions' if groups else 'preferences or candidate designation'}


def matches_scope(job, scope):
    from .jobs import title_matches
    country = country_name(job.get('country')).casefold()
    return any(country in {country_name(c).casefold() for c in group['countries']} and
               title_matches(job.get('title', ''), group['titles']) for group in scope['regions'])
