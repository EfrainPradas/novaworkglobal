import { CheckCircle, Circle, AlertCircle, FileText, Target, Key, Zap } from 'lucide-react'

export default function ResumeTailoringChecklist() {
  const checklistSections = [
    {
      title: 'Before You Start',
      icon: AlertCircle,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      items: [
        {
          label: 'Read the full job description 3 times',
          description: 'Understand requirements, responsibilities, and company culture',
          priority: 'high'
        },
        {
          label: 'Identify top 5-10 keywords from the JD',
          description: 'Use JD Analyzer tool or manually extract key skills and requirements',
          priority: 'high'
        },
        {
          label: 'Research the company',
          description: 'Know their mission, recent news, and why you want to work there',
          priority: 'medium'
        }
      ]
    },
    {
      title: 'Resume Optimization',
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      items: [
        {
          label: 'Match your job titles to their language',
          description: 'If they say "Product Manager," don\'t use "Product Lead"',
          priority: 'high'
        },
        {
          label: 'Include ALL required skills mentioned in the JD',
          description: 'If you have the skill, it MUST be on your resume',
          priority: 'high'
        },
        {
          label: 'Use their exact keywords (especially for ATS)',
          description: 'Copy exact phrases like "Agile methodology" vs "Agile processes"',
          priority: 'high'
        },
        {
          label: 'Quantify your accomplishments',
          description: 'Use metrics: "Increased revenue by 40%" not "Improved revenue"',
          priority: 'high'
        },
        {
          label: 'Tailor your summary/profile section',
          description: 'First 3 lines should mirror the job requirements',
          priority: 'medium'
        },
        {
          label: 'Remove irrelevant experience',
          description: 'If it doesn\'t help you get THIS job, consider removing it',
          priority: 'low'
        }
      ]
    },
    {
      title: 'ATS-Friendly Formatting',
      icon: Zap,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      items: [
        {
          label: 'Use standard section headers',
          description: '"Work Experience" not "My Journey," "Education" not "Learning"',
          priority: 'high'
        },
        {
          label: 'Save as .docx or .pdf',
          description: 'PDF preferred, but some ATS prefer .docx - check job posting',
          priority: 'high'
        },
        {
          label: 'Use standard fonts (Arial, Calibri, Times)',
          description: 'Avoid fancy fonts that ATS can\'t read',
          priority: 'medium'
        },
        {
          label: 'Avoid tables, columns, headers/footers',
          description: 'ATS struggles with complex formatting',
          priority: 'medium'
        },
        {
          label: 'Use standard bullet points',
          description: 'Simple • or - symbols only',
          priority: 'low'
        }
      ]
    },
    {
      title: 'File Naming & Submission',
      icon: Target,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      items: [
        {
          label: 'Name file correctly',
          description: 'Format: YourName_JobTitle_CompanyName.pdf (e.g., JohnSmith_ProductManager_Google.pdf)',
          priority: 'high'
        },
        {
          label: 'Save in dedicated folder',
          description: 'Keep organized: Applications/[Company]/[Date]/',
          priority: 'medium'
        },
        {
          label: 'Keep original version',
          description: 'Always maintain your master resume separately',
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
            Must-Do
          </span>
        )
      case 'medium':
        return (
          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-700">
            Important
          </span>
        )
      case 'low':
        return (
          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">
            Nice-to-Have
          </span>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Intro Banner */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg p-6 text-white">
        <h3 className="text-xl font-bold mb-2">80% of Resumes Are Rejected by ATS</h3>
        <p className="text-primary-100">
          Use this checklist EVERY time you apply to ensure your resume gets through automated screening and into human hands.
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
                {section.items.length} items
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
            <h4 className="font-bold text-blue-900 mb-2">Pro Tip: The 80% Referral Rule</h4>
            <p className="text-blue-800 text-sm mb-3">
              Even with a perfectly tailored resume, your callback rate without a referral is only 1-2%.
              WITH a referral, it jumps to 80%. Always try to find a referral before applying.
            </p>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>• Check LinkedIn for 1st or 2nd degree connections</li>
              <li>• Reach out to alumni from your school</li>
              <li>• Ask your network for warm introductions</li>
              <li>• Message employees on LinkedIn with a personalized note</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Print-Friendly Checkbox List */}
      <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6">
        <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Print-Friendly Quick Checklist
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
          Print Checklist
        </button>
      </div>
    </div>
  )
}
