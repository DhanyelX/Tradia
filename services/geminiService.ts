

import { GoogleGenAI, Type } from "@google/genai";
import { Trade, AINote, Account } from '../types';

export interface BehavioralPattern {
  name: 'Revenge Trading' | 'FOMO/Impulsive Entries' | 'Holding Losers Too Long' | 'Cutting Winners Short' | 'Over-Leveraging';
  detected: boolean;
  count: number;
  pnlImpact: number;
  insight: string;
}
export type BehavioralInsights = BehavioralPattern[];


export async function getAIFeedback(trade: Trade, allTrades: Trade[]): Promise<AINote> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const actualTrades = allTrades.filter(t => t.trade_taken);
    const winRate = actualTrades.length > 0 ? (actualTrades.filter(t => t.pnl > 0).length / actualTrades.length * 100).toFixed(1) : 'N/A';
    
    const truncatedNotes = trade.notes ? trade.notes.substring(0, 500) : '';

    const prompt = trade.trade_taken ?
      `
        As a professional trading coach, analyze the following trade in the context of the user's history.
        User's historical win rate is: ${winRate}%.

        Latest Trade Details:
        - Instrument: ${JSON.stringify(trade.instrument)}
        - Type: ${JSON.stringify(trade.pnl > 0 ? 'Win' : 'Loss')}
        - Profit/Loss: $${trade.pnl.toFixed(2)}
        - Risk/Reward Multiple: ${trade.rr}R
        - Risk Percentage: ${trade.risk_percentage}%
        - Notes: ${JSON.stringify(truncatedNotes)}
        - Tags: ${JSON.stringify(trade.tags)}

        Analyze the trade and provide feedback in JSON format.
        1.  "summary": A concise, one-sentence constructive feedback note.
        2.  "strength": (Optional) What the trader did well.
        3.  "weakness": (Optional) The main area for improvement.
        4.  "suggestion": (Optional) A concrete, actionable tip for the next trade.

        Focus on providing helpful, direct feedback.
      `
    :
      `
        As a professional trading coach, analyze the following market observation journal entry. The user decided NOT to take a trade.
        User's historical win rate on taken trades is: ${winRate}%.

        Observation Details:
        - Instrument Watched: ${JSON.stringify(trade.instrument)}
        - Notes/Rationale: ${JSON.stringify(truncatedNotes)}
        - Tags: ${JSON.stringify(trade.tags)}
        - Emotions Felt: During - ${JSON.stringify(trade.emotion_during_trade || 'N/A')}, After - ${JSON.stringify(trade.emotion_after_trade || 'N/A')}

        Analyze the observation and provide feedback in JSON format.
        Focus on the user's discipline, market analysis, or emotional state.
        1.  "summary": A concise, one-sentence constructive feedback note about their observation or decision-making.
        2.  "strength": (Optional) What the trader did well (e.g., showing discipline, good analysis).
        3.  "weakness": (Optional) Potential blind spots in their analysis.
        4.  "suggestion": (Optional) A concrete, actionable tip for future observations or trade entries.
      `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: 'A one-sentence summary of the feedback.' },
            strength: { type: Type.STRING, description: 'What the trader did well. Optional.' },
            weakness: { type: Type.STRING, description: 'The main area for improvement. Optional.' },
            suggestion: { type: Type.STRING, description: 'A concrete suggestion for the next trade. Optional.' },
          },
          required: ["summary"],
        },
      },
    });

    let jsonStr = response.text.trim();
    const feedback = JSON.parse(jsonStr);
    return feedback;

  } catch (error) {
    console.error("Error fetching AI feedback from Gemini:", error);
    return { summary: "Could not retrieve AI feedback at this time." };
  }
}

