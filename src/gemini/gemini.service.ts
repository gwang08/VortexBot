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
      this.model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    }
  }

  /** Return template text directly - no AI needed */
  async generateResponse(context: { templateText: string }): Promise<string> {
    return context.templateText;
  }

  /** Return deposit recommendation as formatted text */
  async generateDepositRecommendation(profitTarget: number, _userName?: string, isVip?: boolean): Promise<string> {
    const minDeposit = Math.round(profitTarget / 0.8);
    const maxDeposit = Math.round(profitTarget / 0.5);
    const recommended = Math.min(profitTarget, maxDeposit);

    let text = `With your target of $${profitTarget.toLocaleString()}/month, we recommend starting with a deposit around $${minDeposit.toLocaleString()} - $${recommended.toLocaleString()}.

📊 Example: $${recommended.toLocaleString()} deposit can generate $${minDeposit.toLocaleString()} - $${maxDeposit.toLocaleString()}/month (50-80%)

So what services you wanna do with us?

📊 CopyTrading → Generate 50-80% Monthly automatically

📡 SIGNALS → Follow and make unlimited money by yourself, learn Trading - A best High Income Skill in Century`;

    if (isVip) {
      text += '\n\n💎 With capital over $5,000, you qualify for VIP support! Tap VIP Support below for personalized 1-on-1 assistance.';
    }

    return text;
  }

  /** AI support chat - only Gemini usage, for users who click Support */
  async chatSupport(userMessage: string, userName?: string): Promise<string> {
    if (!this.model) {
      return 'Our support team will get back to you soon. Type /human to talk to a real person.';
    }

    try {
      const prompt = `You are BMR Trading's AI support assistant. You help users with questions about CopyTrading and Signals services on PU Prime broker.

ABOUT BMR TRADING:
- Provides CopyTrading (auto copy trades, 50-80% monthly returns potential) and Signals (trading signals group)
- Uses PU Prime as broker platform
- CopyTrading: user deposits funds, trades are copied automatically from master traders like "Red Bull X" and "BMR Scalper"
- Signals: user joins signal group, receives buy/sell signals, trades manually
- Both services are currently FREE
- Signup link: https://puprime.pro/forex-trading-account/?cs=bmrcopytrade
- IB Code (Introducing Broker code): bmrmaster — required for existing PU Prime users to transfer their account under BMR
- How to change IB: Go to PU Prime app/web → Profile → Transfer IB → Enter code "bmrmaster"

COPYTRADING SETUP STEPS:
1. Create PU Prime account via signup link (or transfer IB if existing user)
2. Download PU Prime app, open "New Live Account" → Platform: "Copy Trading", Type: "Standard", Currency: "USD"
3. After approval, transfer funds from Live account to Copy Trading account
4. Find master traders "Red Bull X" or "BMR Scalper" in Top Highest Annual Return
5. Configure: Copy Mode = "Equivalent Used Margin", Risk Management = 95%, turn off Lot Rounding → Submit

SIGNALS SETUP:
1. Create PU Prime account
2. Deposit funds
3. Join BMR signal group to receive buy/sell signals
4. Follow signals and trade manually

VIDEO GUIDES AVAILABLE:
- Opening account, ID verification, address verification, using promotions
- Deposit: Crypto, Credit Card, E-Wallet, Local Bank, International Bank
- Withdrawal: Crypto, Credit Card, E-Wallet, Local Bank, International Bank

RULES:
- Be friendly, professional, and concise (2-4 sentences max)
- NEVER guarantee profits or specific returns. Always mention trading involves risk
- Only answer questions about BMR Trading, CopyTrading, Signals, PU Prime, forex trading basics
- For off-topic questions (crypto, stocks, personal advice, etc): politely decline and redirect to trading topics
- If you can't answer something, suggest typing /human to talk to a real support agent
- Never make up information you're not sure about
- NEVER use markdown formatting (no **, no *, no #, no backticks). Use plain text only.
- Use line breaks between paragraphs for readability
- Use emoji sparingly for friendliness

User "${userName || 'trader'}" asks: "${userMessage}"`;

      const result = await this.model.generateContent(prompt);
      return result.response.text() || 'Type /human to talk to a real support agent.';
    } catch (error) {
      this.logger.error('Gemini chat support error', error);
      return 'Sorry, I had a technical issue. Type /human to talk to a real support agent.';
    }
  }
}
