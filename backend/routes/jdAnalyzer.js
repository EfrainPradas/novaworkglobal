import express from 'express';
import OpenAI from 'openai';

const router = express.Router();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Helper function to extract keywords from JD
async function extractKeywordsFromJD(jobDescription) {
  try {
    const prompt = `
Analiza esta descripción de trabajo y extrae las 15 palabras clave más importantes para optimizar un resume.

Job Description:
${jobDescription}

Clasifica cada palabra clave en estas categorías:
- skill: Habilidades técnicas específicas
- soft_skill: Habilidades interpersonales
- technical: Conocimientos técnicos
- certification: Certificaciones requeridas
- experience: Nivel de experiencia
- industry: Términos de la industria

Asigna una prioridad (high/medium/low) y sugiere dónde debería ir en el resume:
- profile: Perfil profesional
- skills: Sección de habilidades
- accomplishments: Logros
- work_experience: Experiencia laboral

Responde en formato JSON con la siguiente estructura:
[
  {
    "keyword": "palabra clave",
    "category": "skill|soft_skill|technical|certification|experience|industry",
    "priority": "high|medium|low",
    "whereItGoes": "profile|skills|accomplishments|work_experience"
  }
]
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Eres un experto en reclutamiento y optimización de resumes. Extrae las palabras clave más importantes de las descripciones de trabajo."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1000
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Try to parse JSON response
    try {
      const keywords = JSON.parse(content);
      return keywords;
    } catch (parseError) {
      // If direct parsing fails, try to extract JSON from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('Failed to parse keywords from response');
    }
  } catch (error) {
    console.error('Error extracting keywords:', error);
    throw error;
  }
}

// Helper function to analyze resume match
async function analyzeResumeMatch(keywords, resumeData) {
  try {
    // Create a formatted resume text for AI analysis
    const resumeText = formatResumeForAnalysis(resumeData);

    // Use AI to perform semantic matching instead of exact text matching
    const matchAnalysis = await performSemanticMatching(keywords, resumeText);

    return matchAnalysis;
  } catch (error) {
    console.error('Error analyzing resume match:', error);
    throw error;
  }
}

// Format resume data into readable text for AI analysis
function formatResumeForAnalysis(resumeData) {
  const sections = [];

  // Profile summary
  if (resumeData.profile_summary) {
    sections.push(`PROFILE SUMMARY:\n${resumeData.profile_summary}`);
  }

  // Areas of excellence
  if (resumeData.areas_of_excellence && resumeData.areas_of_excellence.length > 0) {
    sections.push(`AREAS OF EXCELLENCE:\n${resumeData.areas_of_excellence.join(', ')}`);
  }

  // Work experience
  if (resumeData.work_experience && resumeData.work_experience.length > 0) {
    sections.push('WORK EXPERIENCE:');
    resumeData.work_experience.forEach(job => {
      sections.push(`- ${job.job_title} at ${job.company_name}`);
      if (job.scope_description) {
        sections.push(`  ${job.scope_description}`);
      }
    });
  }

  // PAR stories (accomplishments)
  if (resumeData.par_stories && resumeData.par_stories.length > 0) {
    sections.push('ACCOMPLISHMENTS:');
    resumeData.par_stories.forEach(story => {
      sections.push(`- Problem: ${story.problem_challenge}`);
      sections.push(`- Actions: ${Array.isArray(story.actions) ? story.actions.join(', ') : story.actions}`);
      sections.push(`- Result: ${story.result}`);
    });
  }

  // User info skills (if available)
  if (resumeData.user_info) {
    // Note: skills would typically be in a separate field, but we include what we have
    sections.push(`ADDITIONAL INFO:\n${JSON.stringify(resumeData.user_info)}`);
  }

  return sections.join('\n\n');
}

// Perform semantic matching using AI
async function performSemanticMatching(keywords, resumeText) {
  try {
    const keywordsList = keywords.map(k => k.keyword).join(', ');

    const prompt = `
Analiza el siguiente resume y determina si las habilidades y experiencias descritas coinciden con cada palabra clave requerida.

Resume del candidato:
${resumeText}

Palabras clave a evaluar:
${keywordsList}

Para cada palabra clave, determina si el candidato tiene experiencia o habilidades DEMOSTRADAS que coincidan con el requisito.
Usa coincidencia semántica, no solo textual. Por ejemplo:
- "Gestión de proyectos" coincide con "Project Management"
- "Análisis de datos" coincide con "Data Analysis"
- "Creación de dashboards" coincide con "Dashboard creation"
- "Procesos ETL" coincide con "ETL processes"

Responde en formato JSON exactamente con esta estructura:
[
  {
    "keyword": "palabra clave exacta",
    "category": "categoría exacta",
    "priority": "prioridad exacta",
    "whereItGoes": "ubicación exacta",
    "currentMatch": true/false,
    "matchReason": "breve explicación de por qué coincide o no"
  }
]

Solo devuelve el JSON, sin texto adicional.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Eres un experto en reclutamiento y análisis de resumes. Evalúa si las habilidades y experiencias de un candidato coinciden con los requisitos del puesto, usando análisis semántico más que coincidencia exacta de texto."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.1, // Low temperature for consistent analysis
      max_tokens: 2000
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No response from OpenAI for semantic matching');
    }

    // Try to parse JSON response
    let matchedKeywords;
    try {
      matchedKeywords = JSON.parse(content);
    } catch (parseError) {
      // If direct parsing fails, try to extract JSON from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        matchedKeywords = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse semantic matching results');
      }
    }

    // Validate we got results for all keywords
    if (matchedKeywords.length !== keywords.length) {
      console.warn(`Warning: Expected ${keywords.length} keywords, got ${matchedKeywords.length} results`);
    }

    // Calculate match score based on AI analysis
    const totalKeywords = matchedKeywords.length;
    const matchedCount = matchedKeywords.filter(k => k.currentMatch).length;
    const matchScore = Math.round((matchedCount / totalKeywords) * 100);

    console.log('🧠 Semantic matching results:');
    matchedKeywords.forEach(kw => {
      console.log(`- ${kw.keyword}: match=${kw.currentMatch}, reason=${kw.matchReason || 'No reason provided'}`);
    });

    return {
      keywords: matchedKeywords,
      matchScore
    };

  } catch (error) {
    console.error('Error in semantic matching:', error);

    // Fallback to simple text matching if AI fails
    console.log('Falling back to simple text matching...');
    const resumeTextLower = JSON.stringify(resumeData).toLowerCase();

    const keywordsWithMatch = keywords.map(keyword => ({
      ...keyword,
      currentMatch: resumeTextLower.includes(keyword.keyword.toLowerCase()),
      matchReason: resumeTextLower.includes(keyword.keyword.toLowerCase()) ?
        'Simple text match (fallback)' : 'No match found (fallback)'
    }));

    const matchedCount = keywordsWithMatch.filter(k => k.currentMatch).length;
    const matchScore = Math.round((matchedCount / keywordsWithMatch.length) * 100);

    console.log('🔍 Fallback results:');
    keywordsWithMatch.forEach(kw => {
      console.log(`- ${kw.keyword}: match=${kw.currentMatch}, reason=${kw.matchReason}`);
    });

    return {
      keywords: keywordsWithMatch,
      matchScore
    };
  }
}

// POST /api/jd-analyzer/analyze
router.post('/analyze', async (req, res) => {
  try {
    const { jobDescription, userResume } = req.body;

    if (!jobDescription || !userResume) {
      return res.status(400).json({
        error: 'Missing required fields: jobDescription and userResume'
      });
    }

    // Extract keywords from job description
    const keywords = await extractKeywordsFromJD(jobDescription);

    // Analyze resume match
    const matchAnalysis = await analyzeResumeMatch(keywords, userResume);

    res.json({
      success: true,
      keywords: matchAnalysis.keywords,
      matchScore: matchAnalysis.matchScore
    });

  } catch (error) {
    console.error('Error in JD analysis:', error);
    res.status(500).json({
      error: 'Failed to analyze job description',
      details: error.message
    });
  }
});

// GET /api/jd-analyzer/health
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'JD Analyzer',
    openaiConfigured: !!process.env.OPENAI_API_KEY
  });
});

export default router;