/**
 * ResumeDocument — pure renderer for the chronological resume paper.
 *
 * Replicates the exact layout used in ResumeFinalPreview.tsx so the Smart
 * Matches tailored drawer and the main preview never drift. Takes a
 * `resumeData` object and renders only — no data fetching, no editing.
 *
 * To tailor, pass a `resumeData` with an overridden `summary` (or any other
 * field). Use `showFunctional={true}` to opt in to the functional layout.
 */

import type { ResumeData } from '../../services/resumeLoader'

interface ResumeDocumentProps {
  resumeData: ResumeData
  presentLabel?: string
}

const pageStyle: React.CSSProperties = {
  fontFamily: "'Times New Roman', Times, serif",
  fontSize: '10.5pt',
  lineHeight: '1.35',
  color: '#000000',
  backgroundColor: '#fff',
  maxWidth: '21cm',
  margin: '0 auto',
  padding: '1.1cm 1.3cm',
}

const sectionTitle: React.CSSProperties = {
  fontWeight: 'bold',
  fontSize: '10.5pt',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: '5px',
  marginTop: '10px',
}

const subSectionTitle: React.CSSProperties = {
  fontWeight: 600,
  fontSize: '10pt',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: '4px',
  marginTop: '8px',
  color: '#000000',
}

function formatDate(dateString: string | undefined | null, isCurrent: boolean, presentLabel = 'Present'): string {
  if (isCurrent) return presentLabel
  if (!dateString) return ''
  if (dateString.length === 4) return dateString
  try {
    return new Date(dateString).toLocaleDateString(undefined, { year: 'numeric' })
  } catch {
    return dateString
  }
}

