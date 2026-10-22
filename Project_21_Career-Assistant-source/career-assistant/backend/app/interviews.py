import json

from .ai import generate
from .db import digest, get_record, now, put

TECH_CATEGORIES = ['Core Technical Fundamentals','Programming and Coding','Frameworks and Tools','Technical Scenarios','System Design and Architecture','Resume-Based Technical Deep Dives','Advanced Debugging','Database and SQL','API and Backend Engineering','Technical Leadership','Domain-Specific Questions','AI and Emerging Technologies']
HR_CATEGORIES = ['Tell Me About Yourself','Why Do You Want to Work With Us?','Notice Period','Salary Expectations','Do You Have Any Questions for Me?','Career Background and Motivation','Strengths and Weaknesses','Behavioral and Competency-Based','Leadership and Management','Work Culture and Collaboration','Company and Role-Specific','Difficult and Tricky HR','International and Relocation','Career Goals','Final HR and Offers']

COMMON_FIELDS = ['id','question','category','topic','difficulty','priority','interview_round','jd_relevance','resume_relevance','source_classification','qualitative_likelihood','why_it_matters','short_answer','detailed_answer','real_world_example','follow_ups','common_mistakes','senior_level_differentiator']
HR_FIELDS = ['alternative_phrasing','interviewer_objective','personalized_answer','star_example','why_answer_works','personalization_notes']


def required_count(category,kind):
    if kind=='hr':
        return {'Behavioral and Competency-Based':15,'Leadership and Management':15,'Difficult and Tricky HR':10,'Company and Role-Specific':10,'International and Relocation':10}.get(category,3)
    return 3


def validate_questions(data,category,kind):
    questions=data.get('questions',[])
    if not isinstance(questions,list) or len(questions)<required_count(category,kind):
        raise ValueError('The category has insufficient answered questions.')
    ids, titles=set(),set()
    for q in questions:
        for field in COMMON_FIELDS+(HR_FIELDS if kind=='hr' else []):
            if field not in q or q[field] is None or q[field]=='':
                raise ValueError('Incomplete interview field: '+field)
        if q['category']!=category or q['id'] in ids or q['question'].casefold() in titles:
            raise ValueError('Duplicate question or incorrect category.')
        ids.add(q['id']); titles.add(q['question'].casefold())
        if q['source_classification'] not in ['General Preparation','Predicted','Publicly Reported']:
            raise ValueError('Unsupported source classification.')
        if q['source_classification']=='Publicly Reported' and not q.get('citations'):
            raise ValueError('Company interview claims require citations.')
        if not isinstance(q['follow_ups'],list) or not q['follow_ups'] or any(not x.get('question') or not x.get('answer') for x in q['follow_ups']):
            raise ValueError('Follow-ups need answers.')
        if category=='Programming and Coding':
            for field in ['problem_statement','input_output','constraints','examples','solution','explanation','time_complexity','space_complexity','edge_cases','test_cases','alternative_solution','optimizations']:
                if not q.get('coding',{}).get(field):
                    raise ValueError('Incomplete coding solution: '+field)
        if category=='Database and SQL' and not q.get('sql',{}).get('solution'):
            raise ValueError('SQL questions require solutions and sample data.')
        if kind=='hr' and not isinstance(q.get('variants'),dict):
            raise ValueError('HR questions require answer variants.')


