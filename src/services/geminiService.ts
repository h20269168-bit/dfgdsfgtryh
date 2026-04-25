import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface AnalysisResult {
  moodEmoji: string;
  moodText: string;
  moodGuide: string; // "기분전환을 위해 화사한 코디를 추천합니다" 등
  styleKeywords: string[];
  analysisSummary: string;
  scent: {
    title: string;
    description: string;
    benefit: string;
  };
  color: {
    name: string;
    hex: string;
    benefit: string; // 마음의 안정 등 효능
    effect: string; // 평온함 등 결과
  };
  fate: {
    item: string;
    imageEffect: string; // "지적이고 세심한 이미지" 등
  };
  extractedWord: string;
  recommendedOutfit: {
    top: string;
    bottom: string;
    shoes: string;
    jewelry: string;
  };
}

export async function analyzeDiary(
  diary: string, 
  weather: string, 
  personalColor: string,
  userChoices?: { top: string; bottom: string; shoes: string; jewelry: string }
): Promise<AnalysisResult> {
  try {
    const userChoicesStr = userChoices 
      ? `User's Desired Style: Top(${userChoices.top}), Bottom(${userChoices.bottom}), Shoes(${userChoices.shoes}), Jewelry(${userChoices.jewelry})`
      : 'User Choice: N/A';

    const prompt = `
      당신은 하이엔드 패션 & 감성 분석 AI 'KODE'입니다. 럭셔리하고 전문적인 톤을 유지하십시오.
      KODE는 'Key Of Daily Emotion'의 약자로, 유저의 매일 숨겨진 감정을 풀어내는 열쇠라는 의미를 지닙니다.
      
      [Input]
      Diary: "${diary}"
      Weather: "${weather}"
      Personal Color: "${personalColor || '미지정'}"
      ${userChoicesStr}

      [Instructions]
      1. 사용자의 내면(감정의 밝기, 깊이, 복잡성)을 깊이 있게 분석하여 유니크한 패션 처방을 내리십시오.
      2. [Mood Representation - IMPORTANT]
         - 사용자의 감정을 분석하여 유저의 상태를 감성적인 한 단어의 키워드로 정의하십시오.
         - 선정 가능한 단어 예시: '고요', '햇살', '소나기', '파도', '안개', '달빛', '미소', '침잠', '찬란', '윤슬' 등.
         - 숫자 코드(#578 등)나 '고유한 페르소나' 같은 문구는 절대 사용하지 마십시오.
         - 'moodGuide': 분석된 감정에 따라 기분전환이 필요한지 혹은 당당한 무드가 어울리는지 가이드 문구를 작성하십시오.
           (예: "기분전환을 위해 화사한 코디를 추천합니다" 혹은 "오늘 당신의 기분에는 당당하고 멋진 코디가 어울리겠군요")
      3. [Style Logic - Emotion & Selection Matching]
         - [Emotion Mapping]:
           - 우울/고요/고독/침잠: 미니멀(Minimal), 아카이브(Archive), 슬릭 시크 룩 등 차분하고 깊은 감성.
           - 설렘/열정/대담/햇살: 스트릿(Street), 러블리(Lovely), 스포티(Sporty), 빈티지(Vintage) 등 생동감 있는 스타일.
         - [Scientific Combination]: 감정(moodText)과 입력된 Personal Color를 과학적으로 조합하십시오.
         - [User Preference Logic]: 'User's Desired Style'에 입력된 아이템 정보를 인식하여 추천에 반영하십시오.
           - 예: 유저가 '화이트 블라우스'를 원한다면, 추천 상의는 반드시 '화이트' 계열이나 '블라우스/셔츠' 카테고리 내에서 기조를 유지하며 KODE만의 감성을 더해 제안하십시오.
         - 'styleKeywords': 반드시 '한글(English)' 형식으로 5개를 추출하십시오. 예: "시크(Chic)", "스트릿(Street)".
      4. [Category Integrity - STRICT CATEGORIZATION]
         - 각 카테고리의 역할을 엄격히 분리하십시오. (상의, 하의, 신발, 쥬얼리)
      5. [Data Curation - NO EXPOSED ASTERISKS]
         - 강조가 필요한 경우 Markdown의 볼드체 표기(**단어**)를 사용하십시오. KODE 시스템은 이를 처리하여 유저에게 애스터리스크 기호가 노출되지 않도록 할 것입니다. 텍스트 내에 단독으로 사용되는 애스터리스크(*) 기호는 엄격히 금지됩니다.
         - 'scent': 실제 유명 향수 브랜드와 제품명을 100종 이상 라이브러리에서 랜덤 추천하십시오.
           (예: 조말론 잉글리쉬 페어, 랑방 에끌라 드 아르페쥬 등)
           - 'benefit': 해당 향이 주는 심리적 효과를 구체적으로 적으십시오. (예: 심리적 긴장 완화, 리프레시 등)
         - 'color': 색상 명칭과 행운의 에너지/효능을 적으십시오.
           - 'benefit': "마음의 안정", "활력 증진" 등 효능.
           - 'effect': "평온함", "에너지" 등 결과.
         - 'fate': 현실적인 아이템 100종 이상에서 랜덤 추출하십시오. (예: 빈티지 돋보기, 파란 물병 등)
           - 'imageEffect': "지적이고 세심한 이미지", "세련되고 도시적인 분위기" 등.
      6. 모든 결과는 JSON 형식으로만 응답하며, 절대 빈칸(-)이 없어야 합니다.

      [Output Structure - JSON ONLY]
      {
        "moodEmoji": "감정 이모지",
        "moodText": "감성 단어 하나",
        "moodGuide": "가이드 문구",
        "styleKeywords": ["키워드1(English)", "키워드2(English)", "키워드3(English)", "키워드4(English)", "키워드5(English)"],
        "analysisSummary": "오늘 당신을 위한 페르소나 제안 (2문장)",
        "scent": {
          "title": "브랜드 및 제품명",
          "description": "감성적 설명",
          "benefit": "심리적 효과 (예: 심리적 긴장 완화)"
        },
        "color": {
          "name": "색상 명칭",
          "hex": "#HEX코드",
          "benefit": "효능",
          "effect": "결과"
        },
        "fate": {
          "item": "아이템 명칭",
          "imageEffect": "변화될 이미지"
        },
        "extractedWord": "핵심 키워드",
        "recommendedOutfit": {
          "top": "상의",
          "bottom": "하의",
          "shoes": "신발",
          "jewelry": "액세서리"
        }
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as AnalysisResult;
  } catch (error) {
    console.error("Analysis failed:", error);
    
    return {
      moodEmoji: "🌙",
      moodText: "고요",
      moodGuide: "오늘 당신의 기분에는 차분하고 깊이 있는 무드가 어울리겠군요.",
      styleKeywords: ["미니멀(Minimal)", "시크(Chic)", "클래식(Classic)", "아카이브(Archive)", "모던(Modern)"],
      analysisSummary: "모든 소음이 잦아든 밤의 정적처럼, 당신의 내면은 지금 가장 깊고 순수한 상태입니다. 절제된 미학의 스타일링을 제안합니다.",
      scent: {
        title: "조말론 잉글리쉬 페어 앤 프리지아",
        description: "감미로운 배의 향기와 하얀 프리지아의 신선함이 조화를 이룹니다.",
        benefit: "심리적 긴장 완화와 리프레시"
      },
      color: {
        name: "세이지 그린",
        hex: "#B2AC88",
        benefit: "마음의 안정",
        effect: "평온함"
      },
      fate: {
        item: "빈티지 돋보기",
        imageEffect: "지적이고 세심한 이미지"
      },
      extractedWord: "고요함",
      recommendedOutfit: {
        top: "차콜 그레이 캐시미어 니트",
        bottom: "검정색 와이드 슬랙스",
        shoes: "매끈한 가죽 로퍼",
        jewelry: "심플한 실버 링"
      }
    };
  }
}