function titleCase(name: string): string {
  return (name || '').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

export default function ResumeDocument({ resumeData, presentLabel = 'Present' }: ResumeDocumentProps) {
  const { contact, summary, areas_of_excellence, skills_section, work_experience, education, certifications, awards, resume_type } = resumeData

  const areasMerged = [
    ...(areas_of_excellence || []),
    skills_section?.tools_platforms && skills_section.tools_platforms.length > 0
      ? `Tools & Platforms: ${skills_section.tools_platforms.join(' | ')}`
      : null,
    skills_section?.methodologies && skills_section.methodologies.length > 0
      ? `Methodologies: ${skills_section.methodologies.join(' | ')}`
      : null,
    skills_section?.languages && skills_section.languages.length > 0
      ? `Languages: ${skills_section.languages.join(' | ')}`
      : null,
  ]
    .filter(Boolean)
    .join(' | ')

  const grouped = (work_experience || []).reduce((acc: any[], exp: any) => {
    const companyLower = (exp.company_name || '').trim().toLowerCase()
    const existing = acc.find((item) => (item.company_name || '').trim().toLowerCase() === companyLower)
    if (existing) {
      existing.positions.push(exp)
      if (exp.start_date && new Date(exp.start_date) < new Date(existing.minStart)) {
        existing.minStart = exp.start_date
      }
      if (exp.is_current) {
        existing.maxEnd = 'Present'
        existing.isCurrent = true
      } else if (existing.maxEnd !== 'Present' && exp.end_date) {
        const currentMax = new Date(existing.maxEnd)
        const entryEnd = new Date(exp.end_date)
        if (entryEnd > currentMax) existing.maxEnd = exp.end_date
      }
    } else {
      acc.push({
        company_name: exp.company_name,
        location_city: exp.location_city,
        minStart: exp.start_date,
        maxEnd: exp.is_current ? 'Present' : exp.end_date,
        isCurrent: exp.is_current,
        positions: [exp],
      })
    }
    return acc
  }, [])

  return (
    <div style={pageStyle}>
      {/* NAME & CONTACT */}
      <div style={{ textAlign: 'center', marginBottom: '10px' }}>
        <div style={{ fontSize: '18pt', fontWeight: 'bold', letterSpacing: '0.04em', marginBottom: '3px' }}>
          {titleCase(contact.full_name || '')}
        </div>
        <div style={{ fontSize: '9.5pt', color: '#111', display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {contact.phone && <span>{contact.phone}</span>}
          {contact.email && <span>• {contact.email}</span>}
          {contact.linkedin && <span>• LinkedIn</span>}
        </div>
      </div>

      {/* PROFESSIONAL SUMMARY */}
      {summary && (
        <div style={{ marginBottom: '8px' }}>
          <div style={sectionTitle}>Professional Summary</div>
          <p style={{ fontSize: '10pt', textAlign: 'justify', margin: 0 }}>{summary}</p>
        </div>
      )}

      {/* AREAS OF EXCELLENCE */}
      {areasMerged && (
        <div style={{ marginBottom: '8px' }}>
          <div style={subSectionTitle}>Areas of Excellence</div>
          <p style={{ fontSize: '9.5pt', textAlign: 'center', margin: 0 }}>{areasMerged}</p>
        </div>
      )}

      {/* WORK EXPERIENCE — Grouped by Company */}
      {resume_type === 'chronological' && work_experience && work_experience.length > 0 && (
        <div style={{ marginBottom: '8px' }}>
          <div style={sectionTitle}>Work Experience</div>
          <div>
            {grouped.map((group: any, gIdx: number) => (
              <div key={gIdx} style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '10.5pt' }}>
                    {group.company_name}
                    {group.location_city ? ` | ${group.location_city}` : ''}
                  </span>
                  <span style={{ fontSize: '9.5pt', fontWeight: 'bold', color: '#111' }}>
                    {formatDate(group.minStart, false, presentLabel)} – {group.maxEnd === 'Present' ? presentLabel : formatDate(group.maxEnd, false, presentLabel)}
                  </span>
                </div>

                {group.positions
                  .slice()
                  .sort((a: any, b: any) => {
                    if (a.is_current && !b.is_current) return -1
                    if (!a.is_current && b.is_current) return 1
                    return new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
                  })
                  .map((pos: any) => (
                    <div key={pos.id} style={{ marginTop: group.positions.length > 1 ? '4px' : '0px' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '10pt', letterSpacing: '0.02em', marginBottom: '2px', marginTop: '1px' }}>
                        {pos.job_title}
                        {group.positions.length > 1 && (
                          <span style={{ textDecoration: 'none', fontWeight: 'normal', fontSize: '9pt', color: '#666', marginLeft: '8px', textTransform: 'none' }}>
                            ({formatDate(pos.start_date, false, presentLabel)} – {formatDate(pos.end_date, pos.is_current, presentLabel)})
                          </span>
                        )}
                      </div>
                      {pos.scope_description && (
                        <p style={{ fontSize: '9.5pt', color: '#333', margin: '2px 0 3px', textAlign: 'justify' }}>{pos.scope_description}</p>
                      )}
                      {pos.accomplishments && pos.accomplishments.length > 0 && (
                        <ul style={{ listStyleType: 'disc', paddingLeft: '16px', margin: 0 }}>
                          {[...pos.accomplishments]
                            .sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0))
                            .map((acc: any) => (
                              <li key={acc.id} style={{ fontSize: '9.5pt', lineHeight: '1.35', marginBottom: '1px' }}>
                                {acc.bullet_text}
                              </li>
                            ))}
                        </ul>
                      )}
                    </div>
                  ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EDUCATION */}
      {education && education.length > 0 && (
        <div style={{ marginBottom: '8px' }}>
          <div style={sectionTitle}>Education</div>
          <div>
            {education.map((edu: any) => (
              <div key={edu.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '3px' }}>
                <div>
                  <span style={{ fontWeight: 'bold', fontSize: '10pt' }}>
                    {edu.degree_title || edu.degree_type || edu.degree || 'Degree'}
                  </span>
                  <span style={{ fontSize: '9.5pt', color: '#444', marginLeft: '4px' }}>
                    {edu.institution || edu.institution_name}
                    {edu.location ? `, ${edu.location}` : ''}
                  </span>
                  {edu.field_of_study && (
                    <span style={{ fontSize: '9.5pt', color: '#444', marginLeft: '4px' }}>in {edu.field_of_study}</span>
                  )}
                </div>
                <span style={{ fontSize: '9.5pt', color: '#444', whiteSpace: 'nowrap' }}>
                  {edu.graduation_year || edu.year}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CERTIFICATIONS */}
      {certifications && certifications.length > 0 && (
        <div style={{ marginBottom: '8px' }}>
          <div style={sectionTitle}>Certifications</div>
          <ul style={{ listStyleType: 'disc', paddingLeft: '16px', margin: 0 }}>
            {certifications.map((cert: any) => (
              <li key={cert.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2px' }}>
                <div style={{ fontSize: '9.5pt' }}>
                  <span style={{ fontWeight: 'bold' }}>{cert.certification_name}</span>
                  {cert.issuing_organization && (
                    <span style={{ color: '#444', marginLeft: '4px' }}>• {cert.issuing_organization}</span>
                  )}
                </div>
                <span style={{ fontSize: '9pt', color: '#444', whiteSpace: 'nowrap' }}>
                  {cert.issue_date ? new Date(cert.issue_date).getFullYear() : ''}
                  {cert.expiration_date ? ` – ${new Date(cert.expiration_date).getFullYear()}` : ''}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* AWARDS */}
      {awards && awards.length > 0 && (
        <div style={{ marginBottom: '8px' }}>
          <div style={sectionTitle}>Awards</div>
          <ul style={{ listStyleType: 'disc', paddingLeft: '16px', margin: 0 }}>
            {awards.map((award: any) => (
              <li key={award.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2px' }}>
                <div style={{ fontSize: '9.5pt' }}>
                  <span style={{ fontWeight: 'bold' }}>{award.certification_name || award.name}</span>
                  {award.issuing_organization && (
                    <span style={{ color: '#444', marginLeft: '4px' }}>• {award.issuing_organization}</span>
                  )}
                </div>
                <span style={{ fontSize: '9pt', color: '#444', whiteSpace: 'nowrap' }}>
                  {award.issue_date ? new Date(award.issue_date).getFullYear() : ''}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
