-- ============================================
-- SEED DATA: Sample Interview Answers by Profession
-- CareerTipsAI 2025
-- Profile: Data Analyst / BI / Data Engineer
-- ============================================
-- These are template answers that can be assigned to users 
-- based on their target job title or profession
-- ============================================

-- First, let's create a table for profile-specific sample answers if it doesn't exist
CREATE TABLE IF NOT EXISTS interview_sample_answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID REFERENCES interview_questions(id) ON DELETE CASCADE,
  job_profile VARCHAR(100) NOT NULL, -- e.g., 'Data Analyst', 'Project Manager', 'Software Engineer'
  sample_answer TEXT NOT NULL,
  key_points JSONB, -- Key talking points
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_sample_answers_profile ON interview_sample_answers(job_profile);
CREATE INDEX IF NOT EXISTS idx_sample_answers_question ON interview_sample_answers(question_id);

-- Enable RLS
ALTER TABLE interview_sample_answers ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read sample answers
DROP POLICY IF EXISTS "Everyone can read sample answers" ON interview_sample_answers;
CREATE POLICY "Everyone can read sample answers" ON interview_sample_answers FOR SELECT USING (true);

-- ============================================
-- KNOWLEDGE & SKILLS QUESTIONS - DATA ANALYST PROFILE
-- ============================================

-- Q1: What can you offer us that other candidates cannot?
INSERT INTO interview_sample_answers (question_id, job_profile, sample_answer, key_points)
SELECT id, 'Data Analyst', 
'I combine strong SQL and BI delivery with "operations mindset." In analytics roles, I''ve migrated large reporting portfolios (300+ reports) into Power BI and improved SQL performance and ETL reliability with measurable impact. In technical operations, I''ve also improved repeatable processes and documentation to reduce rework and increase throughput. That blend helps me deliver insights while strengthening the systems and process that produce the data.',
'["SQL + BI delivery", "Operations mindset", "300+ report migration", "ETL reliability", "Process improvement"]'::jsonb
FROM interview_questions WHERE question_text ILIKE '%what can you offer us%' LIMIT 1
ON CONFLICT DO NOTHING;

-- Q2: What are your strengths?
INSERT INTO interview_sample_answers (question_id, job_profile, sample_answer, key_points)
SELECT id, 'Data Analyst',
'My strongest areas are (1) SQL-driven problem solving and validation, (2) turning messy requirements into reliable, repeatable reporting, and (3) process improvement with measurable outcomes. For example, I''ve optimized queries (about 35–40% efficiency gains in reporting workloads) and automated ETL workflows (reducing manual-load errors by ~40%). I also communicate clearly with both technical and non-technical stakeholders.',
'["SQL problem solving", "Messy to reliable reporting", "35-40% query efficiency", "40% error reduction", "Clear communication"]'::jsonb
FROM interview_questions WHERE question_text ILIKE '%what are your strengths%' LIMIT 1
ON CONFLICT DO NOTHING;

-- Q3: How successful have you been so far?
INSERT INTO interview_sample_answers (question_id, job_profile, sample_answer, key_points)
SELECT id, 'Data Analyst',
'I measure success by adoption, reliability, and time-to-insight. In BI work, I delivered large-scale reporting migration and performance improvements that reduced manual effort and improved maintainability. In operations environments, I contributed to completing major deliverables and improving standardized procedures to reduce rework and variability. I consistently focus on outcomes: faster data availability, fewer errors, and clearer decision support.',
'["Adoption metrics", "Reliability focus", "Time-to-insight", "Large-scale migrations", "Reduced rework"]'::jsonb
FROM interview_questions WHERE question_text ILIKE '%how successful have you been%' LIMIT 1
ON CONFLICT DO NOTHING;

-- Q4: What are your limitations?
INSERT INTO interview_sample_answers (question_id, job_profile, sample_answer, key_points)
SELECT id, 'Data Analyst',
'I avoid framing limitations as "fatal flaws." One area I continue to strengthen is deep specialization in a single modern ELT stack (for example, dbt + a specific cloud warehouse). I''ve worked across SQL, ETL tools, and BI, and I ramp quickly—but I''m intentional about accelerating learning in the exact tooling a team standardizes on. I manage it by building small proofs-of-concept early, aligning to team conventions, and documenting patterns as I go.',
'["Not a fatal flaw", "ELT stack specialization", "Quick ramp-up", "POC approach", "Documentation habits"]'::jsonb
FROM interview_questions WHERE question_text ILIKE '%what are your limitations%' LIMIT 1
ON CONFLICT DO NOTHING;

