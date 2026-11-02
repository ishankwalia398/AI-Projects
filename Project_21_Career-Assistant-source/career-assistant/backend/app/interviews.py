import ast
import json
import re

from .ai import candidate_context, generate
from .prompt_library import section as prompt_section, version as prompt_version
from .db import digest, get_record, now, put

INTERVIEW_EXPORT_VERSION = 'interview-export-v4-on-demand-answers'

TECH_CATEGORIES = ['Core Technical Fundamentals','Programming and Coding','Frameworks and Tools','Technical Scenarios','System Design and Architecture','Resume-Based Technical Deep Dives','Advanced Debugging','Database and SQL','API and Backend Engineering','Technical Leadership','Domain-Specific Questions','AI and Emerging Technologies']
HR_CATEGORIES = ['Tell Me About Yourself','Why Do You Want to Work With Us?','Notice Period','Salary Expectations','Do You Have Any Questions for Me?','Career Background and Motivation','Strengths and Weaknesses','Behavioral and Competency-Based','Leadership and Management','Work Culture and Collaboration','Company and Role-Specific','Difficult and Tricky HR','International and Relocation','Career Goals','Final HR and Offers']

COMMON_FIELDS = ['id','question','category','topic','source_classification','why_it_matters','short_answer','detailed_answer','real_world_example','follow_ups','common_mistakes','senior_level_differentiator']
HR_FIELDS = ['alternative_phrasing','interviewer_objective','personalized_answer','star_example','why_answer_works','personalization_notes']
QUESTION_FIELDS = ['id','question','category','topic','source_classification','why_it_matters']

_ANSWER_FIELDS = {
    'answer', 'short_answer', 'detailed_answer', 'real_world_example', 'common_mistakes',
    'senior_level_differentiator', 'personalized_answer', 'star_example',
    'why_answer_works', 'personalization_notes', 'alternative_phrasing',
    'interviewer_objective', 'answer_model', 'answer_usage',
}


def required_count(category,kind):
    if kind=='hr':
        return {'Behavioral and Competency-Based':15,'Leadership and Management':15,'Difficult and Tricky HR':10,'Company and Role-Specific':10,'International and Relocation':10}.get(category,3)
    return 3


def validate_questions(data,category,kind,minimum=None,previous=(),answers_required=True):
    questions=data.get('questions',[])
    if not isinstance(questions,list) or len(questions)<(minimum if minimum is not None else required_count(category,kind)):
        raise ValueError('The category has insufficient questions.')
    if minimum is not None and len(questions)!=minimum:
        raise ValueError('The category must contain the exact requested question count.')
    ids, titles=set(),set()
    for q in questions:
        required_fields = COMMON_FIELDS+(HR_FIELDS if kind=='hr' else []) if answers_required else QUESTION_FIELDS
        for field in required_fields:
            if field not in q or q[field] is None or q[field]=='':
                raise ValueError('Incomplete interview field: '+field)
        if answers_required:
            short = ' '.join(str(q['short_answer']).split())
            detailed = ' '.join(str(q['detailed_answer']).split())
            if short.casefold() == detailed.casefold() or len(detailed.split()) < max(45, len(short.split())+15):
                raise ValueError('Detailed answers must substantially expand the short answer with explanations and examples.')
            coaching = r'^(?:you (?:should|need to|can)|choose (?:an?|one) |describe your |structure your answer|replace (?:this|the) |prepare an? answer)'
            if re.search(coaching, short, re.I) or re.search(coaching, detailed, re.I):
                raise ValueError('Provide the actual interview answer, not instructions telling the candidate how to answer.')
        if q['category']!=category or q['id'] in ids or q['question'].strip().casefold() in titles or q['question'].strip().casefold() in {title.strip().casefold() for title in previous}:
            raise ValueError('Duplicate question: choose a different specific scenario from previous_questions.' if q['category']==category else 'The category must exactly equal '+category+'.')
        ids.add(q['id']); titles.add(q['question'].strip().casefold())
        if q['source_classification'] not in ['General Preparation','Predicted','Publicly Reported']:
            raise ValueError('Unsupported source classification.')
        if q['source_classification']=='Publicly Reported' and not q.get('citations'):
            raise ValueError('Company interview claims require citations.')
        if answers_required and (not isinstance(q['follow_ups'],list) or not q['follow_ups'] or any(not x.get('question') or not x.get('answer') for x in q['follow_ups'])):
            raise ValueError('Follow-ups need answers.')
        if answers_required and category=='Programming and Coding':
            for field in ['language','problem_statement','input_output','constraints','examples','solution','explanation','time_complexity','space_complexity','edge_cases','test_cases','alternative_solution','optimizations']:
                if not q.get('coding',{}).get(field):
                    raise ValueError('Incomplete coding solution: '+field)
            solution=q['coding']['solution']
            if re.search(r'\bTODO\b|your code here|\.\.\.', solution, re.I):
                raise ValueError('Coding answers require a complete implementation, without placeholders.')
            code=re.sub(r'^```[^\n]*\n|\n```$', '', solution.strip())
            if str(q['coding'].get('language','')).casefold()=='python' or re.match(r'^(?:def |class |from |import )',code):
                try:
                    ast.parse(code)
                except SyntaxError as exc:
                    raise ValueError('Python coding solution has invalid syntax.') from exc
        if answers_required and category=='Database and SQL' and not q.get('sql',{}).get('solution'):
            raise ValueError('SQL questions require solutions and sample data.')
        if answers_required and kind=='hr' and not isinstance(q.get('variants'),dict):
            raise ValueError('HR questions require answer variants.')



