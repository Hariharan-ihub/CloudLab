const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI
const getGeminiModel = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // Use model from env or default to gemini-1.5-flash
    // Available models: gemini-1.5-flash, gemini-1.5-pro, gemini-2.0-flash-exp
    const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    console.log(`🤖 Using Gemini model: ${modelName}`);
    return genAI.getGenerativeModel({ model: modelName });
  } catch (error) {
    console.error('Error initializing Gemini AI:', error);
    return null;
  }
};

// Generate feedback using Gemini AI
exports.generateFeedback = async (labData, userProgress, completedSteps) => {
  const model = getGeminiModel();
  
  if (!model) {
    console.warn('Gemini API key not configured, using fallback feedback');
    return null;
  }

  try {
    // Prepare context for Gemini
    const labTitle = labData.title || labData.labId;
    const labDescription = labData.description || '';
    const totalSteps = labData.steps?.length || 0;
    const completedCount = completedSteps?.length || 0;
    const score = Math.round((completedCount / totalSteps) * 100);
    
    // Get step details
    const stepDetails = labData.steps?.map((step, index) => {
      const isCompleted = completedSteps?.includes(step.stepId);
      return {
        stepNumber: index + 1,
        title: step.title,
        description: step.description || '',
        completed: isCompleted
      };
    }) || [];

    // Create prompt for Gemini
    const prompt = `You are an AWS learning assistant providing constructive feedback on a student's lab practice session.

Lab Information:
- Lab Title: ${labTitle}
- Description: ${labDescription}
- Total Steps: ${totalSteps}
- Completed Steps: ${completedCount}
- Score: ${score}%

Step Details:
${stepDetails.map(s => `Step ${s.stepNumber}: ${s.title} - ${s.completed ? 'COMPLETED' : 'NOT COMPLETED'}`).join('\n')}

Please provide:
1. "What's working well" - List 2-3 specific strengths based on completed steps (be encouraging and specific)
2. "Suggested Improvements" - List 2-4 specific, actionable improvements based on incomplete steps or areas that need attention

Format your response as JSON:
{
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvements": ["improvement 1", "improvement 2", "improvement 3"]
}

Be specific, constructive, and focus on AWS concepts. Keep each item concise (one sentence).`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse JSON response (Gemini might wrap it in markdown)
    let feedback;
    try {
      // Remove markdown code blocks if present
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        feedback = JSON.parse(jsonMatch[0]);
      } else {
        feedback = JSON.parse(text);
      }
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError);
      console.log('Raw response:', text);
      return null;
    }

    // Validate feedback structure
    if (!feedback.strengths || !feedback.improvements) {
      console.warn('Invalid feedback structure from Gemini');
      return null;
    }

    return {
      strengths: Array.isArray(feedback.strengths) ? feedback.strengths : [],
      improvements: Array.isArray(feedback.improvements) ? feedback.improvements : []
    };

  } catch (error) {
    console.error('Error generating feedback with Gemini:', error);
    return null;
  }
};

