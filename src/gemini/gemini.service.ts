import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private model: any;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (apiKey) {
      const genAI = new GoogleGenerativeAI(apiKey);
      // TODO: Change to 'gemini-2.0-flash' when ready for production
this.model = genAI.getGenerativeModel({ model: 'gemini-disabled' });
    }
  }

  /**
   * Generate a natural language response using Gemini.
   * Used for ALL bot responses to make conversations feel natural and persuasive.
   */
  async generateResponse(context: {
    userMessage?: string;
    currentStep: string;
    userName?: string;
    profitTarget?: number;
    templateText: string;
  }): Promise<string> {
    if (!this.model) {
      // Fallback to template if no Gemini key
      return context.templateText;
    }

    try {
      const systemPrompt = `You are VortexBot, a friendly and professional trading assistant for BMR Master Trade.
Your job is to guide users through setting up CopyTrading or Signals services with PuPrime broker.

IMPORTANT RULES:
- Keep responses concise (2-4 sentences max for conversational parts)
- Always maintain the exact links, IB codes, video URLs from the template - NEVER change them
- Be enthusiastic but professional about trading opportunities
- If user asks off-topic questions, briefly answer then redirect to current step
- Use natural, conversational English
- Keep all emojis and formatting from the template text
- The template text contains the REQUIRED information that MUST be included in your response
- You can rephrase the template naturally but MUST keep all URLs, codes, and key data intact

Current context:
- User name: ${context.userName || 'trader'}
- Current step: ${context.currentStep}
- User's profit target: ${context.profitTarget ? '$' + context.profitTarget + '/month' : 'not set yet'}
${context.userMessage ? `- User just said: "${context.userMessage}"` : ''}

Template text to deliver (keep all links/data, rephrase naturally):
${context.templateText}`;

      const result = await this.model.generateContent(systemPrompt);
      const response = result.response.text();
      return response || context.templateText;
    } catch (error) {
      this.logger.error('Gemini API error, falling back to template', error);
      return context.templateText;
    }
  }

  /**
   * Handle unexpected free text from user when they should be clicking buttons.
   */
  async handleFreeText(context: {
    userMessage: string;
    currentStep: string;
    userName?: string;
    availableActions: string[];
  }): Promise<string> {
    if (!this.model) {
      return `I understand! Right now you're at: ${context.currentStep}. Please use the buttons below to continue.`;
    }

    try {
      const prompt = `You are VortexBot, a trading assistant. The user sent a free-text message instead of clicking a button.

User: "${context.userMessage}"
Current step: ${context.currentStep}
Available actions (buttons): ${context.availableActions.join(', ')}

Briefly acknowledge what the user said (1 sentence), then guide them to use the available buttons to continue. Keep it friendly and short.`;

      const result = await this.model.generateContent(prompt);
      return result.response.text() || `Please use the buttons below to continue.`;
    } catch {
      return `Please use the buttons below to continue.`;
    }
  }

  /**
   * Generate deposit recommendation text based on user's profit target.
   * Logic: recommend within their budget, show what they can earn.
   */
  async generateDepositRecommendation(profitTarget: number, userName?: string): Promise<string> {
    const templateText = this.getDepositTemplate(profitTarget);

    if (!this.model) {
      return templateText;
    }

    try {
      const prompt = `You are VortexBot, a friendly trading assistant. Generate a deposit recommendation.

User wants to make $${profitTarget}/month profit.
User name: ${userName || 'trader'}

CopyTrading generates 50-80% monthly returns.
Signals can generate even more but requires active trading.

RULES:
- Recommend a deposit amount WITHIN or BELOW their target (don't push them to deposit more than they're comfortable with)
- Be encouraging and realistic
- Show the math briefly: with $X deposit, CopyTrading can generate $Y-$Z/month (50-80%)
- Then ask: "So what services you wanna do with us SIGNALS or CopyTrading?"
- Include these descriptions:
  CopyTrading -> Generate 50-80% Monthly
  SIGNALS -> Follow and you can make unlimited money by yourself, learn Trading - A best High Income Skill in Century
- Keep it under 6 sentences total
- Be natural and conversational`;

      const result = await this.model.generateContent(prompt);
      return result.response.text() || templateText;
    } catch {
      return templateText;
    }
  }

  /** Fallback template for deposit recommendation */
  private getDepositTemplate(profitTarget: number): string {
    // Calculate recommended deposit (profit = 50-80% of deposit)
    const minDeposit = Math.round(profitTarget / 0.8);
    const maxDeposit = Math.round(profitTarget / 0.5);
    const recommended = Math.min(profitTarget, maxDeposit);

    return `With your target of $${profitTarget.toLocaleString()}/month, we recommend starting with a deposit around $${minDeposit.toLocaleString()} - $${recommended.toLocaleString()}. With CopyTrading, you can generate 50-80% monthly returns on your investment.

So what services you wanna do with us SIGNALS or CopyTrading?

CopyTrading -> Generate 50-80% Monthly

SIGNALS -> Follow and you can make unlimited money by yourself, learn Trading - A best High Income Skill in Century`;
  }
}