-- Q5: What qualifications could make you successful here?
INSERT INTO interview_sample_answers (question_id, job_profile, sample_answer, key_points)
SELECT id, 'Data Analyst',
'Strong SQL, data validation and profiling discipline, and experience translating business questions into data models and reporting. I''m comfortable with data quality troubleshooting, documentation, and building dashboards people actually use. I also bring a process-improvement mindset that reduces friction in recurring workflows (pipelines, refreshes, reporting cycles).',
'["Strong SQL", "Data validation", "Business to data model", "Dashboard delivery", "Process improvement"]'::jsonb
FROM interview_questions WHERE question_text ILIKE '%qualifications%successful%' LIMIT 1
ON CONFLICT DO NOTHING;

-- Q6: How long would it take you to make a meaningful contribution?
INSERT INTO interview_sample_answers (question_id, job_profile, sample_answer, key_points)
SELECT id, 'Data Analyst',
'Within the first 1–2 weeks, I can contribute by profiling datasets, validating key metrics, and improving existing queries or dashboards. Within 30–60 days, I typically own a meaningful deliverable end-to-end: a high-impact dashboard, a stabilized pipeline, or a standardized reporting/validation workflow. I ramp fastest when I can align early on definitions, source-of-truth tables, and success metrics.',
'["1-2 weeks: profiling", "30-60 days: end-to-end ownership", "Early alignment", "Source of truth focus"]'::jsonb
FROM interview_questions WHERE question_text ILIKE '%meaningful contribution%' LIMIT 1
ON CONFLICT DO NOTHING;

-- Q7: Describe how you solved a difficult management problem
INSERT INTO interview_sample_answers (question_id, job_profile, sample_answer, key_points)
SELECT id, 'Data Analyst',
'I''m not going to overstate formal "people management" if it doesn''t apply. A strong example is leading cross-functional alignment on reporting and data definitions. When stakeholders had conflicting metric definitions, I facilitated a short working session, documented agreed definitions, mapped them to source tables, and built a validation query pack that made disagreements visible and resolvable. The result was fewer last-minute disputes and a smoother reporting cadence.',
'["Cross-functional alignment", "Conflicting definitions", "Facilitated sessions", "Documentation", "Validation queries"]'::jsonb
FROM interview_questions WHERE question_text ILIKE '%difficult management problem%' LIMIT 1
ON CONFLICT DO NOTHING;

-- Q8: What do you look for when you hire people?
INSERT INTO interview_sample_answers (question_id, job_profile, sample_answer, key_points)
SELECT id, 'Data Analyst',
'Clarity of thinking, ownership, and evidence they can learn quickly. I look for people who can explain how they validate data, how they handle ambiguity, and how they communicate tradeoffs. For analytics roles specifically, I look for SQL fundamentals, curiosity, and discipline in documentation and reproducibility.',
'["Clarity of thinking", "Ownership", "Quick learning", "Data validation skills", "SQL fundamentals"]'::jsonb
FROM interview_questions WHERE question_text ILIKE '%look for when you hire%' LIMIT 1
ON CONFLICT DO NOTHING;

-- Q9: Have you ever had to fire anyone?
INSERT INTO interview_sample_answers (question_id, job_profile, sample_answer, key_points)
SELECT id, 'Data Analyst',
'I haven''t personally been the final decision-maker for termination. I have participated in performance improvement situations by setting clear expectations, providing coaching, and documenting objective performance signals. My focus is always to give people a fair path to succeed, and if that doesn''t happen, I support leadership with clear, factual documentation.',
'["No direct terminations", "Performance improvement", "Clear expectations", "Coaching", "Documentation"]'::jsonb
FROM interview_questions WHERE question_text ILIKE '%fire anyone%' LIMIT 1
ON CONFLICT DO NOTHING;

-- Q10: Most difficult task in being a manager?
INSERT INTO interview_sample_answers (question_id, job_profile, sample_answer, key_points)
SELECT id, 'Data Analyst',
'Maintaining clarity and fairness while balancing delivery pressure. The hardest part is keeping priorities aligned and removing blockers without creating confusion or burnout. The best managers I''ve seen make expectations explicit, measure outcomes, and communicate consistently.',
'["Clarity and fairness", "Delivery pressure", "Priority alignment", "Removing blockers", "Explicit expectations"]'::jsonb
FROM interview_questions WHERE question_text ILIKE '%most difficult task%manager%' LIMIT 1
ON CONFLICT DO NOTHING;