export async function getAIInsight(question: string, trades: Trade[]): Promise<string> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const actualTrades = trades.filter(t => t.trade_taken);
    const totalTrades = actualTrades.length;
    const netPnl = actualTrades.reduce((sum, t) => sum + t.pnl, 0);
    const winRate = totalTrades > 0 ? (actualTrades.filter(t => t.pnl > 0).length / totalTrades * 100).toFixed(1) : 'N/A';
    
    const tradeSummaryForContext = actualTrades.slice(0, 30).map(t => ({
      pnl: t.pnl.toFixed(2),
      instrument: t.instrument,
      tags: t.tags.slice(0, 5),
      duration_minutes: ((t.exit_timestamp.getTime() - (t.entry_timestamp?.getTime() || 0)) / 60000).toFixed(0),
      notes: t.notes.substring(0, 60)
    }));

    const systemInstruction = `
      You are "Tradia AI", a helpful and insightful trading coach integrated into a trading journal application.
      Your goal is to analyze the user's trading data to answer their questions and provide actionable advice.
      Be encouraging and focus on patterns. Keep responses concise and well-formatted.
      Use markdown-style formatting for lists (using '-') and bolding (using **).
      The user's trading data will be provided in the prompt.
    `;
    
    const contents = `
      Here is a summary of my trading data:
      - Total Trades Logged: ${totalTrades}
      - Overall Net P/L: $${netPnl.toFixed(2)}
      - Overall Win Rate: ${winRate}%
      - My recent trades data (JSON format): ${JSON.stringify(tradeSummaryForContext)}

      Based on this data, please answer my question: ${JSON.stringify(question)}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
      },
    });

    return response.text;

  } catch (error) {
    console.error("Error fetching AI insight from Gemini:", error);
    return "Sorry, I encountered an error while analyzing your data. Please try again later.";
  }
}

export async function getDashboardInsight(trades: Trade[]): Promise<string> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const actualTrades = trades.filter(t => t.trade_taken);
    if (actualTrades.length < 5) {
        return "Log more trades to unlock personalized AI insights on your dashboard!";
    }
    
    const tradeSummaryForContext = actualTrades.slice(-20).map(t => ({ // use last 20 trades
      pnl: t.pnl.toFixed(2),
      instrument: t.instrument,
      tags: t.tags.slice(0, 5),
      followedPlan: t.followed_plan,
      tradeQuality: t.trade_quality
    }));

    const prompt = `
      As a trading coach, analyze this trader's recent performance based on the following trades:
      ${JSON.stringify(tradeSummaryForContext)}

      Provide one single, powerful, and concise insight for their dashboard.
      This should be their biggest strength, a critical weakness they should focus on, or a notable pattern.
      Keep the response to a maximum of two sentences. Be direct and actionable.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text;

  } catch (error) {
    console.error("Error fetching dashboard insight from Gemini:", error);
    return "Could not retrieve AI insight at this time.";
  }
}

export async function getPropFirmCopilotInsight(
    account: Account,
    trades: Trade[]
): Promise<string> {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

        const accountTrades = trades.filter(t => t.account_id === account.id && t.trade_taken);
        const winRate = accountTrades.length > 0 ? (accountTrades.filter(t => t.pnl > 0).length / accountTrades.length * 100).toFixed(1) : 'N/A';

        // Summarize recent performance for context
        const tradeSummary = accountTrades.slice(-10).map(t => ({
            pnl: t.pnl.toFixed(2),
            instrument: t.instrument,
            tags: t.tags
        }));

        const systemInstruction = `
            You are "Tradia AI Co-pilot," a helpful and concise trading assistant for a trader using a prop firm account.
            Your goal is to provide actionable, clear, and brief recommendations for the upcoming trading day based on the trader's performance and known market risks.
            You MUST use a checklist format with emojis (✅, ⚠️, ❌).
            Be direct and encouraging. The user is looking for a pre-flight checklist.
        `;

        const contents = `
            Trader's Account Status:
            - Account Name: ${account.name}
            - Phase: ${account.phase}
            - Current Balance: $${account.balance.toFixed(2)}
            - Profit Target: $${account.rules?.profit_target.toFixed(2)}

            Trader's Recent Performance (on this account):
            - Win Rate: ${winRate}%
            - Last 10 trades summary: ${JSON.stringify(tradeSummary)}

            Based on ALL the above information, provide a short, actionable "Co-pilot Checklist" for the day.
            Focus on risk management, optimal trading times/conditions based on their history, and reminders about the prop firm rules.
            Keep it to 3-4 bullet points.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contents,
            config: {
                systemInstruction: systemInstruction,
            },
        });

        return response.text;

    } catch (error) {
        console.error("Error fetching AI co-pilot insight from Gemini:", error);
        return "Sorry, the AI co-pilot couldn't generate recommendations at this time.";
    }
}

export async function getAIReportSummary(reportData: any): Promise<string> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const { metrics, assetDistribution } = reportData;
    const topAsset = assetDistribution.sort((a:any,b:any) => b.pnl - a.pnl)[0];

    const prompt = `
      As a professional trading coach, analyze the following performance report summary and provide a concise, insightful executive summary (one paragraph, 3-4 sentences max).
      The summary should highlight key strengths, weaknesses, and notable patterns for the trader to review.

      Report Metrics:
      - Reporting Period: ${reportData.startDate.toLocaleDateString()} - ${reportData.endDate.toLocaleDateString()}
      - Net P/L: $${metrics.netPnl.toFixed(2)}
      - Win Rate: ${metrics.winRate.toFixed(1)}%
      - Profit Factor: ${isFinite(metrics.profitFactor) ? metrics.profitFactor.toFixed(2) : 'Infinity'}
      - Average Win/Loss Ratio: ${isFinite(metrics.avgRR) ? metrics.avgRR.toFixed(2) + ':1' : 'Infinity'}
      - Total Trades: ${metrics.totalTrades}
      - Max Drawdown: $${metrics.maxDrawdown.toFixed(2)}
      - Top Performing Asset: ${topAsset ? `${topAsset.name} (contributed $${topAsset.pnl.toFixed(2)})` : 'N/A'}

      Generate the summary now.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text.trim();
  } catch (error) {
    console.error("Error fetching AI report summary from Gemini:", error);
    return "Could not retrieve AI summary at this time.";
  }
}

