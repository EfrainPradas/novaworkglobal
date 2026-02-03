-- ============================================
-- SEED DATA: Interview Questions Bank
-- Interview Mastery System™
-- CareerTipsAI 2025
-- ============================================
-- Based on Career Coach Connection 2022 Materials
-- Source: Difficult Questions 2020 PDF
-- Categories: Skills, Interests, Values, Competency-Based
-- ============================================

-- Clear existing data (optional - comment out if you want to keep existing questions)
-- TRUNCATE TABLE interview_questions CASCADE;

-- ============================================
-- CATEGORY 1: SKILLS QUESTIONS
-- "Can you do the job? Do you have the knowledge and competencies?"
-- ============================================

INSERT INTO interview_questions (question_text, question_category, question_subcategory, source, difficulty_level, answering_tips, common_for_roles, par_methodology_applicable) VALUES

-- Skills Questions 1-6
('What can you offer us that other candidates cannot?', 'skills', 'unique_value', 'general', 'medium', 'Respond by emphasizing your unique qualities and capabilities. Relate them to the position at hand whenever possible.', ARRAY['All'], TRUE),

('What are your strengths?', 'skills', 'self_awareness', 'general', 'easy', 'You should be able to enumerate three or four of your key strengths (with examples) that are relevant to their needs based on your research and other data you have gathered about the company.', ARRAY['All'], TRUE),

('How successful have you been so far?', 'skills', 'achievements', 'general', 'medium', 'Be prepared to define success for yourself and then respond. Try to choose accomplishments that relate to the organization''s needs and values.', ARRAY['All'], TRUE),

('What are your limitations?', 'skills', 'self_awareness', 'general', 'hard', 'When discussing mistakes or criticism, emphasize what you learned and how your behavior is different as a result of the experience. Do not claim to be faultless.', ARRAY['All'], TRUE),

('What qualifications could make you successful here?', 'skills', 'job_fit', 'general', 'medium', 'Talk about two or three of your major problem-solving skills (supported by accomplishments), which you believe will be useful in the position.', ARRAY['All'], TRUE),

('How long would it take you to make a meaningful contribution?', 'skills', 'onboarding', 'general', 'medium', 'Think about your accomplishments and select one that is indicative of the kind of work you can do.', ARRAY['All'], TRUE),

-- Skills Questions 7-12 (Management/Leadership)
('Can you describe how you solved a difficult management problem?', 'skills', 'management', 'general', 'hard', 'Relate one of your accomplishments that had to do with this kind of situation. Depending on the organization''s culture and needs, highlight conflict management, team building, or staffing.', ARRAY['Manager', 'Director', 'Executive'], TRUE),

('As a manager, what do you look for when you hire people?', 'skills', 'hiring', 'general', 'medium', 'Their skills, initiative, accomplishments, creativity, adaptability - and whether their chemistry fits with that of the organization.', ARRAY['Manager', 'Director', 'Executive'], TRUE),

('As a manager, have you ever had to fire anyone? Explain.', 'skills', 'management', 'general', 'hard', 'If you have, answer briefly that you have indeed had this experience and that it worked out to the benefit of both the individual and the organization. You followed the company''s disciplinary procedures carefully. Don''t volunteer more information unless the interviewer asks for more details. If you have never fired anyone, say so.', ARRAY['Manager', 'Director', 'Executive'], FALSE),

('What do you see as the most difficult task in being a manager?', 'skills', 'management', 'general', 'medium', 'Focus on skills that won''t be fundamental for the performance of your job. Don''t say getting the job through others if you are a Project Manager.', ARRAY['Manager', 'Director', 'Executive'], TRUE),

('What were some situations in which you worked under pressure or met deadlines?', 'skills', 'stress_management', 'general', 'medium', 'Refer to your accomplishments. Discuss one or two in which you were especially effective in meeting deadlines or dealing with high-pressure situations.', ARRAY['All'], TRUE),

('Can you tell me about an objective in your last job that you failed to meet? Why?', 'skills', 'failure_handling', 'general', 'hard', 'If you can honestly state that you met all objectives, say so. If there was an objective that you were unable to meet for legitimate reasons, discuss it with an explanation of the obstacles over which you had no control. Even better, Above all, state what you learned as a result of the experience.', ARRAY['All'], TRUE),