-- Q11: Situations where you worked under pressure or met deadlines
INSERT INTO interview_sample_answers (question_id, job_profile, sample_answer, key_points)
SELECT id, 'Data Analyst',
'A good example is large-scale reporting migration and ongoing support deadlines. When multiple reports had to be delivered while business still depended on old systems, I prioritized by usage and risk, built a repeatable conversion/validation checklist, and delivered in phases. Under pressure, I focus on scope control, validation, and communication—so speed doesn''t create rework.',
'["Reporting migration", "Prioritization by risk", "Phased delivery", "Scope control", "Validation focus"]'::jsonb
FROM interview_questions WHERE question_text ILIKE '%worked under pressure%' OR question_text ILIKE '%met deadlines%' LIMIT 1
ON CONFLICT DO NOTHING;

-- Q12: Objective you failed to meet
INSERT INTO interview_sample_answers (question_id, job_profile, sample_answer, key_points)
SELECT id, 'Data Analyst',
'In one situation, a deliverable slipped because requirements were still moving late in the cycle. The lesson was to lock definitions earlier and create a "change log" process so changes are tracked with impact assessment. After that, I used short checkpoint reviews and a validation baseline to reduce late surprises.',
'["Requirements moving late", "Definition lock process", "Change log", "Checkpoint reviews", "Validation baseline"]'::jsonb
FROM interview_questions WHERE question_text ILIKE '%failed to meet%' LIMIT 1
ON CONFLICT DO NOTHING;

-- Q13: What have you done to increase sales or profit?
INSERT INTO interview_sample_answers (question_id, job_profile, sample_answer, key_points)
SELECT id, 'Data Analyst',
'I''ve supported growth and efficiency by improving reporting quality and speed so teams can act faster. For example, optimizing queries and automating ETL reduced time-to-report and reduced manual errors—improving operational decisions and reducing waste. When sales/ops teams trust dashboards, they spend more time acting and less time reconciling numbers.',
'["Reporting quality", "Faster decisions", "Query optimization", "ETL automation", "Trust in dashboards"]'::jsonb
FROM interview_questions WHERE question_text ILIKE '%increase sales or profit%' LIMIT 1
ON CONFLICT DO NOTHING;

-- ============================================
-- INTERESTS QUESTIONS - DATA ANALYST PROFILE
-- ============================================

-- Q14: What are your ambitions for the future?
INSERT INTO interview_sample_answers (question_id, job_profile, sample_answer, key_points)
SELECT id, 'Data Analyst',
'I want to be in a role where I own data reliability and analytics delivery—building trusted datasets, improving pipelines, and delivering dashboards that drive action. Longer term, I want to be a lead analyst/analytics engineer who sets standards for modeling, validation, and documentation across a team.',
'["Own data reliability", "Analytics delivery", "Lead analyst path", "Standards setting", "Team documentation"]'::jsonb
FROM interview_questions WHERE question_text ILIKE '%ambitions for the future%' LIMIT 1
ON CONFLICT DO NOTHING;

-- Q15: What do you know about our company?
INSERT INTO interview_sample_answers (question_id, job_profile, sample_answer, key_points)
SELECT id, 'Data Analyst',
'I understand you''re focused on [mission/product], and the role emphasizes reliable data flows, strong SQL, ETL/ELT discipline, and stakeholder support. What appeals to me is the combination of operations ownership (data pipelines and quality) and business impact (dashboards and decision support). I''m prepared to learn your specific stack quickly and contribute to stability and insight.',
'["Research mission", "Technical requirements", "Operations + impact", "Quick stack learning"]'::jsonb
FROM interview_questions WHERE question_text ILIKE '%know about our company%' LIMIT 1
ON CONFLICT DO NOTHING;

-- Q16: Most important things in a work situation?
INSERT INTO interview_sample_answers (question_id, job_profile, sample_answer, key_points)
SELECT id, 'Data Analyst',
'Clear priorities, a culture that values data quality, and collaboration that respects definitions and governance. I do my best work when outcomes are measurable and when the team agrees on "what good looks like" for reliability, documentation, and delivery.',
'["Clear priorities", "Data quality culture", "Definitions governance", "Measurable outcomes"]'::jsonb
FROM interview_questions WHERE question_text ILIKE '%most important%in a work situation%' LIMIT 1
ON CONFLICT DO NOTHING;

-- Q17: Don't you feel over-qualified?
INSERT INTO interview_sample_answers (question_id, job_profile, sample_answer, key_points)
SELECT id, 'Data Analyst',
'I view experience as a way to de-risk execution. I''m comfortable doing hands-on work—SQL, validation, pipeline troubleshooting—while also improving process and documentation. I''m not looking for a title; I''m looking for a role where I can deliver value quickly and grow with the team.',
'["Experience de-risks", "Hands-on comfort", "Value over title", "Team growth focus"]'::jsonb
FROM interview_questions WHERE question_text ILIKE '%over-qualified%' LIMIT 1
ON CONFLICT DO NOTHING;

