import io
from datetime import timedelta

import pytest
from docx import Document
from pypdf import PdfReader

from app.db import Record, User, now, put
from app.storage import store
from test_oct25_features import question


def exported_text(blob, format):
    if format=='docx':
        return '\n'.join(paragraph.text for paragraph in Document(io.BytesIO(blob)).paragraphs)
    return '\n'.join(page.extract_text() for page in PdfReader(io.BytesIO(blob)).pages)


@pytest.mark.parametrize('format',['pdf','docx'])
def test_interview_download_refreshes_legacy_cache_and_tracks_answer_changes(account,format):
    client,factory=account
    with factory() as db:
        user=db.query(User).one()
        guide=put(db,user.id,'interview','export-fixture',{'kind':'technical','questions':[question(jd_relevance='Hidden JD fit',resume_relevance='Hidden resume fit',qualitative_likelihood='Hidden likelihood',priority=1)],
                  'jd_analysis':{},'skills_matrix':None,'skill_gaps':None})
        old=store(db,user.id,'interview-guide.'+format,b'OLD CACHE: JD analysis {} Skills matrix and gaps null',
                  'temporary',guide.id,now()+timedelta(hours=24))
        db.commit()
        guide_id,old_file_id=guide.id,old.id
    response=client.post('/api/content/'+guide_id+'/render?format='+format)
    assert response.status_code==200
    first=response.json()
    assert not first['cached'] and first['file_id']!=old_file_id
    text=exported_text(client.get(first['url']).content,format)
    assert 'JD analysis' not in text and 'Skills matrix and gaps' not in text
    assert 'null' not in text and '{}' not in text
    assert 'Q1. How do you prioritize API tests?' in text and 'preparation plan' not in text.lower()
    assert all(label not in text for label in ('Jd Relevance', 'Resume Relevance', 'Qualitative Likelihood', 'Priority:', 'Hidden JD fit'))
    assert client.get('/api/files/'+old_file_id).status_code==410
    assert client.post('/api/content/'+guide_id+'/render?format='+format).json()['file_id']==first['file_id']
    with factory() as db:
        guide=db.get(Record,guide_id)
        changed=[{**guide.data['questions'][0],'short_answer':'Updated saved interview answer.'}]
        guide.data={**guide.data,'questions':changed}
        db.commit()
    updated=client.post('/api/content/'+guide_id+'/render?format='+format).json()
    assert updated['file_id']!=first['file_id'] and not updated['cached']
    assert 'Updated saved interview answer.' in exported_text(client.get(updated['url']).content,format)
    assert client.get(first['url']).status_code==410