-- Skills Questions 13-15
('What have you done that helped increase sales or profit? How did you go about it?', 'skills', 'business_impact', 'general', 'medium', 'This is your chance to describe in some detail a business accomplishment that is relevant to the proposed new position. Be specific about the numbers.', ARRAY['Sales', 'Business Development', 'Product Manager'], TRUE),

('How many people have you managed in your recent positions?', 'skills', 'leadership', 'general', 'easy', 'Be specific - and feel free to refer to those over whom you had influence, such as a task force or a matrix organization. Give examples of times when you were a leader.', ARRAY['Manager', 'Director', 'Executive'], FALSE),

('If I spoke with your previous manager, what would he or she say are your greatest strengths and weaknesses?', 'skills', 'references', 'general', 'hard', 'Be consistent with what you think he or she would say. Position any weakness in a positive way. Use examples, not just words. Your former manager will probably want to give you a good reference, so recount some of the positive things you did for him or her.', ARRAY['All'], FALSE),

-- ============================================
-- CATEGORY 2: INTERESTS QUESTIONS
-- "Will you do the job? What do you prefer and like?"
-- ============================================

-- Interests Questions 1-6
('What are your ambitions for the future?', 'interests', 'career_goals', 'general', 'medium', 'Indicate your desire to concentrate on doing the immediate work well and your confidence that the future will be promising. You do not want to convey that you have no desire to progress, but you need to avoid statements that are unrealistic or that might threaten present incumbents.', ARRAY['All'], FALSE),

('What do you know about our company?', 'interests', 'company_research', 'general', 'easy', 'If you have done your homework, you can honestly say that you have studied all that is publicly available about the company you are interviewing with, and are thus aware of many published facts.', ARRAY['All'], FALSE),

('What things are most important to you in a work situation?', 'interests', 'work_preferences', 'general', 'medium', 'Use information developed from your Satisfiers/Dissatisfiers to relate your answer to what you know about the position.', ARRAY['All'], FALSE),

('Don''t you feel you might be over-qualified or too experienced for the position we have in mind?', 'interests', 'overqualification', 'general', 'hard', 'There are two things: you are too expensive or you might leave us when you find something better. Address those concerns.', ARRAY['All'], FALSE),

('What about a work situation that irritated you?', 'interests', 'conflict_handling', 'general', 'medium', 'Talk about this type of situation in terms of the skills you used to manage and improve it. Eliminate it. Stress your ability to stay cool under pressure.', ARRAY['All'], TRUE),

('What important trends do you see coming in our industry?', 'interests', 'industry_knowledge', 'general', 'medium', 'Choose two or three important developments to discuss. This is important to show your preparation.', ARRAY['All'], FALSE),

-- Interests Questions 7-10
('In your last job, What were the things that you liked most? Liked least?', 'interests', 'job_satisfaction', 'general', 'medium', 'Respond with care to this question. You will have the information from your Satisfiers/Dissatisfiers, and you will want to emphasize the positives and de-emphasize the negatives.', ARRAY['All'], FALSE),

('What do you feel you should earn in the proposed position?', 'interests', 'compensation', 'general', 'hard', 'The one who holds the information wins in a negotiation. If you have no choice but to answer give a range. Use reliable sources to research salaries and always say it''s negotiable.', ARRAY['All'], FALSE),

('What motivates you the most?', 'interests', 'motivation', 'general', 'easy', 'Use the results of your career assessments and keep your answer fairly general: the satisfaction of meeting the challenges of the position, developing teams and individuals, or perhaps meeting organizational goals. Only if you are in sales might you mention money as a motivator.', ARRAY['All'], FALSE),

('What are your long-range goals?', 'interests', 'career_goals', 'general', 'medium', 'Relate your answer to the company you are interviewing with rather than give a very broad, general answer. Keep your ambitions realistic. Talk first about doing the work for which you are applying, then talk about longer-range goals.', ARRAY['All'], FALSE),

-- ============================================
-- CATEGORY 3: VALUES QUESTIONS
-- "Will you fit with the organization's culture? Will you last on this position?"
-- ============================================

-- Values Questions 1-7
('Tell me about yourself.', 'values', 'introduction', 'general', 'medium', 'This is your Introductory Positioning Statement. This is also an opportunity to build rapport and give the interviewer a frame of reference. It needs to be memorable, anecdotal, and tell your story.', ARRAY['All'], FALSE),

