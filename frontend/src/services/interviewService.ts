import { supabase } from '../lib/supabase';

const API_Base = import.meta.env.VITE_API_URL || '';

export const interviewService = {
    /**
     * Call the backend to generate personalized answers using AI
     */
    async generateAnswersAI(questionId?: string) {
        try {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                throw new Error('No active session');
            }

            const response = await fetch(`${API_Base}/api/ai/generate-answers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    questionId // Optional
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                const errorMessage = errorData.details || errorData.error || 'Failed to generate answers';
                throw new Error(errorMessage);
            }

            return await response.json();
        } catch (error) {
            console.error('Error in generateAnswersAI:', error);
            throw error;
        }
    }
};
