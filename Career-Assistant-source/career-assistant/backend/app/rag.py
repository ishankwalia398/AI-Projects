import json
import uuid

import httpx
from qdrant_client import QdrantClient, models

from .config import settings
from .db import digest, get_record, put, records
from .resumes import chunk


def embedding(texts):
    if not settings.llm_key:
        raise ValueError('Embedding API key is not configured.')
    response = httpx.post(settings.llm_url.rstrip('/')+'/embeddings', headers={'Authorization':'Bearer '+settings.llm_key}, json={'model':settings.embedding_model,'input':texts}, timeout=60)
    response.raise_for_status()
    return [r['embedding'] for r in sorted(response.json()['data'], key=lambda x:x['index'])]


def client():
    return QdrantClient(url=settings.qdrant_url, api_key=settings.qdrant_key or None, timeout=30)


def tenant_filter(user_id, namespace, version):
    return models.Filter(must=[models.FieldCondition(key=k, match=models.MatchValue(value=v)) for k,v in {'user_id':user_id,'namespace':namespace,'version':version}.items()])


def index(db, user_id, namespace, version, text):
    chunks = chunk(text)
    hashes = [digest(t) for t in chunks]
    # Text references persist even with missing services; never label these as embeddings.
    for h,t in zip(hashes,chunks):
        previous=get_record(db,user_id,'knowledge',namespace+':'+h)
        versions=set(previous.data.get('versions',[previous.data.get('version')]) if previous else [])
        versions.add(version)
        put(db,user_id,'knowledge',namespace+':'+h,{'text':t,'namespace':namespace,'version':version,'versions':sorted(v for v in versions if v),'hash':h})
    if not settings.qdrant_url or not settings.llm_key:
        db.commit()
        return {'status':'text_only', 'chunks':len(chunks), 'reason':'Configure QDRANT_URL and LLM_API_KEY for semantic retrieval.'}
    vectors = []
    for h,t in zip(hashes,chunks):
        cached = get_record(db,user_id,'embedding',settings.embedding_model+':'+h)
        vector = cached.data['vector'] if cached else embedding([t])[0]
        if not cached:
            put(db,user_id,'embedding',settings.embedding_model+':'+h,{'vector':vector})
        vectors.append(vector)
    c = client()
    collection = 'career_'+digest(settings.embedding_model)[:16]
    if not c.collection_exists(collection):
        c.create_collection(collection, vectors_config=models.VectorParams(size=len(vectors[0]), distance=models.Distance.COSINE))
        for field in ['user_id','namespace','version']:
            c.create_payload_index(collection, field, models.PayloadSchemaType.KEYWORD)
    c.upsert(collection, [models.PointStruct(id=str(uuid.uuid5(uuid.NAMESPACE_URL,user_id+namespace+h)),vector=v,payload={'user_id':user_id,'namespace':namespace,'version':get_record(db,user_id,'knowledge',namespace+':'+h).data['versions'],'hash':h,'text':t}) for h,t,v in zip(hashes,chunks,vectors)], wait=True)
    db.commit()
    return {'status':'indexed','chunks':len(chunks),'embedding_model':settings.embedding_model}


def retrieve(db, user_id, namespace, version, query, top_k=5):
    if settings.qdrant_url and settings.llm_key:
        c = client()
        collection = 'career_'+digest(settings.embedding_model)[:16]
        if c.collection_exists(collection):
            hits = c.query_points(collection, query=embedding([query])[0], query_filter=tenant_filter(user_id,namespace,version), limit=top_k).points
            return {'mode':'semantic','sources':[{'text':h.payload['text'],'hash':h.payload['hash'],'score':h.score,'version':version} for h in hits]}
    terms = set(query.lower().split())
    rows = [r for r in records(db,user_id,'knowledge').all() if r.data['namespace']==namespace and version in r.data.get('versions',[r.data.get('version')])]
    rows.sort(key=lambda r:len(terms & set(r.data['text'].lower().split())), reverse=True)
    return {'mode':'lexical_only','sources':[r.data for r in rows[:top_k]]}


def delete_tenant(user_id):
    if settings.qdrant_url:
        c = client()
        for collection in c.get_collections().collections:
            if collection.name.startswith('career_'):
                c.delete(collection.name, models.FilterSelector(filter=models.Filter(must=[models.FieldCondition(key='user_id',match=models.MatchValue(value=user_id))])), wait=True)