('What do you know about our company? What was your salary at ABC Company? What kind of compensation are you looking for? How much are you worth?', 'values', 'company_knowledge', 'general', 'medium', 'See interests Q. 8 for compensation. Research the company thoroughly.', ARRAY['All'], FALSE),

('Why are you seeking a position with our company?', 'values', 'motivation', 'general', 'easy', 'Indicate that from your study of the company, the business issues they face are the kind that excite you and match up well with your skills, abilities, and past experience. If you can do so honestly, express your admiration for the company and what it is that appeals to you.', ARRAY['All'], FALSE),

('How would you describe your personality?', 'values', 'self_awareness', 'general', 'easy', 'Mention two or three of your most beneficial traits. To the extent that you can, highlight traits that would be a valuable asset to the work challenge under discussion. Align them with company''s values.', ARRAY['All'], FALSE),

('What is your management style?', 'values', 'management', 'general', 'medium', 'No doubt you defined your management style as part of your assessment. You might want to talk about how you set goals and then get your people involved in them.', ARRAY['Manager', 'Director', 'Executive'], FALSE),

('Why are you leaving your present job?', 'values', 'job_change', 'general', 'hard', 'This question must be answered briefly. If you get defensive or explain and rationalize to excess, you will only stir up questions and concerns in the interviewer''s mind. If it was a forced reduction due to economic circumstances, make that clear.', ARRAY['All'], FALSE),

('What do you feel would be an ideal work environment?', 'values', 'culture_fit', 'general', 'medium', 'This is an opportunity to mention insights from your Satisfiers exercise but don''t make it sound too lofty or impractical. Refrain from mentioning the Dissatisfiers.', ARRAY['All'], FALSE),

-- Values Questions 8-12
('Looking back, how do you perceive your past employer?', 'values', 'professionalism', 'general', 'medium', 'Be positive. Refer to the valuable experience you have gained. Never malign a former employer, no matter how justified. Say something like, "It is an excellent company which has given me many valuable experiences and opportunities to perform successfully."', ARRAY['All'], FALSE),

('How do you think your subordinates perceive you?', 'values', 'leadership', 'general', 'medium', 'Be as positive as you can, referring to your strengths, skills, and traits, but remember to be honest, too. References are easily checked.', ARRAY['Manager', 'Director', 'Executive'], FALSE),

('Why haven''t you found a new position after so many months?', 'values', 'job_search', 'general', 'hard', 'You may find this question offensive, but try not to take it personally. Simply give a brief answer, "Finding any position in this marketplace is challenging, but finding the right position takes care and time," and move on.', ARRAY['All'], FALSE),

('What do you think of your previous manager?', 'values', 'professionalism', 'general', 'medium', 'This could be a loaded question. Be as positive as you can, and avoid becoming embroiled in this issue. If you like the individual, say so and tell why. If you don''t, think of something positive to say.', ARRAY['All'], FALSE),

('What other types of work or companies are you considering at this time?', 'values', 'job_search', 'general', 'medium', 'Don''t feel obliged to reveal details of your other negotiations. If you are interviewing elsewhere refer to your campaign in a general way, but concentrate mainly on the specific position for which you are interviewing.', ARRAY['All'], FALSE),

-- ============================================
-- CATEGORY 4: COMPETENCY-BASED QUESTIONS (General)
-- "Understand what you did in the past, so we can predict how you will do it in the future"
-- ============================================

-- CB Questions 1-14
('Give an example of when you have successfully led a team.', 'competency', 'leadership', 'general', 'medium', 'Use PAR methodology: Problem/Actions/Results (measured)', ARRAY['Manager', 'Team Lead'], TRUE),

('Describe a time when you have had to adapt your working style.', 'competency', 'adaptability', 'general', 'medium', 'Use PAR methodology: Problem/Actions/Results (measured)', ARRAY['All'], TRUE),

('When have you influenced people to get a decision through?', 'competency', 'influence', 'general', 'medium', 'Use PAR methodology: Problem/Actions/Results (measured)', ARRAY['All'], TRUE),

('Provide an example of when you have taken a risk.', 'competency', 'risk_taking', 'general', 'medium', 'Use PAR methodology: Problem/Actions/Results (measured)', ARRAY['All'], TRUE),

('Explain how you''ve played a vital part as a team member.', 'competency', 'teamwork', 'general', 'medium', 'Use PAR methodology: Problem/Actions/Results (measured)', ARRAY['All'], TRUE),