export async function getBehavioralAnalysis(trades: Trade[]): Promise<BehavioralInsights> {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const actualTrades = trades.filter(t => t.trade_taken);
        if (actualTrades.length < 10) {
            return []; // Not enough data
        }

        const tradeSummaryForContext = actualTrades.slice(-50).map(t => ({ // Analyze last 50 trades
            pnl: t.pnl,
            rr: t.rr,
            risk_percentage: t.risk_percentage,
            tags: t.tags,
            followed_plan: t.followed_plan,
            entry_timestamp: t.entry_timestamp.toISOString(),
            exit_timestamp: t.exit_timestamp.toISOString(),
        }));
        
        const prompt = `
            You are a trading psychologist AI. Analyze the following trades from a user's journal to identify common negative behavioral patterns.
            For each pattern, determine if it's detected, count its occurrences, calculate the total P/L impact, and provide a one-sentence insight.

            Pattern Definitions:
            - Revenge Trading: A losing trade followed very quickly (within 2 hours) by another trade, which is often also a loss.
            - FOMO/Impulsive Entries: Look for trades with tags like 'FOMO', 'Impulsive', or where 'followed_plan' is false.
            - Holding Losers Too Long: Trades with a very large negative R-multiple (e.g., less than -1.2R), suggesting the stop loss was not respected.
            - Cutting Winners Short: Winning trades with a low R-multiple (e.g., less than 0.9R) especially if take_profit was defined and not hit.
            - Over-Leveraging: Identify trades where the 'risk_percentage' is significantly higher (e.g., >50%) than the user's average risk.

            Analyze this data:
            ${JSON.stringify(tradeSummaryForContext)}

            Return ONLY the JSON array matching the schema. Do not include any other text or markdown formatting.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING, description: "The name of the behavioral pattern." },
                            detected: { type: Type.BOOLEAN, description: "Whether the pattern was detected in the data." },
                            count: { type: Type.INTEGER, description: "How many times the pattern occurred." },
                            pnlImpact: { type: Type.NUMBER, description: "The total P/L of the trades where this pattern occurred." },
                            insight: { type: Type.STRING, description: "A concise, one-sentence insight about this pattern's effect." },
                        },
                        required: ["name", "detected", "count", "pnlImpact", "insight"]
                    }
                }
            }
        });
        
        let jsonStr = response.text.trim();
        const analysis = JSON.parse(jsonStr) as BehavioralInsights;
        return analysis.filter(pattern => pattern.detected && pattern.count > 0);

    } catch (error) {
        console.error("Error fetching AI behavioral analysis from Gemini:", error);
        // Return a default insight on error
        return [{
            name: "FOMO/Impulsive Entries",
            detected: true,
            count: 0,
            pnlImpact: 0,
            insight: "AI analysis could not run. Check your trade data for patterns like FOMO or revenge trading manually."
        }];
    }
}