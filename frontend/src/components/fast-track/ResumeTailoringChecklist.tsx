import { Circle, AlertCircle, FileText, Target, Key, Zap } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function ResumeTailoringChecklist() {
  const { t } = useTranslation()

  const checklistSections = [
    {
      title: t('checklist.sections.beforeYouStart.title', 'Before You Start'),
      icon: AlertCircle,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      items: [
        {
          label: t('checklist.sections.beforeYouStart.items.readJD.title', 'Read the full job description 3 times'),
          description: t('checklist.sections.beforeYouStart.items.readJD.desc', 'Understand requirements, responsibilities, and company culture'),
          priority: 'high'
        },
        {
          label: t('checklist.sections.beforeYouStart.items.keywords.title', 'Identify top 5-10 keywords from the JD'),
          description: t('checklist.sections.beforeYouStart.items.keywords.desc', 'Use JD Analyzer tool or manually extract key skills and requirements'),
          priority: 'high'
        },
        {
          label: t('checklist.sections.beforeYouStart.items.research.title', 'Research the company'),
          description: t('checklist.sections.beforeYouStart.items.research.desc', 'Know their mission, recent news, and why you want to work there'),
          priority: 'medium'
        }
      ]
    },
    {
      title: t('checklist.sections.resumeOptimization.title', 'Resume Optimization'),
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      items: [
        {
          label: t('checklist.sections.resumeOptimization.items.jobTitles.title', 'Match your job titles to their language'),
          description: t('checklist.sections.resumeOptimization.items.jobTitles.desc', "If they say \"Product Manager,\" don't use \"Product Lead\""),
          priority: 'high'
        },
        {
          label: t('checklist.sections.resumeOptimization.items.allSkills.title', 'Include ALL required skills mentioned in the JD'),
          description: t('checklist.sections.resumeOptimization.items.allSkills.desc', 'If you have the skill, it MUST be on your resume'),
          priority: 'high'
        },
        {
          label: t('checklist.sections.resumeOptimization.items.exactKeywords.title', 'Use their exact keywords (especially for ATS)'),
          description: t('checklist.sections.resumeOptimization.items.exactKeywords.desc', 'Copy exact phrases like "Agile methodology" vs "Agile processes"'),
          priority: 'high'
        },
        {
          label: t('checklist.sections.resumeOptimization.items.quantify.title', 'Quantify your accomplishments'),
          description: t('checklist.sections.resumeOptimization.items.quantify.desc', 'Use metrics: "Increased revenue by 40%" not "Improved revenue"'),
          priority: 'high'
        },
        {
          label: t('checklist.sections.resumeOptimization.items.summary.title', 'Tailor your summary/profile section'),
          description: t('checklist.sections.resumeOptimization.items.summary.desc', 'First 3 lines should mirror the job requirements'),
          priority: 'medium'
        },
        {
          label: t('checklist.sections.resumeOptimization.items.removeIrrelevant.title', 'Remove irrelevant experience'),
          description: t('checklist.sections.resumeOptimization.items.removeIrrelevant.desc', "If it doesn't help you get THIS job, consider removing it"),
          priority: 'low'
        }
      ]
    },
    {
      title: t('checklist.sections.atsFormatting.title', 'ATS-Friendly Formatting'),
      icon: Zap,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      items: [
        {
          label: t('checklist.sections.atsFormatting.items.standardHeaders.title', 'Use standard section headers'),
          description: t('checklist.sections.atsFormatting.items.standardHeaders.desc', '"Work Experience" not "My Journey," "Education" not "Learning"'),
          priority: 'high'
        },
        {
          label: t('checklist.sections.atsFormatting.items.saveFormat.title', 'Save as .docx or .pdf'),
          description: t('checklist.sections.atsFormatting.items.saveFormat.desc', 'PDF preferred, but some ATS prefer .docx - check job posting'),
          priority: 'high'
        },
        {
          label: t('checklist.sections.atsFormatting.items.standardFonts.title', 'Use standard fonts (Arial, Calibri, Times)'),
          description: t('checklist.sections.atsFormatting.items.standardFonts.desc', "Avoid fancy fonts that ATS can't read"),
          priority: 'medium'
        },
        {
          label: t('checklist.sections.atsFormatting.items.avoidTables.title', 'Avoid tables, columns, headers/footers'),
          description: t('checklist.sections.atsFormatting.items.avoidTables.desc', 'ATS struggles with complex formatting'),
          priority: 'medium'
        },
        {
          label: t('checklist.sections.atsFormatting.items.bulletPoints.title', 'Use standard bullet points'),
          description: t('checklist.sections.atsFormatting.items.bulletPoints.desc', 'Simple • or - symbols only'),
          priority: 'low'
        }
      ]
    },
    {
      title: t('checklist.sections.fileNaming.title', 'File Naming & Submission'),
      icon: Target,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      items: [
        {
          label: t('checklist.sections.fileNaming.items.nameFile.title', 'Name file correctly'),
          description: t('checklist.sections.fileNaming.items.nameFile.desc', 'Format: YourName_JobTitle_CompanyName.pdf (e.g., JohnSmith_ProductManager_Google.pdf)'),
          priority: 'high'
        },
        {
          label: t('checklist.sections.fileNaming.items.saveFolder.title', 'Save in dedicated folder'),
          description: t('checklist.sections.fileNaming.items.saveFolder.desc', 'Keep organized: Applications/[Company]/[Date]/'),
          priority: 'medium'
        },
        {
          label: t('checklist.sections.fileNaming.items.keepOriginal.title', 'Keep original version'),
          description: t('checklist.sections.fileNaming.items.keepOriginal.desc', 'Always maintain your master resume separately'),
          priority: 'medium'
        }
      ]
    }
  ]

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return (
          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-700">
            {t('checklist.priority.mustDo', 'Must-Do')}
          </span>
        )
      case 'medium':
        return (
          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-700">
            {t('checklist.priority.important', 'Important')}
          </span>
        )
      case 'low':
        return (
          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">
            {t('checklist.priority.niceToHave', 'Nice-to-Have')}
          </span>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Intro Banner */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg p-6 text-white">
        <h3 className="text-xl font-bold mb-2">{t('checklist.header', '80% of Resumes Are Rejected by ATS')}</h3>
        <p className="text-primary-100">
          {t('checklist.subtitle', 'Use this checklist EVERY time you apply to ensure your resume gets through automated screening and into human hands.')}
        </p>
      </div>

      {/* Checklist Sections */}
      {checklistSections.map((section, sectionIdx) => {
        const Icon = section.icon
        return (
          <div
            key={sectionIdx}
            className={`border-2 ${section.borderColor} ${section.bgColor} rounded-lg overflow-hidden`}
          >
            {/* Section Header */}
            <div className="bg-white border-b-2 border-gray-200 p-4 flex items-center gap-3">
              <Icon className={`w-6 h-6 ${section.color}`} />
              <h3 className="text-lg font-bold text-gray-900">{section.title}</h3>
              <span className="ml-auto text-sm text-gray-500">
                {section.items.length} {t('checklist.items', 'items')}
              </span>
            </div>

            {/* Checklist Items */}
            <div className="p-4 space-y-3">
              {section.items.map((item, itemIdx) => (
                <div
                  key={itemIdx}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <Circle className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900">{item.label}</h4>
                        {getPriorityBadge(item.priority)}
                      </div>
                      <p className="text-sm text-gray-600">{item.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {/* Pro Tip */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <Key className="w-6 h-6 text-blue-600 flex-shrink-0" />
          <div>
            <h4 className="font-bold text-blue-900 mb-2">{t('checklist.proTip.title', 'Pro Tip: The 80% Referral Rule')}</h4>
            <p className="text-blue-800 text-sm mb-3">
              {t('checklist.proTip.body', 'Even with a perfectly tailored resume, your callback rate without a referral is only 1-2%. WITH a referral, it jumps to 80%. Always try to find a referral before applying.')}
            </p>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>• {t('checklist.proTip.tip1', 'Check LinkedIn for 1st or 2nd degree connections')}</li>
              <li>• {t('checklist.proTip.tip2', 'Reach out to alumni from your school')}</li>
              <li>• {t('checklist.proTip.tip3', 'Ask your network for warm introductions')}</li>
              <li>• {t('checklist.proTip.tip4', 'Message employees on LinkedIn with a personalized note')}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Print-Friendly Checkbox List */}
      <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6">
        <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          {t('checklist.printChecklist.title', 'Print-Friendly Quick Checklist')}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
          {checklistSections.flatMap(section =>
            section.items.filter(item => item.priority === 'high').map((item, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="text-gray-400">☐</span>
                <span className="text-gray-700">{item.label}</span>
              </div>
            ))
          )}
        </div>
        <button
          onClick={() => window.print()}
          className="mt-4 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          {t('checklist.printChecklist.button', 'Print Checklist')}
        </button>
      </div>
    </div>
  )
}
