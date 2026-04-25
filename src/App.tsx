import { GoogleGenerativeAI } from "@google/generative-ai";

// Vercel 설정창의 Key 이름을 여기서 부르는 겁니다.
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(API_KEY || "");

export const analyzeDiary = async (diary: string, weather: string, personalColor: string, userChoices: any) => {
  if (!API_KEY) throw new Error("API 키가 설정되지 않았습니다.");

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const prompt = `일기: ${diary}, 날씨: ${weather}, 퍼스널컬러: ${personalColor}. 이 정보를 바탕으로 기분과 코디를 JSON으로 분석해줘.`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return JSON.parse(jsonMatch![0]);
};
