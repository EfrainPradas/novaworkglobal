import express from 'express';
import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
    AlignmentType,
    BorderStyle,
    Table,
    TableRow,
    TableCell,
    WidthType
} from 'docx';
import { supabaseAdmin as supabase } from '../services/supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Enforce authentication
router.use(requireAuth);

const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric' });
    } catch {
        return dateString;
    }
};

router.post('/:userId/docx', async (req, res) => {
    try {
        const { userId } = req.params;
        const { resumeData, groupId, functionalGroups } = req.body;

        // Security check: Ensure authenticated user allows accessing this data
        if (!req.user || req.user.id !== userId) {
            return res.status(403).json({ error: 'Unauthorized to export this resume' });
        }

        if (!resumeData) {
            return res.status(400).json({ error: 'Missing resumeData payload' });
        }

        console.log(`\n\n🟢🟢🟢 [NEW POST DOCX ENDPOINT HIT] User ID: ${userId} 🟢🟢🟢\n\n`);
        console.log(`📄 Starting direct JSON-based DOCX export for user ${userId}`);

        // 1. Map frontend data to the expected DOCX variables
        let resume = {
            id: resumeData.id || null,
            full_name: resumeData.contact?.full_name || 'Your Name',
            email: resumeData.contact?.email || '',
            phone: resumeData.contact?.phone || '',
            linkedin_url: resumeData.contact?.linkedin_url || resumeData.contact?.linkedin || '',
            location_city: resumeData.contact?.location || '',
            profile_summary: resumeData.summary || '',
            resume_type: resumeData.resume_type || 'chronological',
            areas_of_excellence: resumeData.areas_of_excellence || []
        };

        let workExperience = resumeData.work_experience || [];
        
        // Frontend sends education, certifications, awards directly
        let finalEducation = resumeData.education || [];
        let certifications = resumeData.certifications || [];
        let awards = resumeData.awards || [];

        // For Functional Resume, frontend passes functionalGroups
        let functionalGroupData = functionalGroups || [];

        console.log(`📊 Export stats: ${workExperience.length} work, ${finalEducation.length} edu, ${certifications.length} certs, ${awards.length} awards`);

        // 2. Generate DOCX
        console.log('🏗️ Creating docx document structure...');
        const doc = new Document({
            sections: [{
                children: [
                    // --- HEADER ---
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                            new TextRun({
                                text: String(resume.full_name || 'Your Name')
                                    .toLowerCase()
                                    .replace(/\b\w/g, c => c.toUpperCase()),
                                bold: true,
                                size: 32, // 16pt
                                font: 'Calibri'
                            }),
                        ],
                        spacing: { after: 100 }
                    }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                            new TextRun({
                                text: [
                                    resume.phone || '',
                                    resume.email || '',
                                    resume.linkedin_url || ''
                                ].filter(Boolean).join(' | '),
                                size: 22, // 11pt
                                font: 'Calibri'
                            })
                        ],
                        spacing: { after: 300 }
                    }),

                    // --- PROFESSIONAL SUMMARY ---
                    new Paragraph({
                        children: [new TextRun({ text: 'PROFESSIONAL SUMMARY', bold: true, size: 24, font: 'Calibri' })],
                        spacing: { before: 100, after: 50 }
                    }),
                    new Paragraph({
                        children: [new TextRun({
                            text: String(resume.profile_summary || '[Professional Summary goes here.]'),
                            size: 22,
                            font: 'Calibri',
                            italics: !resume.profile_summary
                        })],
                        alignment: AlignmentType.JUSTIFIED,
                        spacing: { after: 150 }
                    }),

                    // --- AREAS OF EXCELLENCE ---
                    new Paragraph({
                        children: [new TextRun({ text: 'AREAS OF EXCELLENCE', bold: true, size: 24, font: 'Calibri' })],
                        spacing: { before: 0, after: 50 }
                    }),
                    await (async () => {
                        // Fetch latest generated profile for skills section
                        const { data: genProfiles } = await supabase
                            .from('generated_professional_profile')
                            .select('output_skills_section')
                            .eq('user_id', userId)
                            .order('version', { ascending: false })
                            .limit(1);
                        
                        const genProfile = genProfiles?.[0];
                        let combinedSkills = [...(resume.areas_of_excellence || [])];
                        
                        if (genProfile && genProfile.output_skills_section) {
                            try {
                                const skills = typeof genProfile.output_skills_section === 'string' 
                                    ? JSON.parse(genProfile.output_skills_section) 
                                    : genProfile.output_skills_section;
                                
                                if (skills.tools_platforms?.length > 0) {
                                    combinedSkills.push(`Tools & Platforms: ${skills.tools_platforms.join(' | ')}`);
                                }
                                if (skills.methodologies?.length > 0) {
                                    combinedSkills.push(`Methodologies: ${skills.methodologies.join(' | ')}`);
                                }
                                if (skills.languages?.length > 0) {
                                    combinedSkills.push(`Languages: ${skills.languages.join(' | ')}`);
                                }
                            } catch (e) {
                                console.error('Error parsing skills for export:', e);
                            }
                        }

                        return new Paragraph({
                            children: [
                                new TextRun({
                                    text: combinedSkills.length > 0
                                        ? combinedSkills.join(' | ')
                                        : '[Skills & Competencies]',
                                    size: 22,
                                    font: 'Calibri',
                                    italics: combinedSkills.length === 0
                                })
                            ],
                            alignment: AlignmentType.CENTER,
                            spacing: { after: 300 }
                        });
                    })(),

                    // --- FUNCTIONAL: SELECTED ACCOMPLISHMENTS ---
                    ...(resume.resume_type === 'functional' && functionalGroupData.length > 0 ? [
                        new Paragraph({
                        children: [new TextRun({ text: 'SELECTED ACCOMPLISHMENTS', bold: true, size: 24, font: 'Calibri' })],
                        spacing: { before: 0, after: 200 }
                    }),
                        ...functionalGroupData.flatMap(group => {
                            const rawHeading = String(group.theme || group.groupName || 'Accomplishments').replace(/[\x00-\x09\x0B-\x0C\x0E-\x1F]/g, "");
                            const headingContent = rawHeading.trim() ? rawHeading : 'Accomplishments';

                            return [
                                new Paragraph({
                                    children: [new TextRun({ text: headingContent, bold: true, size: 22, color: "000000", font: 'Calibri' })],
                                    spacing: { before: 100, after: 100 }
                                }),
                                ...(group.accomplishments || []).map(acc => {
                                    let rawText = typeof acc === 'object' && acc !== null ? acc.text : String(acc || '');
                                    const sanitizedText = String(rawText).replace(/[\x00-\x09\x0B-\x0C\x0E-\x1F]/g, "");
                                    const bulletText = sanitizedText.trim() ? sanitizedText : ' ';

                                    return new Paragraph({
                                        children: [new TextRun({ text: bulletText, size: 22, font: 'Calibri' })],
                                        bullet: { level: 0 },
                                        spacing: { after: 50 },
                                        alignment: AlignmentType.JUSTIFIED
                                    });
                                })
                            ];
                        }),
                        new Paragraph({ text: "", spacing: { after: 200 } })
                    ] : []),

                    // --- WORK EXPERIENCE ---
                    ...(workExperience && workExperience.length > 0 ? [
                        new Paragraph({
                            children: [new TextRun({
                                text: resume.resume_type === 'functional' ? 'PROFESSIONAL CAPABILITIES' : 'WORK EXPERIENCE',
                                bold: true, size: 24, font: 'Calibri'
                            })],
                            spacing: { before: 0, after: 100 }
                        })
                    ] : []),

                    ...(workExperience && workExperience.length > 0 ?
                        (() => {
                            // Group by company
                            const grouped = workExperience.reduce((acc, exp) => {
                                const companyLower = (exp.company_name || '').trim().toLowerCase();
                                const existing = acc.find(item => (item.company_name || '').trim().toLowerCase() === companyLower);
                                
                                if (existing) {
                                    existing.positions.push(exp);
                                    if (new Date(exp.start_date) < new Date(existing.minStart)) {
                                        existing.minStart = exp.start_date;
                                    }
                                    if (exp.is_current) {
                                        existing.maxEnd = 'Present';
                                    } else if (existing.maxEnd !== 'Present') {
                                        const currentMax = new Date(existing.maxEnd);
                                        const entryEnd = new Date(exp.end_date);
                                        if (entryEnd > currentMax) existing.maxEnd = exp.end_date;
                                    }
                                } else {
                                    acc.push({
                                        company_name: exp.company_name,
                                        location_city: exp.location_city,
                                        minStart: exp.start_date,
                                        maxEnd: exp.is_current ? 'Present' : exp.end_date,
                                        positions: [exp]
                                    });
                                }
                                return acc;
                            }, []);

                            return grouped.flatMap(group => {
                                const overallDates = `${formatDate(group.minStart)} – ${group.maxEnd === 'Present' ? 'Present' : formatDate(group.maxEnd)}`;
                                
                                return [
                                    // Company Header
                                    new Paragraph({
                                        children: [
                                            new TextRun({ text: String(group.company_name || ''), bold: true, size: 22, font: 'Calibri' }),
                                            new TextRun({ text: `${group.location_city ? ` | ${group.location_city}` : ''}`, size: 22, font: 'Calibri' }),
                                            new TextRun({
                                                text: `\t${overallDates}`,
                                                bold: true,
                                                size: 22,
                                                font: 'Calibri'
                                            })
                                        ],
                                        tabStops: [{ type: 'right', position: 9000 }],
                                        spacing: { before: 100 }
                                    }),
                                    
                                    // Positions
                                    ...group.positions.sort((a, b) => {
                                        if (a.is_current && !b.is_current) return -1;
                                        if (!a.is_current && b.is_current) return 1;
                                        return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
                                    }).flatMap(pos => [
                                        // Job Title
                                        new Paragraph({
                                            children: [
                                                new TextRun({
                                                    text: String(pos.job_title || ''),
                                                    bold: true,
                                                    underline: { color: "000000", style: BorderStyle.SINGLE },
                                                    size: 22,
                                                    font: 'Calibri'
                                                }),
                                                ...(group.positions.length > 1 ? [
                                                    new TextRun({
                                                        text: ` (${formatDate(pos.start_date)} – ${pos.is_current ? 'Present' : formatDate(pos.end_date)})`,
                                                        size: 20,
                                                        font: 'Calibri',
                                                        color: "666666"
                                                    })
                                                ] : [])
                                            ],
                                            spacing: { after: 25, before: 25 }
                                        }),
                                        // Scope
                                        ...(pos.scope_description ? [
                                            new Paragraph({
                                                children: [new TextRun({ text: String(pos.scope_description), size: 22, font: 'Calibri' })],
                                                spacing: { after: 50 },
                                                alignment: AlignmentType.JUSTIFIED
                                            })
                                        ] : []),
                                        // Accomplishments
                                        ...(resume.resume_type !== 'functional' && pos.accomplishments && Array.isArray(pos.accomplishments) && pos.accomplishments.length > 0 ?
                                            pos.accomplishments.sort((a, b) => (a.order_index || 0) - (b.order_index || 0)).map(acc =>
                                                new Paragraph({
                                                    children: [new TextRun({ text: String(acc.bullet_text || ''), size: 22, font: 'Calibri' })],
                                                    bullet: { level: 0 },
                                                    spacing: { after: 15 },
                                                    alignment: AlignmentType.JUSTIFIED
                                                })
                                            ) : []
                                        )
                                    ]),
                                    new Paragraph({ text: "", spacing: { after: 100 } })
                                ];
                            });
                        })() : []
                    ),

                    // --- EDUCATION ---
                    ...(finalEducation && finalEducation.length > 0 ? [
                        new Paragraph({
                            children: [new TextRun({ text: 'EDUCATION', bold: true, size: 24, font: 'Calibri' })],
                            spacing: { before: 100, after: 100 }
                        })
                    ] : []),

                    ...(finalEducation && finalEducation.length > 0 ?
                        finalEducation.flatMap(edu => [
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: String(edu.institution || edu.institution_name || ''),
                                        bold: true, size: 22, font: 'Calibri'
                                    }),
                                    new TextRun({
                                        text: `\t${edu.location_city || edu.location || ''}`,
                                        size: 22, font: 'Calibri'
                                    })
                                ],
                                tabStops: [{ type: 'right', position: 9000 }],
                            }),
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: `${edu.degree_title || edu.degree_type || edu.degree || ''} ${edu.field_of_study ? `in ${edu.field_of_study}` : ''}`,
                                        size: 22, font: 'Calibri'
                                    }),
                                    new TextRun({
                                        text: `\t${edu.graduation_year || edu.year || ''}`,
                                        size: 22, font: 'Calibri'
                                    })
                                ],
                                tabStops: [{ type: 'right', position: 9000 }],
                                spacing: { after: 100 }
                            })
                        ]) : []
                    ),

                    // --- CERTIFICATIONS ---
                    ...(certifications && certifications.length > 0 ? [
                        new Paragraph({
                            children: [new TextRun({ text: 'CERTIFICATIONS', bold: true, size: 24, font: 'Calibri' })],
                            spacing: { before: 100, after: 100 }
                        })
                    ] : []),

                    ...(certifications && certifications.length > 0 ?
                        certifications.map(cert =>
                            new Paragraph({
                                children: [
                                    new TextRun({ text: String(cert.certification_name || cert.name || ''), bold: true, size: 22, font: 'Calibri' }),
                                    new TextRun({ text: ` — ${cert.issuing_organization || ''}`, size: 22, font: 'Calibri' }),
                                    new TextRun({ text: `\t${cert.issue_date || cert.year || ''}`, size: 22, font: 'Calibri' })
                                ],
                                tabStops: [{ type: 'right', position: 9000 }],
                                spacing: { after: 50 }
                            })
                        ) : []
                    ),

                    // --- AWARDS ---
                    ...(awards && awards.length > 0 ? [
                        new Paragraph({
                            children: [new TextRun({ text: 'AWARDS', bold: true, size: 24, font: 'Calibri' })],
                            spacing: { before: 100, after: 100 }
                        })
                    ] : []),

                    ...(awards && awards.length > 0 ?
                        awards.map(award =>
                            new Paragraph({
                                children: [
                                    new TextRun({ text: String(award.certification_name || award.name || ''), bold: true, size: 22, font: 'Calibri' }),
                                    new TextRun({ text: ` — ${award.issuing_organization || ''}`, size: 22, font: 'Calibri' }),
                                    new TextRun({ text: `\t${award.issue_date ? new Date(award.issue_date).getFullYear() : ''}`, size: 22, font: 'Calibri' })
                                ],
                                tabStops: [{ type: 'right', position: 9000 }],
                                spacing: { after: 50 }
                            })
                        ) : []
                    )
                ]
            }]
        });

        console.log('📦 Packing document into buffer...');
        const buffer = await Packer.toBuffer(doc);
        console.log(`✅ Buffer generated (${buffer.length} bytes)`);

        // Generate a user-friendly filename: Full Name - Resume - Date
        const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const safeName = (resume.full_name || 'Resume')
            .replace(/[^a-z0-9]/gi, '_')
            .split('_')
            .filter(Boolean)
            .join(' ');

        const filename = `${safeName} - Resume - ${date}.docx`;

        console.log(`📡 Sending file: ${filename}`);
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
        res.send(buffer);
        console.log('✨ Request completed successfully');

    } catch (error) {
        console.error('❌ Error handling DOCX export:', error);
        import('fs').then(fs => fs.writeFileSync('docx_error.txt', error.stack || String(error)));
        res.status(500).json({ error: 'Failed to generate DOCX', details: error.message });
    }
});

export default router;