def interview_generate(db,user_id,kind,profile,jd,version,company='',progress=None):
    categories = TECH_CATEGORIES if kind=='technical' else HR_CATEGORIES
    context={'candidate':candidate_context(profile),'jd':jd,'company':company,'classification':'User-provided'}
    cachekey=digest(json.dumps([kind,context,version,'interview-v5-questions-only',prompt_version('interview',kind)],sort_keys=True))
    existing=get_record(db,user_id,'interview',cachekey)
    if existing and existing.data.get('generation_status', 'completed') == 'completed':
        return {'content_id':existing.id,'cached':True}
    questions=[]
    usage=[]
    for i,category in enumerate(categories):
        total = required_count(category, kind)
        for offset in range(total):
            count = 1
            key=cachekey+':'+str(i)+':'+str(offset)
            saved=get_record(db,user_id,'interview_batch',key)
            if saved:
                questions.extend(saved.data['questions']); continue
            schema={field:'string' for field in QUESTION_FIELDS}
            schema.update({'category':category,'id':f'{"TECH" if kind=="technical" else "HR"}-{i+1:02d}-{offset+1:02d}','source_classification':'General Preparation'})
            prompt={'task':f'Generate {count} distinct, useful {kind} interview QUESTION(S) in category {category}. Generate questions only: do not answer them, provide coaching, write example responses, supply follow-up answers, code solutions, SQL solutions, or HR answer variants. Prioritize relevance to the job description, candidate context, and seniority. Each question must be specific, clear, and standalone.','question_count':count,'question_index_in_category':offset+1,'distinctness_instruction':'Choose a new topic or scenario for this slot. Never reuse or paraphrase previous_questions. Copy the category exactly from schema.','previous_questions':[q['question'] for q in questions],'schema':{'questions':[schema]},'context':context}
            prompt['execution_constraints']='Generate only the current single-question batch in the supplied JSON schema. Preparation plans, mock interviews and removed metadata are excluded by the application. Do not claim live research or execute code.'
            if kind=='technical':
                prompt['question_requirements']='For Programming and Coding, ask a clear coding problem without providing its solution. For Database and SQL, ask a clear query/problem without writing SQL. For architecture or scenario questions, ask for the candidate to explain their approach without supplying the approach or answer.'
            else:
                prompt['hr_requirements']='Generate the interview question only. Do not provide a candidate response, STAR example, answer variant, coaching text, or salary/notice-period template.'
            result=generate(json.dumps(prompt),lambda d:validate_questions(d,category,kind,count,[q['question'] for q in questions],answers_required=False),purpose='interview_questions')
            question_only=[{field:q[field] for field in QUESTION_FIELDS} for q in result['content']['questions']]
            put(db,user_id,'interview_batch',key,{'questions':question_only})
            db.commit()
            questions.extend(question_only); usage.append(result['usage'])
            for number, question in enumerate(questions):
                question['id'] = f'{"TECH" if kind=="technical" else "HR"}-{number+1:03d}'
            draft = {'kind':kind,'questions':list(questions),'company':company,'jd':jd,'resume_version_id':version,
                     'generation_status':'generating','planned_questions':sum(required_count(c,kind) for c in categories),
                     'top_question_ids':[q['id'] for q in questions[:30]],
                     'created_at':existing.data['created_at'] if existing else now().isoformat()}
            row=put(db,user_id,'interview',cachekey,draft)
            db.commit()
            if progress:
                progress({'content_id':row.id,'questions':len(questions),'total_questions':draft['planned_questions'],'stage':category})
    seen=set()
    for q in questions:
        normalized=q['question'].strip().casefold()
        if normalized in seen:
            raise ValueError('Duplicate question across categories; revise the saved batch.')
        seen.add(normalized)
    for i,q in enumerate(questions):
        q['id']=f'{"TECH" if kind=="technical" else "HR"}-{i+1:03d}'
    data={'kind':kind,'questions':questions,
          'top_question_ids':[q['id'] for q in sorted(questions,key=lambda q:int(q.get('priority',5)))[:30 if kind=='technical' else 25]],
          'jd':jd,'company':company,'resume_version_id':version,'jd_hash':digest(jd),'candidate_context':candidate_context(profile),
          'prompt_version':'interview-v5-questions-only','model_id':result['model'] if usage else (existing.data.get('model_id','cached') if existing else 'cached'),
          'usage':usage,'validation_status':'needs_review','generation_status':'completed','created_at':now().isoformat()}
    row=put(db,user_id,'interview',cachekey,data)
    db.commit()
    return {'content_id':row.id,'cached':False,'questions':len(questions)}


