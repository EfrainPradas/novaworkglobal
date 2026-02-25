import { useState } from 'react'
import { X, ChevronLeft, ChevronRight, Calendar, Clock, User, CheckCircle } from 'lucide-react'

interface BookingModalProps {
    isOpen: boolean
    onClose: () => void
    serviceName: string
    price: number
}

export default function BookingModal({ isOpen, onClose, serviceName, price }: BookingModalProps) {
    const [step, setStep] = useState<'date' | 'details' | 'confirmation'>('date')
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [selectedTime, setSelectedTime] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        notes: ''
    })

    if (!isOpen) return null

    // Mock dates generation (next 7 days)
    const today = new Date()
    const dates = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today)
        d.setDate(today.getDate() + i + 1) // Start from tomorrow
        return d
    })

    // Mock times
    const times = [
        '09:00 AM', '10:00 AM', '11:00 AM',
        '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM'
    ]

    const handleDateSelect = (date: Date) => {
        setSelectedDate(date)
        setSelectedTime(null) // Reset time when date changes
    }

    const handleContinue = () => {
        if (step === 'date' && selectedDate && selectedTime) {
            setStep('details')
        } else if (step === 'details' && formData.name && formData.email) {
            setStep('confirmation')
        }
    }

    const handleSubmit = () => {
        // Here you would typically send the data to your backend
        console.log('Booking submitted:', { serviceName, price, selectedDate, selectedTime, formData })
        setStep('confirmation')
    }

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    }

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                {/* Background overlay */}
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                    {/* Close button */}
                    <div className="absolute top-4 right-4 z-10">
                        <button
                            onClick={onClose}
                            className="bg-white rounded-full p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                            <span className="sr-only">Close</span>
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    <div className="flex flex-col md:flex-row h-[600px]">
                        {/* Left Panel: Service Info */}
                        <div className="bg-gray-50 p-8 md:w-1/3 border-r border-gray-200">
                            <div className="mb-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-2">Service Details</h3>
                                <p className="text-primary-600 font-semibold text-xl">{serviceName}</p>
                                <p className="text-gray-500 mt-1">${price}</p>
                            </div>

                            <div className="mb-8">
                                <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">Your Coach</h4>
                                <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600">
                                        <User className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900">Expert Coach</p>
                                        <p className="text-xs text-gray-500">Certified Career Strategist</p>
                                    </div>
                                </div>
                            </div>

                            <div className="text-sm text-gray-600 space-y-3">
                                <div className="flex items-start gap-2">
                                    <Clock className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                    <p>45 min session via Microsoft Teams</p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                    <p>Select a date and time to confirm your spot.</p>
                                </div>
                            </div>
                        </div>

                        {/* Right Panel: Steps */}
                        <div className="p-8 md:w-2/3 overflow-y-auto">
                            {step === 'date' && (
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-bold text-gray-900">Select a Date & Time</h2>

                                    {/* Date Selection */}
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-700 mb-3">Available Dates</h3>
                                        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                                            {dates.map((date) => (
                                                <button
                                                    key={date.toISOString()}
                                                    onClick={() => handleDateSelect(date)}
                                                    className={`
                                                        flex-shrink-0 w-20 p-3 rounded-lg border text-center transition-all
                                                        ${selectedDate?.toDateString() === date.toDateString()
                                                            ? 'border-primary-600 bg-primary-50 text-primary-700 ring-2 ring-primary-600 ring-opacity-50'
                                                            : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                                                        }
                                                    `}
                                                >
                                                    <div className="text-xs font-medium uppercase text-gray-500 mb-1">
                                                        {date.toLocaleDateString('en-US', { weekday: 'short' })}
                                                    </div>
                                                    <div className="text-lg font-bold text-gray-900">
                                                        {date.getDate()}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Time Selection */}
                                    {selectedDate && (
                                        <div className="animate-fade-in">
                                            <h3 className="text-sm font-medium text-gray-700 mb-3">Available Times ({formatDate(selectedDate)})</h3>
                                            <div className="grid grid-cols-3 gap-3">
                                                {times.map((time) => (
                                                    <button
                                                        key={time}
                                                        onClick={() => setSelectedTime(time)}
                                                        className={`
                                                            py-2 px-3 rounded-md text-sm font-medium border transition-all
                                                            ${selectedTime === time
                                                                ? 'bg-primary-600 text-white border-primary-600 shadow-md'
                                                                : 'bg-white text-gray-700 border-gray-300 hover:border-primary-500 hover:bg-primary-50'
                                                            }
                                                        `}
                                                    >
                                                        {time}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="pt-6 border-t border-gray-200 mt-auto">
                                        <button
                                            onClick={handleContinue}
                                            disabled={!selectedDate || !selectedTime}
                                            className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-bold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Continue
                                        </button>
                                    </div>
                                </div>
                            )}

                            {step === 'details' && (
                                <div className="space-y-6">
                                    <button
                                        onClick={() => setStep('date')}
                                        className="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-1"
                                    >
                                        <ChevronLeft className="w-4 h-4" /> Back to Calendar
                                    </button>

                                    <h2 className="text-2xl font-bold text-gray-900">Enter Details</h2>

                                    <div className="space-y-4">
                                        <div>
                                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                            <input
                                                type="text"
                                                id="name"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                                placeholder="John Doe"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                            <input
                                                type="email"
                                                id="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                                placeholder="john@example.com"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Anything specific you'd like to discuss?</label>
                                            <textarea
                                                id="notes"
                                                rows={3}
                                                value={formData.notes}
                                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                                placeholder="I'm struggling with salary negotiation..."
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-6">
                                        <button
                                            onClick={handleContinue}
                                            disabled={!formData.name || !formData.email}
                                            className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-bold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Confirm Booking
                                        </button>
                                    </div>
                                </div>
                            )}

                            {step === 'confirmation' && (
                                <div className="h-full flex flex-col items-center justify-center text-center space-y-6 animate-fade-in">
                                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                        <CheckCircle className="w-10 h-10 text-green-600" />
                                    </div>
                                    <h2 className="text-3xl font-bold text-gray-900">Booking Confirmed!</h2>
                                    <p className="text-gray-600 max-w-md">
                                        You're all set for <strong>{selectedDate ? formatDate(selectedDate) : ''} at {selectedTime}</strong>.
                                    </p>
                                    <p className="text-gray-600 max-w-md">
                                        A calendar invitation has been sent to <strong>{formData.email}</strong> with the meeting link.
                                    </p>
                                    <button
                                        onClick={onClose}
                                        className="bg-gray-900 text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors mt-8"
                                    >
                                        Done
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
