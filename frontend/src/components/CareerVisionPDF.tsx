/**
 * Career Vision PDF Component
 * Professional Venn diagram design matching the web version
 */

import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

interface CareerVisionPDFProps {
  careerData: {
    skills: string[]
    interests: string[]
    sweetSpot: string[]
  }
  preferences: any
  userName: string
  generatedDate: string
}

// Styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    backgroundColor: '#FFFFFF'
  },
  header: {
    marginBottom: 20,
    textAlign: 'center'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4
  },
  mainSection: {
    flexDirection: 'row',
    marginTop: 20,
    marginBottom: 20
  },
  diagramContainer: {
    width: '65%',
    paddingRight: 20
  },
  profileContainer: {
    width: '35%',
    paddingLeft: 10
  },
  profileTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 10
  },
  profileText: {
    fontSize: 9,
    color: '#374151',
    lineHeight: 1.5,
    marginBottom: 10
  },
  profileStats: {
    fontSize: 8,
    color: '#6B7280',
    marginTop: 10,
    paddingTop: 10,
    borderTop: '1pt solid #E5E7EB'
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#9CA3AF'
  }
})

export const CareerVisionPDF: React.FC<CareerVisionPDFProps> = ({
  careerData,
  preferences,
  userName,
  generatedDate
}) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            The "Sweet Spot": Where Capability Meets Passion
          </Text>
          <Text style={styles.subtitle}>{userName} • {generatedDate}</Text>
        </View>

        {/* Main Content */}
        <View style={styles.mainSection}>
          {/* Venn Diagram - SVG representation using shapes */}
          <View style={styles.diagramContainer}>
            {/* Skills Circle (Left) */}
            <View style={{
              position: 'absolute',
              left: 20,
              top: 20,
              width: 140,
              height: 140,
              borderRadius: 70,
              backgroundColor: '#F8FAFCF0',
              border: '2pt solid #1F2937'
            }}>
              <View style={{ marginTop: 15, marginLeft: 15 }}>
                <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#1F2937', marginBottom: 8 }}>
                  Skills
                </Text>
                {careerData.skills.slice(0, 3).map((skill, idx) => (
                  <Text key={idx} style={{ fontSize: 8, color: '#374151', marginBottom: 4 }}>
                    {skill}
                  </Text>
                ))}
                {careerData.skills.length > 3 && (
                  <Text style={{ fontSize: 7, color: '#6B7280', fontStyle: 'italic' }}>
                    +{careerData.skills.length - 3} more
                  </Text>
                )}
              </View>
            </View>

            {/* Interests Circle (Right) */}
            <View style={{
              position: 'absolute',
              left: 120,
              top: 20,
              width: 140,
              height: 140,
              borderRadius: 70,
              backgroundColor: '#F8FAFCF0',
              border: '2pt solid #C27849'
            }}>
              <View style={{ marginTop: 15, marginLeft: 50 }}>
                <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#C27849', marginBottom: 8 }}>
                  Interests
                </Text>
                {careerData.interests.slice(0, 3).map((interest, idx) => (
                  <Text key={idx} style={{ fontSize: 8, color: '#374151', marginBottom: 4 }}>
                    {interest}
                  </Text>
                ))}
                {careerData.interests.length > 3 && (
                  <Text style={{ fontSize: 7, color: '#6B7280', fontStyle: 'italic' }}>
                    +{careerData.interests.length - 3} more
                  </Text>
                )}
              </View>
            </View>

            {/* Sweet Spot (Center Intersection) */}
            <View style={{
              position: 'absolute',
              left: 85,
              top: 50,
              width: 80,
              height: 90,
              borderRadius: 40,
              backgroundColor: '#4E4644F0',
              border: '1.5pt solid #4E4644',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <Text style={{
                fontSize: 12,
                fontWeight: 'bold',
                color: '#FFFFFF',
                textAlign: 'center',
                marginBottom: 4
              }}>
                {userName.toUpperCase()}
              </Text>
              {careerData.sweetSpot.slice(0, 2).map((word, idx) => (
                <Text key={idx} style={{
                  fontSize: 8,
                  color: '#FFFFFF',
                  textAlign: 'center'
                }}>
                  {word.charAt(0).toUpperCase() + word.slice(1)}
                </Text>
              ))}
            </View>

            {/* Label pointing to sweet spot */}
            {careerData.sweetSpot.length > 0 && (
              <View style={{ position: 'absolute', left: 210, top: 40 }}>
                <Text style={{
                  fontSize: 8,
                  color: '#6B7280',
                  fontStyle: 'italic'
                }}>
                  {careerData.sweetSpot.slice(0, 2).join(' & ')}
                </Text>
              </View>
            )}

            {/* Diagram description */}
            <View style={{ marginTop: 175 }}>
              <Text style={{
                fontSize: 7,
                color: '#6B7280',
                textAlign: 'center',
                fontStyle: 'italic'
              }}>
                Where skills and interests align
              </Text>
            </View>
          </View>

          {/* Profile Description */}
          <View style={styles.profileContainer}>
            <Text style={styles.profileTitle}>My Professional Profile</Text>
            <Text style={styles.profileText}>
              {careerData.sweetSpot.length > 0 ? (
                `Thrives at the intersection of ${careerData.sweetSpot.slice(0, 2).join(' and ')}. It's not just technical analysis; it's the application of data intelligence to develop people and sustainable solutions.`
              ) : (
                `My professional profile combines expertise in ${careerData.skills.slice(0, 2).join(' and ')} with a passion for ${careerData.interests.slice(0, 2).join(' and ')}, creating unique value through the integration of technical skills and personal interests.`
              )}
            </Text>
            <Text style={styles.profileStats}>
              {careerData.skills.length} Skills • {careerData.interests.length} Interests
            </Text>
          </View>
        </View>

        {/* Skills & Interests Lists */}
        <View style={{
          flexDirection: 'row',
          marginTop: 20,
          gap: 10
        }}>
          {/* Full Skills List */}
          <View style={{ width: '48%' }}>
            <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#1F2937', marginBottom: 6 }}>
              Complete Skills ({careerData.skills.length})
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
              {careerData.skills.map((skill, idx) => (
                <Text key={idx} style={{
                  fontSize: 7,
                  color: '#374151',
                  backgroundColor: '#F3F4F6',
                  padding: '3pt 6pt',
                  borderRadius: 3,
                  marginBottom: 3
                }}>
                  {skill}
                </Text>
              ))}
            </View>
          </View>

          {/* Full Interests List */}
          <View style={{ width: '48%' }}>
            <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#C27849', marginBottom: 6 }}>
              Complete Interests ({careerData.interests.length})
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
              {careerData.interests.map((interest, idx) => (
                <Text key={idx} style={{
                  fontSize: 7,
                  color: '#374151',
                  backgroundColor: '#FEF3E2',
                  padding: '3pt 6pt',
                  borderRadius: 3,
                  marginBottom: 3
                }}>
                  {interest}
                </Text>
              ))}
            </View>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          NovaWork Global • Career Vision Profile • Generated on {generatedDate}
        </Text>
      </Page>

      {/* Page 2: Ideal Work Preferences */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Ideal Work Preferences</Text>
          <Text style={styles.subtitle}>{userName} • {generatedDate}</Text>
        </View>

        <View style={{ marginTop: 20 }}>
          <Text style={{ fontSize: 10, color: '#4B5563', marginBottom: 15 }}>
            Prioritized criteria for evaluating future career opportunities.
          </Text>

          {/* Preferences Table Header */}
          <View style={{ flexDirection: 'row', borderBottom: '1pt solid #E5E7EB', paddingBottom: 5, marginBottom: 10 }}>
            <Text style={{ width: '25%', fontSize: 9, fontWeight: 'bold', color: '#374151' }}>Category</Text>
            <Text style={{ width: '15%', fontSize: 9, fontWeight: 'bold', color: '#374151' }}>Priority</Text>
            <Text style={{ width: '60%', fontSize: 9, fontWeight: 'bold', color: '#374151' }}>Preference Detail</Text>
          </View>

          {/* Preferences Rows */}
          {[
            { label: 'Industry', pref: preferences?.industry_preference, weight: preferences?.industry_weight },
            { label: 'Location', pref: preferences?.geographic_preference, weight: preferences?.geographic_weight },
            { label: 'Compensation', pref: preferences?.compensation_preference, weight: preferences?.compensation_weight },
            { label: 'Benefits', pref: preferences?.benefits_preference, weight: preferences?.benefits_weight },
            { label: 'Company Profile', pref: preferences?.company_profile_preference, weight: preferences?.company_profile_weight },
            { label: 'Position Goals', pref: preferences?.position_goals_preference, weight: preferences?.position_goals_weight },
            { label: 'Promotion Basis', pref: preferences?.promotion_basis_preference, weight: preferences?.promotion_basis_weight },
            { label: 'Company Culture', pref: preferences?.company_culture_preference, weight: preferences?.company_culture_weight },
            { label: 'Lifestyle', pref: preferences?.lifestyle_preference, weight: preferences?.lifestyle_weight },
            { label: 'Boss Type', pref: preferences?.boss_type_preference, weight: preferences?.boss_type_weight },
            { label: 'Other', pref: preferences?.other_preference, weight: preferences?.other_weight },
          ].map((item, idx) => (
            item.pref ? (
              <View key={idx} style={{ flexDirection: 'row', borderBottom: '1pt solid #F3F4F6', paddingVertical: 8 }}>
                <Text style={{ width: '25%', fontSize: 9, color: '#1F2937' }}>{item.label}</Text>
                <Text style={{ width: '15%', fontSize: 9, color: item.weight === 'M' ? '#DC2626' : '#4B5563', fontWeight: item.weight === 'M' ? 'bold' : 'normal' }}>
                  {item.weight === 'M' ? 'Must-Have' : `Level ${item.weight}`}
                </Text>
                <Text style={{ width: '60%', fontSize: 9, color: '#4B5563' }}>{item.pref}</Text>
              </View>
            ) : null
          ))}
        </View>

        <Text style={styles.footer}>
          NovaWork Global • Career Vision Profile • Generated on {generatedDate}
        </Text>
      </Page>
    </Document >
  )
}