('Give an example of when you''ve overcome a challenge at work.', 'competency', 'problem_solving', 'general', 'medium', 'Use PAR methodology: Problem/Actions/Results (measured)', ARRAY['All'], TRUE),

('Explain how you have dealt with a challenging stakeholder.', 'competency', 'stakeholder_management', 'general', 'hard', 'Use PAR methodology: Problem/Actions/Results (measured)', ARRAY['Manager', 'Project Manager'], TRUE),

('Explain a time when you built relationships within work.', 'competency', 'relationship_building', 'general', 'medium', 'Use PAR methodology: Problem/Actions/Results (measured)', ARRAY['All'], TRUE),

('Describe a time when you have successfully negotiated.', 'competency', 'negotiation', 'general', 'medium', 'Use PAR methodology: Problem/Actions/Results (measured)', ARRAY['All'], TRUE),

('Tell me about a time when you have failed to deliver.', 'competency', 'failure_handling', 'general', 'hard', 'Use PAR methodology: Problem/Actions/Results (measured)', ARRAY['All'], TRUE),

('Describe when you had to make a decision without all the facts.', 'competency', 'decision_making', 'general', 'hard', 'Use PAR methodology: Problem/Actions/Results (measured)', ARRAY['All'], TRUE),

('Explain how you have improved the performance of a team.', 'competency', 'team_development', 'general', 'medium', 'Use PAR methodology: Problem/Actions/Results (measured)', ARRAY['Manager', 'Team Lead'], TRUE),

('Tell us about a time when you have dealt with conflict.', 'competency', 'conflict_resolution', 'general', 'hard', 'Use PAR methodology: Problem/Actions/Results (measured)', ARRAY['All'], TRUE),

('Describe a challenging project you''ve had to deliver.', 'competency', 'project_management', 'general', 'medium', 'Use PAR methodology: Problem/Actions/Results (measured)', ARRAY['Project Manager', 'Manager'], TRUE);

-- ============================================
-- AMAZON LEADERSHIP PRINCIPLES (Competency-Based)
-- ============================================

INSERT INTO interview_questions (question_text, question_category, question_subcategory, source, difficulty_level, answering_tips, common_for_roles, par_methodology_applicable) VALUES

-- Bias for Action
('Tell me about a time you had to quickly adjust your work priorities to meet changing demands.', 'competency', 'bias_for_action', 'amazon', 'medium', 'Amazon Leadership Principle: Bias for Action. Show decisiveness and ability to move fast.', ARRAY['All'], TRUE),

-- Teamwork/Interpersonal Skills
('What have you done when you needed to motivate a group of individuals?', 'competency', 'teamwork', 'amazon', 'medium', 'Amazon Leadership Principle: Show leadership and ability to inspire others.', ARRAY['Manager', 'Team Lead'], TRUE),

('Give me an example of a time you faced a conflict while working on a team. How did you handle that?', 'competency', 'conflict_resolution', 'amazon', 'hard', 'Amazon Leadership Principle: Focus on resolution and maintaining team effectiveness.', ARRAY['All'], TRUE),

('The last time you had to apologize to someone.', 'competency', 'humility', 'amazon', 'hard', 'Amazon Leadership Principle: Earn Trust. Show vulnerability and accountability.', ARRAY['All'], TRUE),

('Describe a long-term project that you managed. How did you keep everything moving along in a timely manner?', 'competency', 'project_management', 'amazon', 'medium', 'Amazon Leadership Principle: Deliver Results. Show planning and execution skills.', ARRAY['Project Manager', 'Manager'], TRUE),

('Describe a situation you negotiated with others in your organization to reach an agreement.', 'competency', 'negotiation', 'amazon', 'medium', 'Amazon Leadership Principle: Show collaboration and win-win mindset.', ARRAY['All'], TRUE),

-- Earn Trust
('Tell me about a time when you received negative feedback from your manager. How did you respond?', 'competency', 'feedback_handling', 'amazon', 'hard', 'Amazon Leadership Principle: Earn Trust. Show openness to feedback and growth mindset.', ARRAY['All'], TRUE),

-- Problem Solving / Dive Deep
('Tell me about a time when you missed an obvious solution to a problem.', 'competency', 'problem_solving', 'amazon', 'hard', 'Amazon Leadership Principle: Dive Deep. Show humility and learning from mistakes.', ARRAY['All'], TRUE),

