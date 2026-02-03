import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { User, Phone, MapPin, Linkedin, Building, Briefcase, Camera, Target } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface OnboardingData {
    // ... existing interfaces ...
    fullName: string
    phoneNumber: string
    location: {
        city: string
        state: string
        country: string
    }
    linkedInUrl: string
    lastCompany: string
    lastRole: string
    targetJobTitle: string
    photoUrl?: string
}

interface CandidateProfileProps {
    data: OnboardingData
    onUpdate: (data: Partial<OnboardingData>) => void
    onNext: () => void
    onBack: () => void
}

export default function CandidateProfile({
    data,
    onUpdate,
    onNext,
    onBack,
}: CandidateProfileProps) {

    // ... in component ...
    const { t } = useTranslation()
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [uploading, setUploading] = useState(false)
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true)
            const file = event.target.files?.[0]
            if (!file) return

            // Get current user for path
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('No user found')

            const fileExt = file.name.split('.').pop()
            const fileName = `${user.id}/${Math.random()}.${fileExt}`
            const filePath = `${fileName}`

            // Upload file
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file)

            if (uploadError) {
                throw uploadError
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath)

            onUpdate({ photoUrl: publicUrl })
        } catch (error) {
            console.error('Error uploading image:', error)
            alert('Error uploading image. Please make sure you are signed in.')
        } finally {
            setUploading(false)
        }
    }

    const validate = () => {
        // ... existing validate ...
        const newErrors: Record<string, string> = {}
        if (!data.fullName?.trim()) newErrors.fullName = 'Full Name is required'
        if (!data.phoneNumber?.trim()) newErrors.phoneNumber = 'Phone Number is required'
        if (!data.location?.country?.trim()) newErrors.country = 'Country is required'
        if (!data.location?.state?.trim()) newErrors.state = 'State/Region is required'
        if (!data.location?.city?.trim()) newErrors.city = 'City is required'
        if (!data.targetJobTitle?.trim()) newErrors.targetJobTitle = 'Target Job Title is required'

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (validate()) {
            onNext()
        }
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-heading font-bold text-gray-900 mb-3">
                    Candidate Profile
                </h2>
                <p className="text-gray-600">
                    Let's verify your key information to tailor your profile.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Photo Placeholder */}
                <div className="flex justify-center mb-6">
                    <div
                        className="relative group cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageUpload}
                            accept="image/*"
                            className="hidden"
                        />
                        <div className={`w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center border-2 border-gray-200 group-hover:border-primary-500 transition-colors ${uploading ? 'opacity-50' : ''}`}>
                            {data.photoUrl ? (
                                <img src={data.photoUrl} alt="Profile" className="w-full h-full rounded-full object-cover" />
                            ) : (
                                <User className="w-10 h-10 text-gray-400 group-hover:text-primary-500" />
                            )}
                        </div>
                        <div className="absolute bottom-0 right-0 bg-primary-600 rounded-full p-2 text-white shadow-md hover:bg-primary-700">
                            {uploading ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            ) : (
                                <Camera className="w-4 h-4" />
                            )}
                        </div>
                    </div>
                </div>

                {/* Full Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            value={data.fullName || ''}
                            onChange={(e) => onUpdate({ fullName: e.target.value })}
                            className={`w-full pl-10 pr-4 py-3 border ${errors.fullName ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-primary-500 outline-none`}
                            placeholder="John Doe"
                        />
                    </div>
                    {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
                </div>

                {/* Phone */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="tel"
                            value={data.phoneNumber || ''}
                            onChange={(e) => onUpdate({ phoneNumber: e.target.value })}
                            className={`w-full pl-10 pr-4 py-3 border ${errors.phoneNumber ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-primary-500 outline-none`}
                            placeholder="+1 (555) 000-0000"
                        />
                    </div>
                    {errors.phoneNumber && <p className="text-red-500 text-xs mt-1">{errors.phoneNumber}</p>}
                </div>

                {/* Location (Country, State, City) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Country <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={data.location?.country || ''}
                                onChange={(e) => onUpdate({ location: { ...data.location, country: e.target.value } })}
                                className={`w-full px-4 py-3 border ${errors.country ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-primary-500 outline-none`}
                                placeholder="Country"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            State <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={data.location?.state || ''}
                                onChange={(e) => onUpdate({ location: { ...data.location, state: e.target.value } })}
                                className={`w-full px-4 py-3 border ${errors.state ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-primary-500 outline-none`}
                                placeholder="State"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            City <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={data.location?.city || ''}
                                onChange={(e) => onUpdate({ location: { ...data.location, city: e.target.value } })}
                                className={`w-full px-4 py-3 border ${errors.city ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-primary-500 outline-none`}
                                placeholder="City"
                            />
                        </div>
                    </div>
                </div>

                {/* LinkedIn */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        LinkedIn URL
                    </label>
                    <div className="relative">
                        <Linkedin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="url"
                            value={data.linkedInUrl || ''}
                            onChange={(e) => onUpdate({ linkedInUrl: e.target.value })}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            placeholder="https://linkedin.com/in/username"
                        />
                    </div>
                </div>

                {/* Last Experience */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Last Company Worked
                        </label>
                        <div className="relative">
                            <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                value={data.lastCompany || ''}
                                onChange={(e) => onUpdate({ lastCompany: e.target.value })}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                placeholder="Company Name"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Last Role Title
                        </label>
                        <div className="relative">
                            <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                value={data.lastRole || ''}
                                onChange={(e) => onUpdate({ lastRole: e.target.value })}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                placeholder="Job Title"
                            />
                        </div>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Target Job Title <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <Target className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                value={data.targetJobTitle || ''}
                                onChange={(e) => onUpdate({ targetJobTitle: e.target.value })}
                                className={`w-full pl-10 pr-4 py-3 border ${errors.targetJobTitle ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-primary-500 outline-none`}
                                placeholder="e.g. Senior Product Manager"
                            />
                        </div>
                        {errors.targetJobTitle && <p className="text-red-500 text-xs mt-1">{errors.targetJobTitle}</p>}
                    </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex gap-4 pt-6">
                    <button
                        type="button"
                        onClick={onBack}
                        className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                    >
                        Back
                    </button>
                    <button
                        type="submit"
                        className="flex-1 bg-primary-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                    >
                        Continue
                    </button>
                </div>
            </form>
        </div>
    )
}