-- Q18: Work situation that irritated you?
INSERT INTO interview_sample_answers (question_id, job_profile, sample_answer, key_points)
SELECT id, 'Data Analyst',
'The biggest frustration is when metrics are debated endlessly without agreeing on definitions and sources. I address it by documenting definitions, mapping to source tables, and building validation queries so discussions become objective and resolvable.',
'["Metric debates", "Definition documentation", "Source mapping", "Validation queries", "Objective discussions"]'::jsonb
FROM interview_questions WHERE question_text ILIKE '%irritated you%' LIMIT 1
ON CONFLICT DO NOTHING;

-- Q19: Important trends in your industry?
INSERT INTO interview_sample_answers (question_id, job_profile, sample_answer, key_points)
SELECT id, 'Data Analyst',
'More emphasis on governed self-service analytics, stronger data quality observability, and ELT workflows with version-controlled transformations. Also: semantic layers/metric stores, and increased expectations that analysts understand both data modeling and operational reliability.',
'["Self-service analytics", "Data quality observability", "Version-controlled ELT", "Semantic layers", "Data modeling skills"]'::jsonb
FROM interview_questions WHERE question_text ILIKE '%trends in your industry%' LIMIT 1
ON CONFLICT DO NOTHING;

-- Q20: What did you like most/least in your last job?
INSERT INTO interview_sample_answers (question_id, job_profile, sample_answer, key_points)
SELECT id, 'Data Analyst',
'Most: delivering measurable improvements—faster queries, fewer ETL errors, clearer dashboards people trusted. Least: repeated rework caused by late requirement changes or inconsistent definitions—something I helped reduce through documentation and validation baselines.',
'["Measurable improvements", "Faster queries", "Fewer errors", "Reduced rework", "Documentation fixes"]'::jsonb
FROM interview_questions WHERE question_text ILIKE '%like most%least%' OR question_text ILIKE '%liked most%liked least%' LIMIT 1
ON CONFLICT DO NOTHING;

-- Q21: What do you feel you should earn?
INSERT INTO interview_sample_answers (question_id, job_profile, sample_answer, key_points)
SELECT id, 'Data Analyst',
'I base compensation on role scope, location, and expectations. I''m looking for a market-aligned range for a Data Analyst / BI / Warehouse Operations profile, and I''m flexible depending on benefits and growth opportunity. If you share the budgeted range, I can tell you if we''re aligned.',
'["Market-aligned", "Scope-based", "Flexible on benefits", "Ask for their range"]'::jsonb
FROM interview_questions WHERE question_text ILIKE '%should earn%' OR question_text ILIKE '%compensation%looking for%' LIMIT 1
ON CONFLICT DO NOTHING;

-- Q22: What motivates you the most?
INSERT INTO interview_sample_answers (question_id, job_profile, sample_answer, key_points)
SELECT id, 'Data Analyst',
'Building clarity from complexity: taking messy requirements and data, making it reliable, and seeing teams make faster, better decisions because they trust the numbers.',
'["Clarity from complexity", "Messy to reliable", "Trusted numbers", "Better decisions"]'::jsonb
FROM interview_questions WHERE question_text ILIKE '%motivates you%' LIMIT 1
ON CONFLICT DO NOTHING;

-- Q23: Long-range goals?
INSERT INTO interview_sample_answers (question_id, job_profile, sample_answer, key_points)
SELECT id, 'Data Analyst',
'To grow into a lead role owning data quality, modeling standards, and analytics delivery—helping a team scale trusted insights while keeping pipelines stable and maintainable.',
'["Lead role", "Data quality ownership", "Modeling standards", "Scalable insights", "Stable pipelines"]'::jsonb
FROM interview_questions WHERE question_text ILIKE '%long-range goals%' OR question_text ILIKE '%long range goals%' LIMIT 1
ON CONFLICT DO NOTHING;

-- ============================================
-- VALUES / CULTURE FIT - DATA ANALYST PROFILE
-- ============================================