('Tell me about a time when you faced a problem that had multiple solutions.', 'competency', 'decision_making', 'amazon', 'medium', 'Amazon Leadership Principle: Dive Deep. Show analytical thinking and decision-making process.', ARRAY['All'], TRUE),

-- Strategy/Decision Making
('Tell me about a time when you were 75% through a project and had to pivot strategy.', 'competency', 'adaptability', 'amazon', 'hard', 'Amazon Leadership Principle: Think Big. Show flexibility and strategic thinking.', ARRAY['Manager', 'Product Manager'], TRUE),

('Tell me about a time you had to deal with ambiguity.', 'competency', 'ambiguity_handling', 'amazon', 'hard', 'Amazon Leadership Principle: Show comfort with uncertainty and ability to move forward.', ARRAY['All'], TRUE),

('Tell me about the toughest decision you''ve had to make in the past six months.', 'competency', 'decision_making', 'amazon', 'hard', 'Amazon Leadership Principle: Have Backbone; Disagree and Commit.', ARRAY['Manager', 'Director'], TRUE),

-- Learn and Be Curious
('What is the most innovative new idea that you have implemented?', 'competency', 'innovation', 'amazon', 'medium', 'Amazon Leadership Principle: Invent and Simplify. Show creativity and implementation.', ARRAY['All'], TRUE),

('Can the most innovative idea be solved with a simple solution?', 'competency', 'innovation', 'amazon', 'medium', 'Amazon Leadership Principle: Invent and Simplify. Show preference for simplicity.', ARRAY['All'], TRUE),

-- Ownership
('Tell me about a time you stepped up into a leadership role.', 'competency', 'ownership', 'amazon', 'medium', 'Amazon Leadership Principle: Ownership. Show initiative and accountability.', ARRAY['All'], TRUE),

('Tell me about a hard decision to sacrifice short term gain to long term goal.', 'competency', 'strategic_thinking', 'amazon', 'hard', 'Amazon Leadership Principle: Think Big. Show long-term thinking.', ARRAY['Manager', 'Director'], TRUE),

('Tell me about a time when you had to push back to HQ or challenged a decision.', 'competency', 'courage', 'amazon', 'hard', 'Amazon Leadership Principle: Have Backbone; Disagree and Commit.', ARRAY['All'], TRUE),

-- Customer Obsession
('We all deal with difficult customers from time to time. Tell me about a challenging client-facing situation and how you handled it?', 'competency', 'customer_service', 'amazon', 'medium', 'Amazon Leadership Principle: Customer Obsession. Show empathy and problem-solving.', ARRAY['All'], TRUE),

-- Failure
('Tell me about a time when you were not able to meet a time commitment. What prevented you from meeting it? What was the outcome and what did you learn from it?', 'competency', 'failure_handling', 'amazon', 'hard', 'Amazon Leadership Principle: Deliver Results. Show accountability and learning.', ARRAY['All'], TRUE),

('Tell me about a time you failed and what did you learn from it.', 'competency', 'failure_handling', 'amazon', 'hard', 'Amazon Leadership Principle: Learn and Be Curious. Show growth mindset.', ARRAY['All'], TRUE);

-- ============================================
-- AMERICAN EXPRESS (Competency-Based)
-- ============================================

INSERT INTO interview_questions (question_text, question_category, question_subcategory, source, difficulty_level, answering_tips, common_for_roles, par_methodology_applicable) VALUES

('In the dynamic, high energy environment of American Express, we value communication that is compelling and influences others. Please tell me about a specific time when you delivered a compelling message that had an impact on your audience.', 'competency', 'communication', 'amex', 'hard', 'American Express competency: Show persuasion and influence skills with specific example.', ARRAY['All'], TRUE),

('Please give me an example of a time when you had to explain your ideas to others.', 'competency', 'communication', 'amex', 'medium', 'American Express competency: Show clarity and ability to simplify complex ideas.', ARRAY['All'], TRUE),

('Please describe a situation in which you had something difficult or unpopular to say, and you went ahead and said it.', 'competency', 'courage', 'amex', 'hard', 'American Express competency: Show courage and ability to have difficult conversations.', ARRAY['All'], TRUE),

('You are leading a group that has many diverse ideas about how a problem should be solved. However, no one seems to agree on the right approach to the problem. What would you do to get collaboration and agreement on the right solution?', 'competency', 'collaboration', 'amex', 'hard', 'American Express competency: Show facilitation and consensus-building skills.', ARRAY['Manager', 'Team Lead'], TRUE),

