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
        console.log(`📄 Starting DOCX export for user ${userId}`);

        const { data: userProfile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

        const { data: user } = await supabase
            .from('users')
            .select('full_name, email, phone, linkedin_url')
            .eq('id', userId)
            .maybeSingle();

        let { data: resume, error: resumeError } = await supabase
            .from('user_resumes')
            .select('*')
            .eq('user_id', userId)
            .eq('is_master', true)
            .maybeSingle();

        if (resumeError) {
            console.error('❌ Error fetching master resume:', resumeError);
        }

        if (!resume) {
            console.log(`⚠️ No master resume found for user ${userId}, trying fallback`);
            const { data: anyResume } = await supabase
                .from('user_resumes')
                .select('*')
                .eq('user_id', userId)
                .limit(1)
                .maybeSingle();
            resume = anyResume;
        }

        // If still no resume, create a placeholder object from user profile data
        if (!resume) {
            console.log(`⚠️ No resume found for user ${userId}, using profile data as fallback`);
            resume = {
                id: null,
                full_name: userProfile?.full_name || user?.full_name || 'Your Name',
                email: user?.email || '',
                phone: userProfile?.phone || user?.phone || '',
                linkedin_url: userProfile?.linkedin_url || user?.linkedin_url || '',
                location_city: userProfile?.current_location || '',
                location_country: '',
                profile_summary: userProfile?.bio || '',
                areas_of_excellence: userProfile?.skills || []
            };
        }

        console.log(`✅ Resume data loaded (ID: ${resume.id || 'placeholder'})`);

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

        // Accomps for Functional Resume
        let functionalGroupData = [];
        if (resume.resume_type === 'functional') {
            const { groupId } = req.query;
            if (groupId) {
                const { data: groupReq } = await supabase
                    .from('saved_accomplishment_groups')
                    .select('grouped_data')
                    .eq('id', groupId)
                    .eq('user_id', userId)
                    .maybeSingle();
                if (groupReq && groupReq.grouped_data) {
                    functionalGroupData = groupReq.grouped_data;
                }
            } else {
                console.log(`⚠️ No groupId provided for user ${userId} functional resume`);
            }
        }

        // Education
        const { data: education } = await supabase
            .from('education')
            .select('*')
            .eq('resume_id', resume.id || null) // Use resume_id first
            .order('start_date', { ascending: false });

        // If no education under resume, fallback to user_id
        let finalEducation = education || [];
        if (finalEducation.length === 0) {
            const { data: eduFallback } = await supabase
                .from('education')
                .select('*')
                .eq('user_id', userId)
                .order('start_date', { ascending: false });
            finalEducation = eduFallback || [];
        }

        // Certifications
        const { data: certifications } = await supabase
            .from('certifications')
            .select('*')
            .eq('user_id', userId)
            .order('issue_date', { ascending: false });

        // Awards
        const { data: awards } = await supabase
            .from('awards')
            .select('*')
            .eq('user_id', userId)
            .order('issue_date', { ascending: false });

        console.log(`📊 Export stats: ${workExperience.length} work, ${finalEducation?.length || 0} edu, ${certifications?.length || 0} certs, ${awards?.length || 0} awards`);

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
                                text: String(resume.full_name || user?.full_name || userProfile?.full_name || 'Your Name')
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
                                    resume.location_city ? `${resume.location_city}${resume.location_country ? `, ${resume.location_country}` : ''}` : null,
                                    resume.phone || user?.phone || '',
                                    resume.email || user?.email || '',
                                    resume.linkedin_url || user?.linkedin_url || ''
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
                            text: String(resume.profile_summary || '[Professional Summary goes here.]'),
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
                            heading: HeadingLevel.HEADING_2,
                            children: [new TextRun({ text: 'SELECTED ACCOMPLISHMENTS', bold: true, size: 24, font: 'Calibri' })],
                            spacing: { before: 0, after: 200 },
                            border: { bottom: { color: "000000", space: 1, style: BorderStyle.SINGLE, size: 6 } }
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
                    new Paragraph({
                        heading: HeadingLevel.HEADING_2,
                        children: [new TextRun({
                            text: resume.resume_type === 'functional' ? 'PROFESSIONAL CAPABILITIES' : 'WORK EXPERIENCE',
                            bold: true, size: 24, font: 'Calibri'
                        })],
                        spacing: { before: 0, after: 200 },
                        border: { bottom: { color: "000000", space: 1, style: BorderStyle.SINGLE, size: 6 } }
                    }),

                    // --- WORK EXPERIENCE ---
                    new Paragraph({
                        heading: HeadingLevel.HEADING_2,
                        children: [new TextRun({
                            text: resume.resume_type === 'functional' ? 'PROFESSIONAL CAPABILITIES' : 'WORK EXPERIENCE',
                            bold: true, size: 24, font: 'Calibri'
                        })],
                        spacing: { before: 0, after: 200 },
                        border: { bottom: { color: "000000", space: 1, style: BorderStyle.SINGLE, size: 6 } }
                    }),

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
                                            new TextRun({ text: `${group.location_city ? ` .. ${group.location_city}` : ''}`, size: 22, font: 'Calibri' }),
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
                                            spacing: { after: 50, before: 50 }
                                        }),
                                        // Scope
                                        ...(pos.scope_description ? [
                                            new Paragraph({
                                                children: [new TextRun({ text: String(pos.scope_description), size: 22, font: 'Calibri' })],
                                                spacing: { after: 100 },
                                                alignment: AlignmentType.JUSTIFIED
                                            })
                                        ] : []),
                                        // Accomplishments
                                        ...(resume.resume_type !== 'functional' && pos.accomplishments && Array.isArray(pos.accomplishments) && pos.accomplishments.length > 0 ?
                                            pos.accomplishments.sort((a, b) => (a.order_index || 0) - (b.order_index || 0)).map(acc =>
                                                new Paragraph({
                                                    children: [new TextRun({ text: String(acc.bullet_text || ''), size: 22, font: 'Calibri' })],
                                                    bullet: { level: 0 },
                                                    spacing: { after: 30 },
                                                    alignment: AlignmentType.JUSTIFIED
                                                })
                                            ) : []
                                        )
                                    ]),
                                    new Paragraph({ text: "", spacing: { after: 200 } })
                                ];
                            });
                        })() : []
                    ),

                    // --- EDUCATION ---
                    new Paragraph({
                        heading: HeadingLevel.HEADING_2,
                        children: [new TextRun({ text: 'EDUCATION', bold: true, size: 24, font: 'Calibri' })],
                        spacing: { before: 100, after: 200 },
                        border: { bottom: { color: "000000", space: 1, style: BorderStyle.SINGLE, size: 6 } }
                    }),

                    ...(finalEducation && finalEducation.length > 0 ?
                        finalEducation.flatMap(edu => [
                            new Paragraph({
                                children: [
                                    new TextRun({ text: String(edu.institution || ''), bold: true, size: 22, font: 'Calibri' }),
                                    new TextRun({ text: `\t${edu.location_city || ''}`, size: 22, font: 'Calibri' })
                                ],
                                tabStops: [{ type: 'right', position: 9000 }],
                            }),
                            new Paragraph({
                                children: [
                                    new TextRun({ text: `${edu.degree || ''} ${edu.field_of_study ? `in ${edu.field_of_study}` : ''}`, size: 22, font: 'Calibri' }),
                                    new TextRun({ text: `\t${edu.graduation_year || ''}`, size: 22, font: 'Calibri' })
                                ],
                                tabStops: [{ type: 'right', position: 9000 }],
                                spacing: { after: 200 }
                            })
                        ]) : []
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
                                    new TextRun({ text: String(cert.name || ''), bold: true, size: 22, font: 'Calibri' }),
                                    new TextRun({ text: ` — ${cert.issuing_organization || ''}`, size: 22, font: 'Calibri' }),
                                    new TextRun({ text: `\t${cert.year || cert.issue_date || ''}`, size: 22, font: 'Calibri' })
                                ],
                                tabStops: [{ type: 'right', position: 9000 }],
                                spacing: { after: 100 }
                            })
                        ) : []
                    ),

                    // --- AWARDS ---
                    new Paragraph({
                        heading: HeadingLevel.HEADING_2,
                        children: [new TextRun({ text: 'AWARDS', bold: true, size: 24, font: 'Calibri' })],
                        spacing: { before: 100, after: 200 },
                        border: { bottom: { color: "000000", space: 1, style: BorderStyle.SINGLE, size: 6 } }
                    }),

                    ...(awards && awards.length > 0 ?
                        awards.map(award =>
                            new Paragraph({
                                children: [
                                    new TextRun({ text: String(award.certification_name || award.name || ''), bold: true, size: 22, font: 'Calibri' }),
                                    new TextRun({ text: ` — ${award.issuing_organization || ''}`, size: 22, font: 'Calibri' }),
                                    new TextRun({ text: `\t${award.issue_date ? new Date(award.issue_date).getFullYear() : ''}`, size: 22, font: 'Calibri' })
                                ],
                                tabStops: [{ type: 'right', position: 9000 }],
                                spacing: { after: 100 }
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
        const safeName = (resume.full_name || user?.full_name || 'Resume')
            .replace(/[^a-z0-9]/gi, '_')
            .split('_')
            .filter(Boolean)
            .join(' ');

        const filename = `${safeName} - Resume - ${date}.docx`;

        console.log(`📡 Sending file: ${filename}`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
        res.send(buffer);
        console.log('✨ Request completed successfully');

    } catch (error) {
        console.error('❌ Error handling DOCX export:', error);
        res.status(500).json({ error: 'Failed to generate DOCX', details: error.message });
    }
});

export default router;