-- Q24: Tell me about yourself
INSERT INTO interview_sample_answers (question_id, job_profile, sample_answer, key_points)
SELECT id, 'Data Analyst',
'I''m a data and operations professional focused on reliable reporting and measurable improvements. In analytics roles, I''ve migrated large report portfolios into Power BI, optimized SQL performance, and automated ETL workflows to reduce errors and manual effort. I also bring process discipline from technical operations environments—improving repeatability, documentation, and quality control. I''m at my best when I can own a problem end-to-end: understand the requirement, validate the data, deliver a solution, and document it so it scales.',
'["Data + operations", "BI migration", "SQL optimization", "ETL automation", "End-to-end ownership", "Documentation"]'::jsonb
FROM interview_questions WHERE question_text ILIKE 'Tell me about yourself%' LIMIT 1
ON CONFLICT DO NOTHING;

-- Q25: Why are you seeking a position with our company?
INSERT INTO interview_sample_answers (question_id, job_profile, sample_answer, key_points)
SELECT id, 'Data Analyst',
'Because the role sits at the intersection of pipeline reliability, data quality, and stakeholder-facing insights—exactly where I add value. I''m looking for a team where I can strengthen daily warehouse operations while delivering dashboards and analysis that drive decisions.',
'["Pipeline reliability", "Data quality", "Stakeholder insights", "Warehouse operations", "Decision support"]'::jsonb
FROM interview_questions WHERE question_text ILIKE '%seeking a position%' LIMIT 1
ON CONFLICT DO NOTHING;

-- Q26: How would you describe your personality?
INSERT INTO interview_sample_answers (question_id, job_profile, sample_answer, key_points)
SELECT id, 'Data Analyst',
'Calm under pressure, structured, and outcome-oriented. I''m collaborative, but I''m also direct about definitions, assumptions, and validation because that protects trust in the data.',
'["Calm under pressure", "Structured", "Outcome-oriented", "Collaborative", "Direct communication"]'::jsonb
FROM interview_questions WHERE question_text ILIKE '%describe your personality%' LIMIT 1
ON CONFLICT DO NOTHING;

-- Q27: What is your management style?
INSERT INTO interview_sample_answers (question_id, job_profile, sample_answer, key_points)
SELECT id, 'Data Analyst',
'My leadership style is structured and supportive: clear expectations, frequent checkpoints, and objective measures of success. I focus on removing blockers, documenting decisions, and coaching through examples.',
'["Clear expectations", "Frequent checkpoints", "Objective measures", "Blocker removal", "Coaching"]'::jsonb
FROM interview_questions WHERE question_text ILIKE '%management style%' LIMIT 1
ON CONFLICT DO NOTHING;

-- Q28: Why are you leaving your present job?
INSERT INTO interview_sample_answers (question_id, job_profile, sample_answer, key_points)
SELECT id, 'Data Analyst',
'I''m looking for a role that''s more aligned with long-term growth in data/analytics and where I can apply my SQL/BI and data operations strengths consistently. I''m proud of the work I''ve done; now I want the next environment where I can scale that impact.',
'["Long-term growth", "Data/analytics alignment", "Consistent application", "Scale impact"]'::jsonb
FROM interview_questions WHERE question_text ILIKE '%leaving your present job%' OR question_text ILIKE '%leaving your current%' LIMIT 1
ON CONFLICT DO NOTHING;

-- Q29: Ideal work environment?
INSERT INTO interview_sample_answers (question_id, job_profile, sample_answer, key_points)
SELECT id, 'Data Analyst',
'A team that values clarity: documented definitions, data quality discipline, and respectful collaboration. I appreciate fast-moving environments as long as quality and accountability remain non-negotiable.',
'["Clarity", "Data quality discipline", "Respectful collaboration", "Fast-moving", "Quality non-negotiable"]'::jsonb
FROM interview_questions WHERE question_text ILIKE '%ideal%work environment%' LIMIT 1
ON CONFLICT DO NOTHING;

-- Q30: How do subordinates/teammates perceive you?
INSERT INTO interview_sample_answers (question_id, job_profile, sample_answer, key_points)
SELECT id, 'Data Analyst',
'They typically see me as dependable and structured—someone who brings clarity, communicates progress, and helps solve problems without drama.',
'["Dependable", "Structured", "Clarity", "Progress communication", "No drama"]'::jsonb
FROM interview_questions WHERE question_text ILIKE '%subordinates%perceive%' OR question_text ILIKE '%teammates perceive%' LIMIT 1
ON CONFLICT DO NOTHING;

-- ============================================
-- VERIFICATION
-- ============================================

SELECT '✅ Sample answers for Data Analyst profile inserted!' as status;

SELECT 
  job_profile,
  COUNT(*) as total_answers
FROM interview_sample_answers
GROUP BY job_profile;

-- ============================================
-- END OF SEED DATA
-- ============================================
