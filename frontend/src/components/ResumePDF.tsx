/**
 * Generic Resume PDF Export
 * Exports the complete master resume matching professional format
 */

import { Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer'
import { UserResume, WorkExperience, Accomplishment, Education, Certification } from '../types/resume'

interface ResumePDFProps {
  resume: UserResume
  workExperiences?: WorkExperience[]
  education?: Education[]
  certifications?: Certification[]
}

// Professional PDF Styles matching the example
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#FFFFFF',
    lineHeight: 1.4
  },
  // Header - Centered name and contact
  header: {
    marginBottom: 16,
    textAlign: 'center'
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
    textAlign: 'center'
  },
  contactLine: {
    fontSize: 9,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 2
  },
  contactLink: {
    color: '#2563EB',
    textDecoration: 'none'
  },
  // Section styles
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
    marginTop: 14,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
    borderBottomWidth: 0.5,
    borderBottomColor: '#000000',
    paddingBottom: 2
  },
  // Professional Profile
  profileTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 3
  },
  profileText: {
    fontSize: 9,
    color: '#374151',
    lineHeight: 1.5,
    textAlign: 'justify',
    marginBottom: 6
  },
  // Areas of Specialty
  areasLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#000000'
  },
  areasText: {
    fontSize: 9,
    color: '#374151',
    lineHeight: 1.4
  },
  // Work Experience
  experienceItem: {
    marginBottom: 10
  },
  experienceHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 1
  },
  companyName: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#B45309' // Orange/Gold color like the example
  },
  dateRange: {
    fontSize: 9,
    color: '#000000',
    fontWeight: 'bold'
  },
  jobTitleRow: {
    marginBottom: 3
  },
  jobTitle: {
    fontSize: 9,
    color: '#0891B2', // Teal color like the example
    fontStyle: 'italic'
  },
  bulletList: {
    marginTop: 2
  },
  bulletItem: {
    flexDirection: 'row',
    marginBottom: 2,
    paddingLeft: 8
  },
  bullet: {
    width: 8,
    fontSize: 9,
    color: '#000000'
  },
  bulletText: {
    flex: 1,
    fontSize: 9,
    color: '#374151',
    lineHeight: 1.4,
    textAlign: 'justify'
  },
  // Other Positions
  otherPositionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    marginBottom: 6
  },
  otherPositionsLabel: {
    fontSize: 9,
    color: '#000000',
    fontWeight: 'bold',
    marginRight: 4
  },
  otherPositionItem: {
    fontSize: 9,
    color: '#374151'
  },
  otherPositionTitle: {
    color: '#B45309'
  },
  otherPositionCompany: {
    color: '#0891B2'
  },
  // Technical Skills
  skillsSection: {
    marginTop: 4
  },
  skillCategory: {
    flexDirection: 'row',
    marginBottom: 2
  },
  skillCategoryLabel: {
    fontSize: 9,
    color: '#0891B2',
    fontWeight: 'bold',
    textDecoration: 'underline',
    marginRight: 4
  },
  skillCategoryText: {
    fontSize: 9,
    color: '#374151',
    flex: 1
  },
  // Education
  educationItem: {
    marginBottom: 4,
    textAlign: 'center'
  },
  degreeTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000000'
  },
  institution: {
    fontSize: 9,
    color: '#374151'
  },
  // Certifications
  certificationText: {
    fontSize: 9,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 1.4
  }
})

