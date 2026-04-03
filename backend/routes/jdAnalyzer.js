import express from 'express';
import OpenAI from 'openai';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
} from 'docx';

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
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Eres un experto en reclutamiento y análisis de resumes. Evalúa si las habilidades y experiencias de un candidato coinciden con los requisitos del puesto."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 2000
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No response from OpenAI');
    }

    let matchedKeywords;
    try {
      matchedKeywords = JSON.parse(content);
    } catch (parseError) {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        matchedKeywords = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse response');
      }
    }

    const totalKeywords = matchedKeywords.length;
    const matchedCount = matchedKeywords.filter(k => k.currentMatch).length;
    const matchScore = totalKeywords > 0 ? Math.round((matchedCount / totalKeywords) * 100) : 0;

    return {
      keywords: matchedKeywords,
      matchScore
    };

  } catch (error) {
    console.error('Error in semantic matching:', error);
    return {
      keywords: keywords.map(k => ({ ...k, currentMatch: false, matchReason: 'Analysis failed' })),
      matchScore: 0
    };
  }
}

// POST /api/jd-analyzer/analyze
router.post('/analyze', async (req, res) => {
  try {
    const { jobDescription, userResume } = req.body;

    if (!jobDescription || !userResume) {
      return res.status(400).json({
        error: 'Missing required fields'
      });
    }

    const keywords = await extractKeywordsFromJD(jobDescription);
    const matchAnalysis = await analyzeResumeMatch(keywords, userResume);

    res.json({
      success: true,
      keywords: matchAnalysis.keywords,
      matchScore: matchAnalysis.matchScore
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/jd-analyzer/export
router.post('/export', async (req, res) => {
  try {
    const { resumeData } = req.body;

    if (!resumeData) {
      return res.status(400).json({ error: 'Missing resume data' });
    }

    const { user_info, profile_summary, areas_of_excellence, work_experience = [], format_type = 'chronological', education = [], certifications = [], awards = [] } = resumeData;

    const doc = new Document({
      styles: {
        default: {
          document: {
            run: {
              font: 'Calibri',
              size: 22,  // 11pt
            },
            paragraph: {
              spacing: { line: 276, before: 0, after: 0 },  // 1.15 line spacing (240=single, 276=1.15)
            }
          }
        }
      },
      sections: [{
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: (user_info?.full_name || 'Your Name').trim(),
                bold: true,
                size: 32,
                font: 'Calibri'
              }),
            ],
          }),
          // ... Header: Contact Info ...
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 40, after: 80 },
            children: [
              new TextRun({
                text: [
                  user_info?.location_city && user_info?.location_country ? `${user_info.location_city}, ${user_info.location_country}` : null,
                  user_info?.phone,
                  user_info?.email,
                  user_info?.linkedin_url || null
                ].filter(Boolean).join('  •  '),
                size: 20,
                font: 'Calibri'
              }),
            ],
          }),
          // ... rest of sections ...
          new Paragraph({
            spacing: { before: 120, after: 40 },
            children: [new TextRun({ text: 'PROFESSIONAL PROFILE', bold: true, size: 24, font: 'Calibri' })]
          }),
          new Paragraph({
            spacing: { before: 40, after: 40 },
            children: [
              new TextRun({
                text: profile_summary || 'N/A',
                size: 22,
                font: 'Calibri'
              }),
            ],
          }),
          new Paragraph({
            spacing: { before: 120, after: 40 },
            children: [new TextRun({ text: 'AREAS OF EXCELLENCE', bold: true, size: 24, font: 'Calibri' })]
          }),
          new Paragraph({
            spacing: { before: 40, after: 40 },
            children: [
              new TextRun({
                text: (areas_of_excellence || []).join('  |  '),
                size: 22,
                font: 'Calibri'
              }),
            ],
          }),
          new Paragraph({
            spacing: { before: 120, after: 40 },
            children: [new TextRun({ text: 'WORK HISTORY', bold: true, size: 24, font: 'Calibri' })]
          }),
          ...(work_experience || []).flatMap((exp, expIdx) => {
            const startYear = (exp.start_date || '').replace(/^(\d{2})\/(\d{4})$/, '$2').replace(/^(\d{4}).*/, '$1')
            const endYear = exp.is_current ? 'Present' : (exp.end_date || '').replace(/^(\d{2})\/(\d{4})$/, '$2').replace(/^(\d{4}).*/, '$1')
            const dateRange = startYear && endYear ? `${startYear} – ${endYear}` : (startYear || endYear || '')

            const paragraphs = [
              // Job Title + Date (tab-aligned right)
              new Paragraph({
                spacing: { before: 120 },
                children: [
                  new TextRun({ text: exp.job_title || 'Untitled Role', bold: true, size: 22, font: 'Calibri' }),
                  new TextRun({ text: `\t${dateRange}`, bold: true, size: 22, font: 'Calibri' })
                ],
                tabStops: [{ type: 'right', position: 9000 }]
              }),
              // Company name
              new Paragraph({
                spacing: { after: 20 },
                children: [new TextRun({ text: exp.company_name || '', bold: true, color: '333333', size: 22, font: 'Calibri' })]
              })
            ];

            // Scope description paragraph (chronological only)
            if (format_type !== 'functional' && exp.scope_description) {
              paragraphs.push(
                new Paragraph({
                  spacing: { after: 20 },
                  children: [new TextRun({ text: exp.scope_description, size: 22, font: 'Calibri' })],
                  alignment: AlignmentType.JUSTIFIED
                })
              );
            }

            // Add accomplishment bullets for THIS job
            const accomplishments = exp.accomplishments || []
            if (accomplishments.length > 0) {
              accomplishments.forEach(acc => {
                if (acc.bullet_text) {
                  paragraphs.push(
                    new Paragraph({
                      bullet: { level: 0 },
                      spacing: { after: 60 },
                      children: [new TextRun({ text: acc.bullet_text, size: 22, font: 'Calibri' })],
                      alignment: AlignmentType.JUSTIFIED
                    })
                  )
                }
              })
            }

            // Spacing after each job block
            paragraphs.push(new Paragraph({ spacing: { after: 40 }, children: [] }))

            return paragraphs;
          }),
          ...(education.length > 0 ? [
            new Paragraph({
              spacing: { before: 120, after: 40 },
              children: [new TextRun({ text: 'EDUCATION', bold: true, size: 24, font: 'Calibri' })]
            }),
            ...education.flatMap(edu => [
              new Paragraph({
                spacing: { before: 150 },
                tabStops: [{ type: 'right', position: 9000 }],
                children: [
                  new TextRun({ text: `${edu.degree_type || ''}${edu.degree_type && edu.field_of_study ? ' in ' : ''}${edu.field_of_study || ''}`, bold: true, size: 22, font: 'Calibri' }),
                  new TextRun({ text: `\t${edu.graduation_year || ''}`, size: 22, font: 'Calibri' })
                ]
              }),
              new Paragraph({
                children: [new TextRun({ text: edu.institution_name || '', size: 22, font: 'Calibri', color: '333333' })]
              }),
              ...(edu.gpa ? [new Paragraph({ children: [new TextRun({ text: `GPA: ${edu.gpa}`, size: 20, font: 'Calibri', color: '666666' })] })] : []),
              ...(edu.honors ? [new Paragraph({ children: [new TextRun({ text: edu.honors, size: 20, font: 'Calibri', color: '666666' })] })] : []),
              new Paragraph({ spacing: { after: 100 }, children: [] })
            ])
          ] : []),
          ...(certifications.length > 0 ? [
            new Paragraph({
              spacing: { before: 120, after: 40 },
              children: [new TextRun({ text: 'CERTIFICATIONS', bold: true, size: 24, font: 'Calibri' })]
            }),
            ...certifications.map(cert => new Paragraph({
              spacing: { before: 80, after: 80 },
              children: [
                new TextRun({ text: cert.certification_name || cert.name || '', bold: true, size: 22, font: 'Calibri' }),
                new TextRun({ text: cert.issuing_organization ? ` — ${cert.issuing_organization}` : '', size: 22, font: 'Calibri' }),
                new TextRun({ text: cert.issue_date ? ` (${new Date(cert.issue_date).getFullYear()})` : '', size: 22, font: 'Calibri', color: '666666' })
              ]
            }))
          ] : []),
          ...(awards.length > 0 ? [
            new Paragraph({
              spacing: { before: 120, after: 40 },
              children: [new TextRun({ text: 'AWARDS & HONORS', bold: true, size: 24, font: 'Calibri' })]
            }),
            ...awards.map(award => new Paragraph({
              spacing: { before: 80, after: 80 },
              children: [
                new TextRun({ text: award.certification_name || award.name || '', bold: true, size: 22, font: 'Calibri' }),
                new TextRun({ text: award.issuing_organization ? ` — ${award.issuing_organization}` : '', size: 22, font: 'Calibri' }),
                new TextRun({ text: award.issue_date ? ` (${new Date(award.issue_date).getFullYear()})` : '', size: 22, font: 'Calibri', color: '666666' })
              ]
            }))
          ] : []),
        ]
      }]
    });

    const buffer = await Packer.toBuffer(doc);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename=Tailored_Resume.docx`);
    res.send(buffer);

  } catch (error) {
    console.error('Error generating docx:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'JD Analyzer',
    openaiConfigured: !!process.env.OPENAI_API_KEY
  });
});

export default router;