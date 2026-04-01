import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const getSmartSearchRecommendations = async (query: string, products: any[]) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `User searched for: "${query}". 
      Here is the list of available products: ${JSON.stringify(products.map(p => ({ id: p.id, title: p.title, category: p.category, tags: p.tags })))}.
      Return a JSON array of product IDs that best match the user's search intent, even if there are typos or semantic matches (e.g., "kicks" -> shoes).
      Limit to top 5 matches.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING
          }
        }
      }
    });

    const recommendedIds = JSON.parse(response.text || '[]');
    return recommendedIds;
  } catch (error) {
    console.error("AI Search Error:", error);
    return [];
  }
};