('Describe for me a time when you had to strategically build relationships in order to achieve your goals.', 'competency', 'relationship_building', 'amex', 'medium', 'American Express competency: Show networking and strategic relationship development.', ARRAY['All'], TRUE),

('Often we can learn a lot from what others have to tell us, but criticism can be hard to take, even when someone means well. Describe a time when you made a change in your behavior based on feedback you received from your boss or a colleague.', 'competency', 'feedback_handling', 'amex', 'hard', 'American Express competency: Show openness to feedback and ability to change.', ARRAY['All'], TRUE),

('Sometimes we have to get our work done even in the face of unexpected events or major obstacles. I would like to hear about a time when you had to remain calm during stressful, unusual, or surprising circumstances or when faced with major obstacles.', 'competency', 'stress_management', 'amex', 'medium', 'American Express competency: Show resilience and composure under pressure.', ARRAY['All'], TRUE),

('Tell me about a situation in which you were able to finish a project or assignment on time, even though it was very difficult to do so.', 'competency', 'execution', 'amex', 'medium', 'American Express competency: Show determination and ability to deliver.', ARRAY['All'], TRUE),

('Please give me an example of a time when you helped a subordinate deal with a work-related issue or grow in his or her career.', 'competency', 'coaching', 'amex', 'medium', 'American Express competency: Show people development and mentoring skills.', ARRAY['Manager', 'Team Lead'], TRUE),

('Give me an example of a disagreement that you helped others resolve.', 'competency', 'mediation', 'amex', 'hard', 'American Express competency: Show conflict resolution and mediation skills.', ARRAY['All'], TRUE),

('I would like to hear about an occasion when you noticed that a subordinate had a developmental issue and the steps you took to improve his or her performance.', 'competency', 'performance_management', 'amex', 'hard', 'American Express competency: Show performance management and coaching skills.', ARRAY['Manager', 'Director'], TRUE),

('I would like you to give me an example of a time when you had to interpret and translate a broader strategy or vision into more specific objectives.', 'competency', 'strategic_execution', 'amex', 'hard', 'American Express competency: Show strategic thinking and translation skills.', ARRAY['Manager', 'Director'], TRUE),

('Please give me an example of a situation in which you had to identify and integrate key issues from a large amount of information in order to make a decision or provide advice.', 'competency', 'analytical_thinking', 'amex', 'hard', 'American Express competency: Show analytical and synthesis skills.', ARRAY['All'], TRUE),

('Can you give me an example of an occasion when you set a standard that was so inspiring that it was adopted by other employees?', 'competency', 'leadership', 'amex', 'hard', 'American Express competency: Show leadership and ability to inspire others.', ARRAY['Manager', 'Director'], TRUE),

('You have been asked to lead several projects that have deadlines that are very close in time to each other. How would you prioritize your time in order to complete your deliverables?', 'competency', 'prioritization', 'amex', 'medium', 'American Express competency: Show time management and prioritization skills.', ARRAY['All'], TRUE),

('No matter how well we plan projects and strategies, unforeseen changes or obstacles come up and things do not go the way we planned. Can you give me an example of a time when your plans had to be modified to handle an unanticipated change or obstacle?', 'competency', 'adaptability', 'amex', 'medium', 'American Express competency: Show flexibility and problem-solving.', ARRAY['All'], TRUE),

('Sometimes we have clear responsibilities and goals, but very little direction for how to accomplish them. Give me an example of a time when you met your goals in spite of unclear guidelines for achieving them.', 'competency', 'self_direction', 'amex', 'hard', 'American Express competency: Show autonomy and resourcefulness.', ARRAY['All'], TRUE);

-- ============================================
-- VERIFICATION
-- ============================================

SELECT '✅ Interview Questions seed data inserted successfully!' as status;

-- Count questions by category
SELECT
  question_category,
  COUNT(*) as total_questions
FROM interview_questions
GROUP BY question_category
ORDER BY question_category;

-- Count questions by source
SELECT
  source,
  COUNT(*) as total_questions
FROM interview_questions
GROUP BY source
ORDER BY source;

-- Show total
SELECT COUNT(*) as total_questions FROM interview_questions;

-- ============================================
-- END OF SEED DATA
-- ============================================
