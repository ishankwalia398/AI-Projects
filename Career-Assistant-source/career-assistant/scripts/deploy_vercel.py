"""Direct Vercel API upload. Token enters only through hidden stdin and stays in RAM."""
import getpass
import json
import time
from pathlib import Path
import httpx

ROOT=Path(__file__).resolve().parent.parent
FRONTEND=ROOT/'frontend'
token=getpass.getpass('Vercel token (hidden): ')
client=httpx.Client(base_url='https://api.vercel.com',headers={'Authorization':'Bearer '+token},timeout=45)
def request(method,path,**kwargs):
    r=client.request(method,path,**kwargs)
    if r.status_code>=400:
        try: error=r.json().get('error',{})
        except ValueError:error={}
        raise RuntimeError('Vercel request failed: '+str(r.status_code)+' '+str(error.get('code',''))+' '+str(error.get('message',''))[:300])
    return r.json()

account=request('GET','/v2/user')
print('Vercel account authenticated.',flush=True)
name='jobsearchandtracker'
r=client.get('/v9/projects/'+name)
if r.status_code==404:
    project=request('POST','/v10/projects',json={'name':name,'framework':'vite'})
elif r.status_code==200:
    project=r.json()
else:
    raise RuntimeError('Unable to resolve Vercel project: '+str(r.status_code))
print('Project ready: '+project['name'],flush=True)
files=[]
for path in FRONTEND.rglob('*'):
    if not path.is_file():continue
    relative=path.relative_to(FRONTEND)
    if any(x in ('node_modules','dist','.vercel','.git') for x in relative.parts):continue
    if path.name.endswith(('.tsbuildinfo','.log')):continue
    data=path.read_text(encoding='utf-8')
    files.append({'file':relative.as_posix(),'data':data})
deployment=request('POST','/v13/deployments',json={'name':name,'project':project['id'],'target':'production','files':files,'projectSettings':{'framework':'vite','buildCommand':'npm run build','outputDirectory':'dist','installCommand':'npm ci'}})
metadata={'project_id':project['id'],'deployment_id':deployment['id'],'url':'https://'+deployment['url'],'target_url':'https://jobsearchandtracker.vercel.app','status':deployment.get('readyState','QUEUED'),'scope':'Frontend only; backend services not configured.'}
output=ROOT/'deployment-status.json'
output.write_text(json.dumps(metadata,indent=2),encoding='utf-8')
print('Deployment created: '+metadata['url'],flush=True)
last=''
for _ in range(120):
    result=request('GET','/v13/deployments/'+deployment['id'])
    state=result.get('readyState','UNKNOWN')
    if state!=last:print('Deployment status: '+state,flush=True);last=state
    metadata['status']=state
    metadata['aliases']=result.get('alias',[])
    output.write_text(json.dumps(metadata,indent=2),encoding='utf-8')
    if state in ('READY','ERROR','CANCELED'):
        break
    time.sleep(5)
if metadata['status']=='READY':
    for url in [metadata['url'],metadata['target_url']]:
        response=httpx.get(url,timeout=30,follow_redirects=True)
        print('HTTP verification '+url+': '+str(response.status_code),flush=True)
        metadata.setdefault('http_checks',{})[url]=response.status_code
    output.write_text(json.dumps(metadata,indent=2),encoding='utf-8')
client.close()
print('Deployment metadata saved; credentials were not written.',flush=True)