def generate_question_answer(kind, question, profile, jd, company=''):
    prompt={
        'task':f'Write a complete, high-quality answer to this single {kind} interview question. Answer only this question. Tailor it to the supplied candidate facts and job description without inventing personal experience, employers, dates, achievements, or metrics. If personal facts are missing, provide a clearly labeled hypothetical example instead of claiming it happened. For technical questions, include reasoning, trade-offs, and a concrete example. For coding or SQL questions, include a complete solution and explanation as part of the answer. For HR questions, use first person only for facts supported by the candidate context; clearly label hypothetical examples. Do not answer any other question.',
        'schema':{'answer':'A detailed, ready-to-use response to this one question; use paragraphs and fenced code blocks where appropriate.'},
        'question':{'category':question.get('category'),'topic':question.get('topic'),'question':question['question']},
        'candidate':candidate_context(profile),
        'job_description':jd,
        'company':company,
        'user_instructions':prompt_section('interview',kind),
        'execution_constraints':'Return a single JSON object with one non-empty answer string. No extra questions, preparation plan, markdown outside the JSON, or unsupported candidate claims.',
    }

    def validate(data):
        answer=data.get('answer')
        if not isinstance(answer,str) or len(answer.strip()) < 50:
            raise ValueError('The generated answer was too short to be useful.')
        if question.get('category') in {'Programming and Coding','Database and SQL'}:
            if '```' not in answer or re.search(r'\bTODO\b|your code here',answer,re.I):
                raise ValueError('Coding answers require a complete fenced code or SQL solution, without placeholders.')
            for code in re.findall(r'```python\s*\n(.*?)```',answer,re.S|re.I):
                try:
                    ast.parse(code.strip())
                except SyntaxError as exc:
                    raise ValueError('Python coding solution has invalid syntax.') from exc
        if len(answer) > 30000:
            raise ValueError('The generated answer is too long.')
        if re.match(r'^(?:you should|you need to|describe your|structure your answer|prepare an answer)',answer.strip(),re.I):
            raise ValueError('The model returned coaching instead of an interview answer.')

    return generate(json.dumps(prompt,ensure_ascii=False),validate,purpose='interview')


def clear_interview_answers(data):
    cleaned={**data}
    questions=[]
    for question in data.get('questions',[]):
        item={key:value for key,value in question.items() if key not in _ANSWER_FIELDS|{'coding','sql','variants'}}
        if isinstance(question.get('follow_ups'),list):
            follow_ups=[
                {'question':entry['question']}
                for entry in question['follow_ups']
                if isinstance(entry,dict) and isinstance(entry.get('question'),str)
            ]
            if follow_ups:
                item['follow_ups']=follow_ups
            else:
                item.pop('follow_ups',None)
        questions.append(item)
    cleaned['questions']=questions
    return cleaned


def guide_sections(data):
    hidden={'id','question','difficulty','source_classification','interview_round','preparation_note','jd_relevance','resume_relevance','qualitative_likelihood','priority','answer_model','answer_usage'}
    sections=[]
    for number, question in enumerate(data['questions'], start=1):
        sections.append({'heading':f"Q{number}. {question['question']}",'text':'\n\n'.join(
            f'{key.replace("_"," ").title()}: '+(value if isinstance(value,str) else json.dumps(value,ensure_ascii=False,indent=2))
            for key, value in question.items() if key not in hidden)})
    return {'title':'Career Assistant - '+data['kind'].title()+' Interview Guide','sections':sections}
