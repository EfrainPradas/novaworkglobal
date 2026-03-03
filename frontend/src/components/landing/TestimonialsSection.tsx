import { Quote } from 'lucide-react';

const testimonials = [
    {
        role: "Managing Partner – DXC",
        quote: "NovaWork is an exceptional career advisory partner that truly understands how to bring out the best in its clients. Their team helped me successfully navigate my career options, which ultimately led to a new executive role with a Fortune 500 company. NovaWork’s ability to challenge assumptions, broaden perspective, and help build a clear, actionable plan was key to my successful transition. Even during the most frustrating moments, the team knew how to push past barriers and instill confidence throughout the entire process."
    },
    {
        role: "Senior Business Communication Lead – Aramco",
        quote: "I found the NovaWork team to be highly engaging, dependable, and full of integrity. They delivered from the very first meeting, helping me craft a plan around what I wanted to achieve, ensuring every important detail was covered, and ultimately guiding me toward negotiating the best possible package for myself. NovaWork is intuitive, efficient, and able to cut through unnecessary details quickly, which means you get results fast. Their team has a natural ability to empower clients forward."
    },
    {
        role: "Chief Development Officer – Quadratec",
        quote: "I do not give recommendations lightly, so when I take the time to write one, I sincerely mean it. NovaWork is not just another career services company; it is a truly outstanding partner that should not be overlooked. I was close to spending $15,000 on what was supposed to be a top-tier provider for resume writing, LinkedIn management, and recruiting support. Thankfully, I found NovaWork first. If you are looking for excellence in these areas, you have found it. Their team is honest, direct, sincere, and smart. They know the process, and the investment you make comes back many times over. It certainly did for me, and I owe a great deal to NovaWork for helping make it happen."
    },
    {
        role: "Consultant – Inter-American Development Bank",
        quote: "Less than two weeks after completing my work with NovaWork, I received several offers, one of which turned out to be a perfect fit. I owe a lot to their team and highly recommend them. They went the extra mile by listening carefully, thinking creatively, and turning my job search into an immediate success, especially during a time and in a market where demand was limited."
    }
];

export default function TestimonialsSection() {
    return (
        <section className="py-24 bg-gray-50 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-sm font-semibold text-blue-600 tracking-wide uppercase">CLIENT TESTIMONIALS</h2>
                    <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                        Success Stories from Global Leaders
                    </p>
                    <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
                        Discover how we have partnered with executives and professionals to transform their career trajectories.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                    {testimonials.map((testimonial, idx) => (
                        <div
                            key={idx}
                            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-10 relative flex flex-col transition-all duration-300 hover:shadow-md hover:-translate-y-1"
                        >
                            <Quote className="absolute top-8 right-8 w-10 h-10 text-blue-100 transform rotate-180" />

                            <div className="flex-1 mb-6">
                                <p className="text-gray-700 text-lg leading-relaxed relative z-10 italic">
                                    "{testimonial.quote}"
                                </p>
                            </div>

                            <div className="mt-auto border-t border-gray-100 pt-6">
                                <p className="font-semibold text-gray-900 text-base">
                                    {testimonial.role}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
