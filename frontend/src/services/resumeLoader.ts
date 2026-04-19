/**
 * Shared resume loader.
 *
 * Produces the same `resumeData` shape consumed by ResumeFinalPreview and by
 * the Smart Matches tailored drawer. Queries mirror the logic that used to
 * live inline in ResumeFinalPreview.tsx so the two paths can never drift.
 */

import { supabase } from '../lib/supabase'

export interface ResumeContact {
  full_name: string | null
  email: string | null
  phone: string | null
  linkedin: string | null
  linkedin_url: string | null
  location: string | null
  portfolio: string | null
}

export interface ResumeData {
  contact: ResumeContact
  summary: string
  areas_of_excellence: string[]
  skills_section: {
    tools_platforms?: string[]
    methodologies?: string[]
    languages?: string[]
  }
  work_experience: any[]
  education: any[]
  certifications: any[]
  awards: any[]
  resume_type: 'chronological' | 'functional'
  master_resume_id: string | null
}

export async function loadResumeData(userId: string): Promise<ResumeData | null> {
  if (!userId) return null

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  const { data: user } = await supabase
    .from('users')
    .select('full_name, email, phone, linkedin_url')
    .eq('id', userId)
    .single()

  const { data: masterResumes } = await supabase
    .from('user_resumes')
    .select('*')
    .eq('user_id', userId)
    .eq('is_master', true)
    .order('created_at', { ascending: false })
    .limit(1)

  let masterResume = masterResumes?.[0]

  if (!masterResume) {
    const { data: anyResumes } = await supabase
      .from('user_resumes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
    masterResume = anyResumes?.[0]
  }

  const { data: generatedProfiles } = await supabase
    .from('generated_professional_profile')
    .select('*')
    .eq('user_id', userId)
    .order('version', { ascending: false })
    .limit(1)
  const generatedProfile = generatedProfiles?.[0] || null

  let workExperience: any[] = []
  let education: any[] = []

  if (masterResume) {
    const { data: work } = await supabase
      .from('work_experience')
      .select('*, accomplishments(*)')
      .eq('resume_id', masterResume.id)
      .order('start_date', { ascending: false })
    workExperience = work || []

    const { data: aiBullets } = await supabase
      .from('accomplishment_bank')
      .select('id, bullet_text, role_title, company_name')
      .eq('user_id', userId)
      .eq('source', 'ai_generated')

    if (aiBullets && aiBullets.length > 0) {
      workExperience = workExperience.map((exp: any) => {
        const matching = aiBullets.filter(
          (b) =>
            b.role_title?.toLowerCase().trim() ===
            exp.job_title?.toLowerCase().trim(),
        )
        if (matching.length === 0) return exp
        const existingTexts = new Set(
          (exp.accomplishments || []).map((a: any) =>
            a.bullet_text?.toLowerCase().trim(),
          ),
        )
        const newAI = matching
          .filter(
            (b) => !existingTexts.has(b.bullet_text?.toLowerCase().trim()),
          )
          .map((b, i) => ({
            id: `ai-${b.id}`,
            bullet_text: b.bullet_text,
            source: 'ai_generated',
            order_index: -(matching.length - i),
          }))
        const combined = [...newAI, ...(exp.accomplishments || [])]
        return { ...exp, accomplishments: combined }
      })
    }

    const { data: edu } = await supabase
      .from('education')
      .select('*')
      .eq('resume_id', masterResume.id)
      .order('graduation_year', { ascending: false })

    if (edu && edu.length > 0) {
      education = edu
    } else {
      const { data: eduFallback } = await supabase
        .from('education')
        .select('*')
        .eq('user_id', userId)
        .order('graduation_year', { ascending: false })
      education = eduFallback || []
    }
  }

  const { data: certs } = await supabase
    .from('certifications')
    .select('*')
    .eq('user_id', userId)
    .order('issue_date', { ascending: false })
  const certifications = certs || []

  const { data: awards } = await supabase
    .from('awards')
    .select('*')
    .eq('user_id', userId)
    .order('issue_date', { ascending: false })
  const finalAwards = awards || []

  let combinedProfile = ''
  let areasOfExcellence: string[] = []
  let skillsSection: ResumeData['skills_section'] = {}

  const generatedTime = generatedProfile?.created_at
    ? new Date(generatedProfile.created_at).getTime()
    : 0
  const resumeUpdateTime = masterResume?.updated_at
    ? new Date(masterResume.updated_at).getTime()
    : masterResume?.created_at
      ? new Date(masterResume.created_at).getTime()
      : 0

  const userEditIsNewer =
    !!masterResume?.profile_summary && resumeUpdateTime > generatedTime

  if (generatedProfile && !userEditIsNewer) {
    const parts = [
      generatedProfile.output_identity_sentence,
      generatedProfile.output_blended_value_sentence,
      generatedProfile.output_competency_paragraph,
    ].filter(Boolean)
    combinedProfile = parts.join(' ')

    const rawAreas = generatedProfile.output_areas_of_excellence
    if (typeof rawAreas === 'string' && rawAreas) {
      areasOfExcellence = rawAreas
        .split('|')
        .map((s: string) => s.trim())
        .filter(Boolean)
    } else if (Array.isArray(rawAreas)) {
      areasOfExcellence = rawAreas
    }

    const rawSkills = generatedProfile.output_skills_section
    if (rawSkills) {
      skillsSection =
        typeof rawSkills === 'string' ? JSON.parse(rawSkills) : rawSkills
    }
  } else if (masterResume?.profile_summary) {
    combinedProfile = masterResume.profile_summary
    areasOfExcellence = masterResume?.areas_of_excellence || []
  }

  return {
    contact: {
      full_name: masterResume?.full_name || user?.full_name || profile?.full_name || null,
      email: masterResume?.email || user?.email || null,
      phone: masterResume?.phone || user?.phone || profile?.phone || null,
      linkedin:
        masterResume?.linkedin_url || user?.linkedin_url || profile?.linkedin_url || null,
      linkedin_url:
        masterResume?.linkedin_url || user?.linkedin_url || profile?.linkedin_url || null,
      location: masterResume?.location_city
        ? masterResume.location_country === 'USA' || !masterResume.location_country
          ? masterResume.location_city
          : `${masterResume.location_city}, ${masterResume.location_country}`
        : profile?.current_location || null,
      portfolio: masterResume?.portfolio_url || null,
    },
    summary: combinedProfile,
    areas_of_excellence: areasOfExcellence,
    skills_section: skillsSection,
    work_experience: workExperience,
    education,
    certifications,
    awards: finalAwards,
    resume_type: masterResume?.resume_type || 'chronological',
    master_resume_id: masterResume?.id || null,
  }
}
