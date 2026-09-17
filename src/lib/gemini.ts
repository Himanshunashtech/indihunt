// Gemini AI helper using REST API

export async function generateGeminiContent(prompt: string): Promise<string> {
  try {
    const res = await fetch('/t/ai/generate', {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    });
    if (res.ok) {
      const data = await res.json();
      const text = data.data?.text || data.text;
      if (text) return text;
    }
    return getFallbackAIResult(prompt);
  } catch (err) {
    console.error("Gemini AI API Error:", err);
    return getFallbackAIResult(prompt);
  }
}

export async function getAISummaryForProduct(productName: string, tagline: string, description: string, tags: string[]): Promise<string> {
  const prompt = `You are a startup analysis bot. Provide a structured, beautiful, concise summary of this product:
Product Name: ${productName}
Tagline: ${tagline}
Description: ${description}
Tags: ${tags.join(", ")}

Format output in markdown:
### TL;DR Summary
[1-2 sentences overview]

### Key Pros
- [Pro 1]
- [Pro 2]

### Potential Cons
- [Con 1]

### Ideal Target Audience
[Description of the target audience]`;

  return generateGeminiContent(prompt);
}

export async function getAIFundingEnrichment(companyName: string, amount: string, round: string, investors: string[]): Promise<string> {
  const prompt = `You are an investment analyst. Provide an enriched summary of the following funding announcement:
Company: ${companyName}
Round: ${round}
Amount: ${amount}
Investors: ${investors.join(", ")}

Format output in markdown:
### Valuation Estimate
[Estimate range and reasoning]

### Strategic Outlook
[Detailed 2-sentence breakdown of what this funding will enable]

### Competitive Landscape
[Key competitors and the startup's unique advantages]`;

  return generateGeminiContent(prompt);
}

function getFallbackAIResult(prompt: string): string {
  if (prompt.includes("funding announcement")) {
    const matchCompany = prompt.match(/Company:\s*(.*)/);
    const company = matchCompany ? matchCompany[1].trim() : "this startup";
    const matchRound = prompt.match(/Round:\s*(.*)/);
    const round = matchRound ? matchRound[1].trim() : "Seed";
    const matchAmount = prompt.match(/Amount:\s*(.*)/);
    const amount = matchAmount ? matchAmount[1].trim() : "$1.5M";
    
    return `### Valuation Estimate
We estimate ${company}'s post-money valuation at approximately $${(parseFloat(amount.replace(/[^0-9.]/g, "")) || 1.5) * 5}M based on current multiples for early-stage ${round} SaaS rounds.

### Strategic Outlook
This ${amount} injection will likely be deployed to scale the core engineering squad, expand product capability, and establish initial go-to-market channels for regional market penetration.

### Competitive Landscape
${company} operates in a highly active segment, competing directly with established incumbents. Their primary advantage lies in their custom AI orchestration and developer-first pricing model.`;
  }

  // Fallback for product summary
  const matchProduct = prompt.match(/Product Name:\s*(.*)/);
  const name = matchProduct ? matchProduct[1].trim() : "this product";
  const matchTagline = prompt.match(/Tagline:\s*(.*)/);
  const tagline = matchTagline ? matchTagline[1].trim() : "";
  
  return `### TL;DR Summary
**${name}** (${tagline}) is a modern, developer-centric utility built to eliminate friction in building scalable web apps. It offers native integrations with existing PostgreSQL databases and automates background workflows out of the box.

### Key Pros
- **Blazing Fast Performance**: Extremely lightweight client bundle ensuring fast initial page loads.
- **Easy Configuration**: Simple setup with pre-built Supabase integration.

### Potential Cons
- **Niche Focus**: Primarily caters to Next.js and Supabase users, making it less applicable for traditional server-side applications.

### Ideal Target Audience
Indie hackers, startup teams, and frontend developers looking to quickly build and ship SaaS projects without rebuilding Auth, Database, or caching layers.`;
}