export const ResumePDF = ({ resume, workExperiences = [], education = [], certifications = [] }: ResumePDFProps) => {
  const formatDateRange = (startDate: string, endDate?: string | null, isCurrent?: boolean) => {
    const formatDate = (date: string) => {
      try {
        const d = new Date(date)
        return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      } catch {
        return date
      }
    }

    const start = formatDate(startDate)
    if (isCurrent) {
      return `${start} – Present`
    }
    if (endDate) {
      return `${start} – ${formatDate(endDate)}`
    }
    return start
  }

  // Build contact line with pipe separators
  const contactParts = [
    resume.location_city || resume.location_country,
    resume.email,
    resume.phone,
    resume.linkedin_url ? 'linkedin.com/in/' + (resume.linkedin_url.split('/').pop() || 'profile') : null
  ].filter(Boolean)

  // Build areas of specialty as pipe-separated text
  const areasText = resume.areas_of_excellence?.join(' | ') || ''

  // Separate main experiences (detailed) from other positions (brief)
  const mainExperiences = workExperiences.slice(0, 4)
  const otherPositions = workExperiences.slice(4)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header - Centered Name */}
        <View style={styles.header}>
          <Text style={styles.name}>{resume.full_name || 'Your Name'}</Text>
          <Text style={styles.contactLine}>
            {contactParts.map((part, i) => (
              i === 0 ? part : ` | ${part}`
            )).join('')}
          </Text>
        </View>

        {/* Professional Profile */}
        {resume.profile_summary && (
          <View>
            <Text style={styles.sectionTitle}>PROFESSIONAL PROFILE</Text>
            <Text style={styles.profileText}>
              {resume.profile_summary}
            </Text>
          </View>
        )}

        {/* Areas of Specialty */}
        {areasText && (
          <View style={{ marginBottom: 8 }}>
            <Text>
              <Text style={styles.areasLabel}>Areas of Specialty: </Text>
              <Text style={styles.areasText}>{areasText}</Text>
            </Text>
          </View>
        )}

        {/* Work Experience */}
        {mainExperiences.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>WORK EXPERIENCE</Text>
            {mainExperiences
              .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())
              .map((exp, index) => (
                <View key={exp.id || index} style={styles.experienceItem}>
                  {/* Company and Date Row */}
                  <View style={styles.experienceHeaderRow}>
                    <Text>
                      <Text style={styles.companyName}>{exp.company_name}</Text>
                      {(exp.location_city || exp.location_country) && (
                        <Text style={{ fontSize: 9, color: '#374151' }}>
                          {' | '}{[exp.location_city, exp.location_country].filter(Boolean).join(', ')}
                        </Text>
                      )}
                    </Text>
                    <Text style={styles.dateRange}>
                      {formatDateRange(exp.start_date, exp.end_date, exp.is_current)}
                    </Text>
                  </View>

                  {/* Job Title */}
                  <View style={styles.jobTitleRow}>
                    <Text style={styles.jobTitle}>{exp.job_title}</Text>
                  </View>

                  {/* Accomplishments/Bullets */}
                  {exp.accomplishments && exp.accomplishments.length > 0 && (
                    <View style={styles.bulletList}>
                      {exp.accomplishments
                        .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
                        .map((acc, accIndex) => (
                          <View key={acc.id || accIndex} style={styles.bulletItem}>
                            <Text style={styles.bullet}>•</Text>
                            <Text style={styles.bulletText}>{acc.bullet_text}</Text>
                          </View>
                        ))}
                    </View>
                  )}
                </View>
              ))}
          </View>
        )}

        {/* Other Positions - Brief format */}
        {otherPositions.length > 0 && (
          <View style={styles.otherPositionsRow}>
            <Text style={styles.otherPositionsLabel}>Other Positions: </Text>
            <Text style={styles.otherPositionItem}>
              {otherPositions.map((exp, i) => (
                `${exp.job_title} @ ${exp.company_name}${i < otherPositions.length - 1 ? '; ' : ''}`
              )).join('')}
            </Text>
          </View>
        )}

        {/* Technical Skills */}
        {resume.areas_of_excellence && resume.areas_of_excellence.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>TECHNICAL SKILLS</Text>
            <View style={styles.skillsSection}>
              {/* Group skills by category if available, otherwise show as general */}
              <View style={styles.skillCategory}>
                <Text style={styles.skillCategoryLabel}>Core Competencies:</Text>
                <Text style={styles.skillCategoryText}>
                  {resume.areas_of_excellence.slice(0, 8).join(', ')}
                </Text>
              </View>
              {resume.areas_of_excellence.length > 8 && (
                <View style={styles.skillCategory}>
                  <Text style={styles.skillCategoryLabel}>Additional Skills:</Text>
                  <Text style={styles.skillCategoryText}>
                    {resume.areas_of_excellence.slice(8).join(', ')}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Education */}
        {education.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>EDUCATION</Text>
            {education
              .sort((a, b) => (b.order_index || 0) - (a.order_index || 0))
              .map((edu, index) => (
                <View key={edu.id || index} style={styles.educationItem}>
                  <Text>
                    <Text style={styles.degreeTitle}>{edu.degree_title}</Text>
                    <Text style={styles.institution}>, {edu.institution}</Text>
                    {edu.location && <Text style={styles.institution}> | {edu.location}</Text>}
                  </Text>
                </View>
              ))}
          </View>
        )}

        {/* Certifications */}
        {certifications.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>CERTIFICATIONS</Text>
            <Text style={styles.certificationText}>
              {certifications.map(cert => cert.certification_name).join('; ')}
            </Text>
          </View>
        )}

        {/* No footer - removed as requested */}
      </Page>
    </Document>
  )
}