def interview_generate(db,user_id,kind,profile,jd,version,company=''):
    categories = TECH_CATEGORIES if kind=='technical' else HR_CATEGORIES
    context={'candidate':profile,'jd':jd,'company':company,'classification':'User-provided'}
    cachekey=digest(json.dumps([kind,context,version,'interview-v1'],sort_keys=True))
    existing=get_record(db,user_id,'interview',cachekey)
    if existing:
        return {'content_id':existing.id,'cached':True}
    questions=[]
    usage=[]
    for i,category in enumerate(categories):
        key=cachekey+':'+str(i)
        saved=get_record(db,user_id,'interview_batch',key)
        if saved:
            questions.extend(saved.data['questions']); continue
        schema={field:'string' for field in COMMON_FIELDS+(HR_FIELDS if kind=='hr' else [])}
        schema.update({'follow_ups':[{'question':'string','answer':'string'}],'common_mistakes':['string'],'priority':1,'category':category,'id':f'{"TECH" if kind=="technical" else "HR"}-{i+1:02d}-01','source_classification':'General Preparation'})
        prompt={'task':f'Generate {required_count(category,kind)} distinct, deep {kind} interview questions and complete answers in category {category}. Vary difficulty. Prioritize mandatory JD relevance, actual resume history and seniority. Every short and detailed answer must answer the question directly. Separate hypothetical examples from true experience. Do not claim code execution.','schema':{'questions':[schema]},'context':context}
        if kind=='technical':
            prompt['coding_requirements']='For Programming and Coding, every question must add coding object with problem_statement, input_output, constraints, examples, solution (complete runnable code), explanation, time_complexity, space_complexity, edge_cases, test_cases, alternative_solution, optimizations. Choose the JD language. For Database and SQL add sql object with schema, sample_data, solution and expected_output. For Architecture include components, flows, scalability, risks and trade-offs. Scenarios need investigation, root cause, solution and validation.'
        else:
            prompt['hr_requirements']='Answer in first person based only on verified facts. Unknown notice and salary must remain unknown. STAR stories lacking evidence must be labelled Hypothetical. Recommend asking only 1–3 interviewer questions. Every question must add variants object: Q1 timings 30s/60s/90s/2min/leadership/international; Q2 30–45s/60–90s/90–120s/leadership; Q3 30/60/90 days, negotiable/non-negotiable/serving/immediate/relocation templates (label templates); Q4 diplomatic negotiation variants without invented numbers; Q5 questions by interviewer and closing statement.'
        result=generate(json.dumps(prompt),lambda d:validate_questions(d,category,kind))
        put(db,user_id,'interview_batch',key,result['content'])
        db.commit()
        questions.extend(result['content']['questions']); usage.append(result['usage'])
    seen=set()
    for q in questions:
        normalized=q['question'].strip().casefold()
        if normalized in seen:
            raise ValueError('Duplicate question across categories; revise the saved batch.')
        seen.add(normalized)
    for i,q in enumerate(questions):
        q['id']=f'{"TECH" if kind=="technical" else "HR"}-{i+1:03d}'
    extras_prompt={'task':'Build personalized interview preparation material using supplied question IDs. Return top_topics (20), skills_matrix with evidence, skill_gaps, candidate_summary, jd_analysis, company_research (General Preparation; no research was provided), readiness_checklist, final_revision_ids (10). Add plans object with day-by-day arrays keyed "7", "14", "30". Add mock_interviews with question_ids, model_answers and scoring_rubric. Technical mocks: 10 screening questions, 3–5 coding, 8–10 framework/architecture, 5–8 troubleshooting, 8–10 leadership. Reuse questions across mock rounds where appropriate. HR: five selling points, five challenges, STAR story bank (label hypothetical if unsupported), round-specific mock scripts and readiness checklist. Never invent candidate personal facts.','context':context,'question_bank':questions}
    def validate_extras(d):
        for days in (7,14,30):
            if len(d.get('plans',{}).get(str(days),[]))!=days:
                raise ValueError('Incomplete preparation plan.')
        if not d.get('mock_interviews') or not d.get('skills_matrix') or len(d.get('top_topics',[]))<20:
            raise ValueError('Preparation material is incomplete.')
    extras=generate(json.dumps(extras_prompt),validate_extras)
    data={'kind':kind,'questions':questions,**extras['content'],'top_question_ids':[q['id'] for q in sorted(questions,key=lambda q:int(q.get('priority',5)))[:30 if kind=='technical' else 25]],'jd':jd,'company':company,'resume_version_id':version,'jd_hash':digest(jd),'prompt_version':'interview-v1','model_id':extras['model'],'usage':usage+[extras['usage']],'validation_status':'needs_review','created_at':now().isoformat()}
    row=put(db,user_id,'interview',cachekey,data)
    db.commit()
    return {'content_id':row.id,'cached':False,'questions':len(questions)}


def guide_sections(data):
    sections=[{'heading':'Candidate summary','text':str(data.get('candidate_summary',''))}, {'heading':'JD analysis','text':json.dumps(data.get('jd_analysis',{}),ensure_ascii=False,indent=2)}]
    sections.append({'heading':'Skills matrix and gaps','text':json.dumps({'matrix':data.get('skills_matrix'), 'gaps':data.get('skill_gaps')},ensure_ascii=False,indent=2)})
    for q in data['questions']:
        sections.append({'heading':q['id']+' — '+q['question'],'text':'\n\n'.join(f'{k.replace("_"," ").title()}: '+(v if isinstance(v,str) else json.dumps(v,ensure_ascii=False,indent=2)) for k,v in q.items() if k not in ('id','question'))})
    for k in ['company_research','mock_interviews','plans','readiness_checklist','star_story_bank']:
        if data.get(k):
            sections.append({'heading':k.replace('_',' ').title(),'text':json.dumps(data[k],ensure_ascii=False,indent=2)})
    return {'title':'Career Assistant · '+data['kind'].title()+' Interview Guide','sections':sections}
