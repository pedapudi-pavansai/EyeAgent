import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { getGeminiModelId } from '@/lib/ai/gemini-config'
import { createClient } from '@/lib/supabase/server'

export async function runRecommendationAgent(landlordId: string) {
  const llm = new ChatGoogleGenerativeAI({
    model: getGeminiModelId(),
    temperature: 0.3,
    apiKey: process.env.GOOGLE_API_KEY!,
  })
  const supabase = await createClient()

  const { data: financials } = await supabase
    .from('landlord_financials')
    .select('*')
    .eq('landlord_id', landlordId)
    .single()

  const { data: listings } = await supabase
    .from('marketplace_listings')
    .select('*')
    .limit(20)

  if (!financials || !listings) return listings || []

  const prompt = `You are a real estate investment advisor.

Landlord financial profile:
- Annual Income: $${financials.annual_income}
- Total Debt: $${financials.total_debt}
- Target IRR: ${financials.target_irr}%
- Preferred Markets: ${financials.preferred_markets?.join(', ')}

Available listings:
${listings.map((l: any, i: number) => `${i+1}. ${l.address} | $${l.price} | Cap Rate: ${l.cap_rate}% | C-o-C: ${l.cash_on_cash}% | Type: ${l.property_type}`).join('\n')}

For each listing, assign:
1. ai_tag: "Strong Match", "Consider", or "Avoid"
2. ai_thesis: 2-sentence investment rationale tailored to this landlord's goals

Respond ONLY in JSON array: [{"id": "listing_address", "ai_tag": "...", "ai_thesis": "..."}]`

  const response = await llm.invoke(prompt)
  let recommendations: any[] = []
  try {
    const clean = (response.content as string).replace(/```json|```/g, '').trim()
    recommendations = JSON.parse(clean)
  } catch {
    return listings
  }

  const enriched = listings.map((listing: any) => {
    const rec = recommendations.find((r: any) => r.id === listing.address)
    return { ...listing, ai_tag: rec?.ai_tag, ai_thesis: rec?.ai_thesis }
  })

  for (const item of enriched) {
    await supabase
      .from('marketplace_listings')
      .update({ ai_tag: item.ai_tag, ai_thesis: item.ai_thesis })
      .eq('id', item.id)
  }

  return enriched
}
