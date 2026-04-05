-- ============================================================
-- Career Intelligence Feed — Seed / Mock Data
-- Created: 2026-04-04
-- Purpose: Realistic sample data for development and demo.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. SOURCES
-- ────────────────────────────────────────────────────────────

INSERT INTO career_feed_sources (id, slug, name, description, source_type, base_url, is_active, config) VALUES
  ('a1b2c3d4-0001-4000-8000-000000000001', 'indeed_hiring_lab', 'Indeed Hiring Lab', 'Quantitative labor-market signals from Indeed research', 'quantitative', 'https://www.hiringlab.org', true, '{"cadence": "weekly", "format": "csv_reports"}'),
  ('a1b2c3d4-0002-4000-8000-000000000002', 'gdelt', 'GDELT Project', 'Global labor-market news discovery via GDELT open data', 'news', 'https://api.gdeltproject.org', true, '{"cadence": "daily", "format": "json_api"}'),
  ('a1b2c3d4-0003-4000-8000-000000000003', 'novawork_manual', 'NovaWork Editorial', 'Hand-curated strategic insights by the NovaWork team', 'manual', null, true, '{}')
ON CONFLICT (slug) DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- 2. FEED ITEMS
-- ────────────────────────────────────────────────────────────

INSERT INTO career_feed_items (id, source_id, external_id, title, summary, content_url, published_at, item_type, category, target_roles, target_industries, target_geographies, career_goals, relevance_score, metadata) VALUES

-- Indeed Hiring Lab signals
('b1000001-0000-4000-8000-000000000001',
 'a1b2c3d4-0001-4000-8000-000000000001', 'ihl-2026-q1-remote',
 'Remote Job Postings Rebound 18% in Q1 2026',
 'After two years of decline, remote-eligible job postings climbed back to 18% of total listings in Q1 2026, driven by tech, finance, and customer service roles.',
 'https://www.hiringlab.org/2026/04/01/remote-rebound-q1/',
 '2026-04-01', 'signal', 'remote_work',
 '{software_engineer,data_analyst,customer_service,product_manager}',
 '{technology,finance,professional_services}',
 '{US,Canada,remote}',
 '{transition,alignment}',
 8.5, '{"metric": "18% share", "trend_direction": "up"}'),

('b1000002-0000-4000-8000-000000000002',
 'a1b2c3d4-0001-4000-8000-000000000001', 'ihl-2026-ai-skills',
 'AI Skill Demand Surges 42% Year-Over-Year',
 'Employers listing AI-related skills grew 42% YoY. Prompt engineering, ML ops, and AI governance are the fastest-growing requirements across non-tech industries.',
 'https://www.hiringlab.org/2026/03/28/ai-skills-surge/',
 '2026-03-28', 'signal', 'skills_demand',
 '{data_scientist,software_engineer,product_manager,business_analyst}',
 '{technology,healthcare,finance,manufacturing}',
 '{US,EU,LATAM}',
 '{transition,reinvention,alignment}',
 9.2, '{"metric": "42% YoY", "trend_direction": "up"}'),

('b1000003-0000-4000-8000-000000000003',
 'a1b2c3d4-0001-4000-8000-000000000001', 'ihl-2026-healthcare-hiring',
 'Healthcare Hiring Hits Record High Amid Aging Population Pressure',
 'Healthcare sector posted 1.2M open roles in March 2026, the highest monthly figure since tracking began. Nursing, allied health, and health informatics lead growth.',
 'https://www.hiringlab.org/2026/04/02/healthcare-record/',
 '2026-04-02', 'signal', 'hiring_trends',
 '{registered_nurse,health_informatics,medical_technician,healthcare_admin}',
 '{healthcare,government,nonprofit}',
 '{US,Canada,UK}',
 '{transition,alignment}',
 7.8, '{"metric": "1.2M openings", "trend_direction": "up"}'),

('b1000004-0000-4000-8000-000000000004',
 'a1b2c3d4-0001-4000-8000-000000000001', 'ihl-2026-salary-compression',
 'Salary Compression Narrows: Mid-Level Pay Catches Up to Senior Roles',
 'Indeed Wage Tracker shows mid-career roles (5-10 yrs) saw 6.1% wage growth vs. 2.3% for senior roles, narrowing the experience premium gap.',
 'https://www.hiringlab.org/2026/03/25/salary-compression/',
 '2026-03-25', 'trend', 'salary',
 '{software_engineer,marketing_manager,financial_analyst,project_manager}',
 '{technology,finance,professional_services}',
 '{US}',
 '{alignment}',
 7.0, '{"metric": "6.1% vs 2.3%", "trend_direction": "converging"}'),

