"""Resolve cited ATS detail URLs through official public listing endpoints."""
import json
import re
from urllib.parse import urlparse


def fetch_listing(url):
    from .jobs import _request_public_https, clean_html, country_from_location
    parsed=urlparse(url)
    path=parsed.path.strip('/')
    greenhouse=re.fullmatch(r'([\w-]+)/jobs/(\d+)',path) if parsed.hostname in {'boards.greenhouse.io','job-boards.greenhouse.io'} else None
    lever=re.fullmatch(r'([\w-]+)/([\w-]+)',path) if parsed.hostname=='jobs.lever.co' else None
    if greenhouse:
        board,job_id=greenhouse.groups()
        api=f'https://boards-api.greenhouse.io/v1/boards/{board}/jobs/{job_id}'
    elif lever:
        board,job_id=lever.groups()
        api=f'https://api.lever.co/v0/postings/{board}/{job_id}'
    else:
        return None
    status,_,body=_request_public_https(api)
    if status!=200 or len(body)>2_000_000:
        return None
    data=json.loads(body)
    if greenhouse:
        title=data['title']; location=data.get('location',{}).get('name','')
        description=clean_html(data.get('content',''))
    else:
        title=data['text']; location=data.get('categories',{}).get('location','')
        description=data.get('descriptionPlain','')+'\n'+'\n'.join(clean_html(x.get('content','')) for x in data.get('lists',[]))
    if not title or not description.strip():
        return None
    return {'source':('greenhouse:' if greenhouse else 'lever:')+board,'requisition_id':str(job_id),
            'company':board,'title':title,'description':description,'location':location,
            'country':country_from_location(location),'url':url,'source_url':api}
