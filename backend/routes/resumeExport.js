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
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    } catch {
        return dateString;
    }
};

router.get('/:userId/docx', async (req, res) => {
    try {
        const { userId } = req.params;

        // Security check: Ensure authenticated user allows accessing this data
        // For now, allow users to export only their own resume
        if (req.user.id !== userId) {
            return res.status(403).json({ error: 'Unauthorized to export this resume' });
        }

        // 1. Fetch all data
        const { data: userProfile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

        const { data: user } = await supabase
            .from('users')
            .select('full_name, email, phone, linkedin_url')
            .eq('id', userId)
            .single();

        let { data: resume } = await supabase
            .from('user_resumes')
            .select('*')
            .eq('user_id', userId)
            .eq('is_master', true)
            .single();

        if (!resume) {
            const { data: anyResume } = await supabase
                .from('user_resumes')
                .select('*')
                .eq('user_id', userId)
                .limit(1)
                .maybeSingle(); // Use maybeSingle to avoid 406 error
            resume = anyResume;
        }

        // If still no resume, create a placeholder object from user profile data
        if (!resume) {
            console.log(`⚠️ No resume found for user ${userId}, using profile data as fallback`);
            resume = {
                id: null, // No ID to link work experience to
                full_name: userProfile?.full_name || user?.full_name || 'Your Name',
                email: user?.email,
                phone: userProfile?.phone || user?.phone,
                linkedin_url: userProfile?.linkedin_url || user?.linkedin_url,
                location_city: userProfile?.current_location || '',
                location_country: '',
                profile_summary: userProfile?.bio || '',
                areas_of_excellence: userProfile?.skills || []
            };
        }

        // Work Experience
        let workExperience = [];
        if (resume.id) {
            const { data: work } = await supabase
                .from('work_experience')
                .select('*, accomplishments(*)')
                .eq('resume_id', resume.id)
                .order('start_date', { ascending: false });
            workExperience = work || [];
        }

        // Education
        const { data: education } = await supabase
            .from('education')
            .select('*')
            .eq('user_id', userId)
            .order('start_date', { ascending: false });

        // Certifications
        const { data: certifications } = await supabase
            .from('certifications')
            .select('*')
            .eq('user_id', userId)
            .order('issue_date', { ascending: false });


        // 2. Generate DOCX
        const doc = new Document({
            sections: [{
                children: [
                    // --- HEADER ---
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                            new TextRun({
                                text: (resume.full_name || user?.full_name || userProfile?.full_name || 'Your Name').toUpperCase(),
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
                                    resume.location_city ? `${resume.location_city}, ${resume.location_country || ''}` : null,
                                    resume.phone || user?.phone,
                                    resume.email || user?.email,
                                    resume.linkedin_url || user?.linkedin_url
                                ].filter(Boolean).join(' | '),
                                size: 22, // 11pt
                                font: 'Calibri'
                            })
                        ],
                        spacing: { after: 300 },
                        border: { bottom: { color: "000000", space: 10, style: BorderStyle.SINGLE, size: 6 } }
                    }),

                    // --- PROFESSIONAL SUMMARY ---
                    new Paragraph({
                        heading: HeadingLevel.HEADING_2,
                        children: [new TextRun({ text: 'PROFESSIONAL SUMMARY', bold: true, size: 24, font: 'Calibri' })],
                        spacing: { before: 200, after: 100 },
                        border: { bottom: { color: "000000", space: 1, style: BorderStyle.SINGLE, size: 6 } }
                    }),
                    new Paragraph({
                        children: [new TextRun({
                            text: resume.profile_summary || '[Professional Summary goes here. Describe your career overview and key achievements.]',
                            size: 22,
                            font: 'Calibri',
                            italics: !resume.profile_summary
                        })],
                        alignment: AlignmentType.JUSTIFIED,
                        spacing: { after: 300 }
                    }),

                    // --- AREAS OF EXCELLENCE ---
                    new Paragraph({
                        heading: HeadingLevel.HEADING_2,
                        children: [new TextRun({ text: 'AREAS OF EXCELLENCE', bold: true, size: 24, font: 'Calibri' })],
                        spacing: { before: 0, after: 100 },
                        border: { bottom: { color: "000000", space: 1, style: BorderStyle.SINGLE, size: 6 } }
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: (resume.areas_of_excellence && resume.areas_of_excellence.length > 0)
                                    ? resume.areas_of_excellence.join(' • ')
                                    : '[Core Competency 1] • [Core Competency 2] • [Core Competency 3] • [Skill 4] • [Skill 5]',
                                size: 22,
                                font: 'Calibri',
                                italics: !(resume.areas_of_excellence && resume.areas_of_excellence.length > 0)
                            })
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 300 }
                    }),

                    // --- PROFESSIONAL EXPERIENCE ---
                    new Paragraph({
                        heading: HeadingLevel.HEADING_2,
                        children: [new TextRun({ text: 'PROFESSIONAL EXPERIENCE', bold: true, size: 24, font: 'Calibri' })],
                        spacing: { before: 0, after: 200 },
                        border: { bottom: { color: "000000", space: 1, style: BorderStyle.SINGLE, size: 6 } }
                    }),

                    ...(workExperience && workExperience.length > 0 ?
                        workExperience.flatMap(exp => {
                            const dateRange = `${formatDate(exp.start_date)} – ${exp.is_current ? 'Present' : formatDate(exp.end_date)}`;

                            return [
                                // Company Row
                                new Paragraph({
                                    children: [
                                        new TextRun({ text: exp.company_name, bold: true, size: 22, font: 'Calibri' }),
                                        new TextRun({ text: `  |  ${exp.location_city || ''}`, size: 22, font: 'Calibri' }),
                                        new TextRun({
                                            text: `\t${dateRange}`,
                                            bold: true,
                                            size: 22,
                                            font: 'Calibri'
                                        })
                                    ],
                                    tabStops: [{ type: 'right', position: 9000 }],
                                    spacing: { before: 100 }
                                }),
                                // Job Title
                                new Paragraph({
                                    children: [
                                        new TextRun({ text: exp.job_title, italics: true, bold: true, size: 22, font: 'Calibri' })
                                    ],
                                    spacing: { after: 100 }
                                }),
                                // Scope
                                ...(exp.scope_description ? [
                                    new Paragraph({
                                        children: [new TextRun({ text: exp.scope_description, size: 22, font: 'Calibri' })],
                                        spacing: { after: 100 }
                                    })
                                ] : []),
                                // Accomplishments
                                ...(exp.accomplishments && exp.accomplishments.length > 0 ?
                                    exp.accomplishments.sort((a, b) => a.order_index - b.order_index).map(acc =>
                                        new Paragraph({
                                            children: [new TextRun({ text: acc.bullet_text, size: 22, font: 'Calibri' })],
                                            bullet: { level: 0 },
                                            spacing: { after: 50 },
                                            alignment: AlignmentType.JUSTIFIED
                                        })
                                    ) : []
                                ),
                                new Paragraph({ text: "", spacing: { after: 200 } })
                            ]
                        }) : [
                            // Placeholder for Experience
                            new Paragraph({
                                children: [
                                    new TextRun({ text: 'Company Name', bold: true, size: 22, font: 'Calibri', italics: true }),
                                    new TextRun({ text: '  |  City, State', size: 22, font: 'Calibri', italics: true }),
                                    new TextRun({
                                        text: `\tMM/YYYY – Present`,
                                        bold: true,
                                        size: 22,
                                        font: 'Calibri',
                                        italics: true
                                    })
                                ],
                                tabStops: [{ type: 'right', position: 9000 }],
                                spacing: { before: 100 }
                            }),
                            new Paragraph({
                                children: [new TextRun({ text: 'Job Title', italics: true, bold: true, size: 22, font: 'Calibri' })],
                                spacing: { after: 100 }
                            }),
                            new Paragraph({
                                children: [new TextRun({ text: '[Description of your role and responsibilities]', size: 22, font: 'Calibri', italics: true })],
                                bullet: { level: 0 },
                                spacing: { after: 50 }
                            }),
                            new Paragraph({
                                children: [new TextRun({ text: '[Key Achievement or Impact 1]', size: 22, font: 'Calibri', italics: true })],
                                bullet: { level: 0 },
                                spacing: { after: 50 }
                            }),
                            new Paragraph({ text: "", spacing: { after: 200 } })
                        ]
                    ),


                    // --- EDUCATION ---
                    new Paragraph({
                        heading: HeadingLevel.HEADING_2,
                        children: [new TextRun({ text: 'EDUCATION', bold: true, size: 24, font: 'Calibri' })],
                        spacing: { before: 100, after: 200 },
                        border: { bottom: { color: "000000", space: 1, style: BorderStyle.SINGLE, size: 6 } }
                    }),

                    ...(education && education.length > 0 ?
                        education.flatMap(edu => [
                            new Paragraph({
                                children: [
                                    new TextRun({ text: edu.institution, bold: true, size: 22, font: 'Calibri' }),
                                    new TextRun({ text: `\t${edu.location_city || ''}`, size: 22, font: 'Calibri' })
                                ],
                                tabStops: [{ type: 'right', position: 9000 }],
                            }),
                            new Paragraph({
                                children: [
                                    new TextRun({ text: `${edu.degree} in ${edu.field_of_study}`, size: 22, font: 'Calibri' }),
                                    new TextRun({ text: `\t${edu.graduation_year || ''}`, size: 22, font: 'Calibri' })
                                ],
                                tabStops: [{ type: 'right', position: 9000 }],
                                spacing: { after: 200 }
                            })
                        ]) : [
                            // Placeholder for Education
                            new Paragraph({
                                children: [
                                    new TextRun({ text: 'University Name', bold: true, size: 22, font: 'Calibri', italics: true }),
                                    new TextRun({ text: `\tCity, State`, size: 22, font: 'Calibri', italics: true })
                                ],
                                tabStops: [{ type: 'right', position: 9000 }],
                            }),
                            new Paragraph({
                                children: [
                                    new TextRun({ text: `Bachelor of Science in [Major]`, size: 22, font: 'Calibri', italics: true }),
                                    new TextRun({ text: `\tYYYY`, size: 22, font: 'Calibri', italics: true })
                                ],
                                tabStops: [{ type: 'right', position: 9000 }],
                                spacing: { after: 200 }
                            })
                        ]
                    ),


                    // --- CERTIFICATIONS ---
                    new Paragraph({
                        heading: HeadingLevel.HEADING_2,
                        children: [new TextRun({ text: 'CERTIFICATIONS', bold: true, size: 24, font: 'Calibri' })],
                        spacing: { before: 100, after: 200 },
                        border: { bottom: { color: "000000", space: 1, style: BorderStyle.SINGLE, size: 6 } }
                    }),

                    ...(certifications && certifications.length > 0 ?
                        certifications.map(cert =>
                            new Paragraph({
                                children: [
                                    new TextRun({ text: cert.name, bold: true, size: 22, font: 'Calibri' }),
                                    new TextRun({ text: ` — ${cert.issuing_organization}`, size: 22, font: 'Calibri' }),
                                    new TextRun({ text: `\t${cert.year || cert.issue_date || ''}`, size: 22, font: 'Calibri' })
                                ],
                                tabStops: [{ type: 'right', position: 9000 }],
                                spacing: { after: 100 }
                            })
                        ) : [
                            // Placeholder for Certifications
                            new Paragraph({
                                children: [
                                    new TextRun({ text: '[Certification Name]', bold: true, size: 22, font: 'Calibri', italics: true }),
                                    new TextRun({ text: ` — [Issuing Organization]`, size: 22, font: 'Calibri', italics: true }),
                                    new TextRun({ text: `\tYYYY`, size: 22, font: 'Calibri', italics: true })
                                ],
                                tabStops: [{ type: 'right', position: 9000 }],
                                spacing: { after: 100 }
                            })
                        ]
                    )

                ]
            }]
        });

        const buffer = await Packer.toBuffer(doc);

        const filename = (resume.full_name || 'Resume').replace(/[^a-z0-9]/gi, '_').toLowerCase();

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}_resume.docx"`);
        res.send(buffer);

    } catch (error) {
        console.error('Error handling DOCX export:', error);
        res.status(500).json({ error: 'Failed to generate DOCX' });
    }
});

export default router;