-- GDELT news articles
('b1000005-0000-4000-8000-000000000005',
 'a1b2c3d4-0002-4000-8000-000000000002', 'gdelt-20260402-layoffs-fintech',
 'Major Fintech Layoffs Signal Industry Consolidation Phase',
 'Three leading fintech firms announced combined layoffs of 4,500 employees this week, marking what analysts call the start of an industry consolidation cycle.',
 'https://example.com/fintech-layoffs-april-2026',
 '2026-04-02', 'article', 'layoffs',
 '{software_engineer,product_manager,financial_analyst,compliance_officer}',
 '{finance,technology}',
 '{US,EU}',
 '{reinvention,transition}',
 8.0, '{"sentiment": "negative", "impact_scale": "industry"}'),

('b1000006-0000-4000-8000-000000000006',
 'a1b2c3d4-0002-4000-8000-000000000002', 'gdelt-20260401-latam-tech-boom',
 'Latin America Emerges as Global Tech Talent Hub',
 'New report shows LATAM tech workforce grew 35% in two years. Colombia, Brazil, and Mexico are attracting nearshore operations from US and European companies.',
 'https://example.com/latam-tech-boom-2026',
 '2026-04-01', 'article', 'industry_shift',
 '{software_engineer,data_scientist,ux_designer,devops_engineer}',
 '{technology,professional_services}',
 '{LATAM,Colombia,Brazil,Mexico}',
 '{transition,alignment}',
 8.8, '{"sentiment": "positive", "impact_scale": "regional"}'),

('b1000007-0000-4000-8000-000000000007',
 'a1b2c3d4-0002-4000-8000-000000000002', 'gdelt-20260330-ai-regulation-eu',
 'EU AI Act Enforcement Creates New Compliance Career Path',
 'The EU AI Act enters full enforcement this quarter, driving demand for AI ethics officers, compliance specialists, and algorithmic auditors across regulated industries.',
 'https://example.com/eu-ai-act-careers-2026',
 '2026-03-30', 'article', 'ai_impact',
 '{compliance_officer,data_scientist,legal_counsel,policy_analyst}',
 '{technology,finance,healthcare,government}',
 '{EU,UK}',
 '{reinvention,transition}',
 8.3, '{"sentiment": "neutral", "impact_scale": "regulatory"}'),

('b1000008-0000-4000-8000-000000000008',
 'a1b2c3d4-0002-4000-8000-000000000002', 'gdelt-20260329-green-economy',
 'Green Economy Jobs Outpace Fossil Fuel Employment for First Time',
 'Renewable energy, sustainability consulting, and ESG roles now employ more workers than traditional fossil fuel sectors in the US and EU combined.',
 'https://example.com/green-economy-milestone-2026',
 '2026-03-29', 'article', 'industry_shift',
 '{sustainability_consultant,environmental_engineer,esg_analyst,project_manager}',
 '{energy,manufacturing,consulting,government}',
 '{US,EU,global}',
 '{reinvention,transition}',
 7.5, '{"sentiment": "positive", "impact_scale": "macro"}'),

-- NovaWork manual / editorial insights
('b1000009-0000-4000-8000-000000000009',
 'a1b2c3d4-0003-4000-8000-000000000003', 'nw-insight-hidden-job-market',
 'The Hidden Job Market Is Growing — Here Is How to Access It',
 'Up to 80% of roles are filled without public postings. NovaWork analysis shows that professionals who combine targeted networking with strategic positioning land roles 2x faster.',
 null,
 '2026-04-03', 'insight', 'career_strategy',
 '{}', '{}', '{}',
 '{transition,reinvention,alignment}',
 9.0, '{"authored_by": "NovaWork Editorial"}'),

('b1000010-0000-4000-8000-000000000010',
 'a1b2c3d4-0003-4000-8000-000000000003', 'nw-insight-resume-ai-screening',
 'Your Resume vs. the Machine: Beating AI Screening in 2026',
 'With 95% of Fortune 500 companies using ATS and AI resume screening, keyword optimization alone is no longer enough. Here is what actually moves the needle.',
 null,
 '2026-04-02', 'insight', 'career_strategy',
 '{}', '{}', '{}',
 '{transition,alignment}',
 8.7, '{"authored_by": "NovaWork Editorial"}'),

