interface Step {
  id: string
  title: string
}

interface ProgressIndicatorProps {
  steps: Step[]
  currentStep: number
  className?: string
}

export default function ProgressIndicator({ steps, currentStep, className = '' }: ProgressIndicatorProps) {
  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center flex-1">
            {/* Step Circle */}
            <div className="flex flex-col items-center flex-1">
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm
                  transition-all duration-300
                  ${
                    index < currentStep
                      ? 'bg-primary-600 text-white'
                      : index === currentStep
                      ? 'bg-primary-600 text-white ring-4 ring-primary-200'
                      : 'bg-gray-200 text-gray-500'
                  }
                `}
              >
                {index < currentStep ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>

              {/* Step Title */}
              <p
                className={`
                  mt-2 text-sm font-medium text-center
                  ${index === currentStep ? 'text-primary-600' : 'text-gray-500'}
                `}
              >
                {step.title}
              </p>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div
                className={`
                  h-1 flex-1 mx-2 transition-all duration-300 rounded-full
                  ${index < currentStep ? 'bg-primary-600' : 'bg-gray-200'}
                `}
                style={{ marginTop: '-24px' }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