('b1000011-0000-4000-8000-000000000011',
 'a1b2c3d4-0003-4000-8000-000000000003', 'nw-insight-career-reinvention',
 'Career Reinvention in 2026: The 3-Phase Framework That Works',
 'NovaWork data from 10,000+ career transitions reveals a repeatable pattern: assess, reposition, and accelerate. Most professionals skip Phase 2 — here is why that is costly.',
 null,
 '2026-03-31', 'insight', 'career_strategy',
 '{}', '{}', '{}',
 '{reinvention}',
 9.5, '{"authored_by": "NovaWork Editorial"}'),

('b1000012-0000-4000-8000-000000000012',
 'a1b2c3d4-0001-4000-8000-000000000001', 'ihl-2026-economic-outlook-q2',
 'Q2 2026 Economic Outlook: Cautious Optimism as Hiring Stabilizes',
 'After a turbulent 2025, hiring intent indicators point to stabilization. Job postings are flat MoM but quality-of-hire metrics and retention rates are improving.',
 'https://www.hiringlab.org/2026/04/03/q2-outlook/',
 '2026-04-03', 'report', 'economic_outlook',
 '{}', '{}',
 '{US,EU,global}',
 '{transition,reinvention,alignment}',
 7.2, '{"metric": "flat MoM", "trend_direction": "stable"}')

ON CONFLICT (source_id, external_id) DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- 3. CURATION ENTRIES
-- ────────────────────────────────────────────────────────────

INSERT INTO career_feed_curation (item_id, status, curator_notes, novawork_take, action_hint, curated_at) VALUES

-- Approved items (visible in user feed)
('b1000001-0000-4000-8000-000000000001', 'approved',
 'Strong signal — timely for remote seekers.',
 'The remote work market is recovering. If you have been holding out for remote roles, this is a window to act — especially in tech and finance.',
 'Update your resume to highlight remote collaboration skills and apply to newly posted remote roles this week.',
 now()),

('b1000002-0000-4000-8000-000000000002', 'approved',
 'Critical trend — affects almost every user.',
 'AI skills are no longer optional, even outside tech. Employers across healthcare, finance, and manufacturing now expect basic AI literacy.',
 'Add any AI tools you use (ChatGPT, Copilot, data analysis) to your resume skills section. Consider a short certification if you lack hands-on experience.',
 now()),

('b1000003-0000-4000-8000-000000000003', 'approved',
 'Good for healthcare-targeted users.',
 'Healthcare is in a sustained hiring boom. If you are considering a career transition, health informatics and allied health roles offer strong entry points.',
 'Explore healthcare roles in the NovaWork Job Search module. Health informatics is especially accessible for tech professionals.',
 now()),

('b1000005-0000-4000-8000-000000000005', 'approved',
 'Important warning for fintech professionals.',
 'Fintech is entering a consolidation phase. If you work in this space, this is the time to strengthen your positioning before the next wave.',
 'Use the NovaWork Resume Builder to update your accomplishments and ensure your profile highlights transferable skills beyond fintech.',
 now()),

('b1000006-0000-4000-8000-000000000006', 'approved',
 'Highly relevant for LATAM users.',
 'Latin America is becoming a top destination for global tech talent. If you are based in LATAM, your market value is rising — position accordingly.',
 'Update your geography preferences and target roles to include nearshore opportunities. Highlight bilingual skills on your resume.',
 now()),

('b1000009-0000-4000-8000-000000000009', 'approved',
 'Core NovaWork value proposition.',
 'Most jobs are never posted publicly. Your next role is more likely to come from a strategic conversation than a job board.',
 'Start building your networking plan using NovaWork tools. Aim for 3-5 targeted outreach conversations per week.',
 now()),

('b1000010-0000-4000-8000-000000000010', 'approved',
 'Evergreen and high impact.',
 'AI screening is now the norm. A human-readable resume that also passes machine filters requires intentional keyword strategy and impact-driven language.',
 'Run your resume through the NovaWork JD Analyzer against your target job description to see how you score.',
 now()),

('b1000011-0000-4000-8000-000000000011', 'approved',
 'Flagship NovaWork insight.',
 'Career reinvention follows a pattern. Most people jump straight to applying without repositioning — which leads to longer, more frustrating searches.',
 'Start with the NovaWork Career Vision module to clarify your positioning before sending applications.',
 now()),

-- Pending items (awaiting review)
('b1000004-0000-4000-8000-000000000004', 'pending', null, null, null, null),
('b1000007-0000-4000-8000-000000000007', 'pending', null, null, null, null),
('b1000008-0000-4000-8000-000000000008', 'pending', null, null, null, null),
('b1000012-0000-4000-8000-000000000012', 'pending', null, null, null, null)

ON CONFLICT (item_id) DO NOTHING;
