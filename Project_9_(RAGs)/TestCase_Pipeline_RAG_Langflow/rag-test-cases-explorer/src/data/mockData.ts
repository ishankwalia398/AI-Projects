import type { TestCase, LLMResponse, SearchResult, IngestionProgress } from '../types'

export const MOCK_TEST_CASES: TestCase[] = [
  {
    testCaseId: 'TC-1001',
    description: 'User should be able to add a product to the shopping cart from the product detail page',
    expectedResult: 'Product is added to cart and cart count increments by 1',
    status: 'passed',
    relevanceScore: 0.97,
    priority: 'high',
  },
  {
    testCaseId: 'TC-1002',
    description: 'Verify checkout flow with valid payment credentials processes order successfully',
    expectedResult: 'Order is created, payment is processed, confirmation page displays order ID',
    status: 'passed',
    relevanceScore: 0.94,
    priority: 'high',
  },
  {
    testCaseId: 'TC-1003',
    description: 'Search bar returns relevant products when typing partial product names',
    expectedResult: 'Autocomplete dropdown shows top 5 matching products within 300ms',
    status: 'passed',
    relevanceScore: 0.91,
    priority: 'medium',
  },
  {
    testCaseId: 'TC-1004',
    description: 'User can apply a promo code at checkout and see discounted total',
    expectedResult: 'Promo code is accepted, discount percentage reflected in order summary',
    status: 'passed',
    relevanceScore: 0.88,
    priority: 'high',
  },
  {
    testCaseId: 'TC-1005',
    description: 'Verify that expired session redirects user to login page on cart access',
    expectedResult: 'Session expired modal appears, user redirected to /login on dismissal',
    status: 'failed',
    relevanceScore: 0.85,
    priority: 'high',
  },
  {
    testCaseId: 'TC-1006',
    description: 'Validate that inventory count decrements after successful purchase',
    expectedResult: 'Stock count reduces by purchased quantity across all warehouse locations',
    status: 'blocked',
    relevanceScore: 0.82,
    priority: 'medium',
  },
  {
    testCaseId: 'TC-1007',
    description: 'User can filter products by category and price range simultaneously',
    expectedResult: 'Product grid updates to show only items matching both category and price filters',
    status: 'passed',
    relevanceScore: 0.79,
    priority: 'medium',
  },
  {
    testCaseId: 'TC-1008',
    description: 'Verify that wishlist persists across browser sessions for logged-in users',
    expectedResult: 'Wishlist items saved to user profile and restored on next login',
    status: 'passed',
    relevanceScore: 0.76,
    priority: 'low',
  },
  {
    testCaseId: 'TC-1009',
    description: 'Ensure that payment gateway timeout shows friendly error message',
    expectedResult: 'After 30s timeout, error banner displays "Payment service unavailable" with retry button',
    status: 'skipped',
    relevanceScore: 0.73,
    priority: 'medium',
  },
  {
    testCaseId: 'TC-1010',
    description: 'Validate that order history page loads all 12 months of data with pagination',
    expectedResult: 'Order history loads with infinite scroll, max 20 orders per fetch',
    status: 'passed',
    relevanceScore: 0.70,
    priority: 'low',
  },
]

export function generateIngestionSteps(): IngestionProgress[] {
  return [
    { step: 'upload', label: 'Upload File', status: 'pending' },
    { step: 'chunk', label: 'Chunk Text', status: 'pending' },
    { step: 'embed', label: 'Embed Data', status: 'pending' },
    { step: 'chroma', label: 'Store in Chroma', status: 'pending' },
  ]
}

export function simulateIngestionProgress(
  onStep: (steps: IngestionProgress[]) => void
): Promise<void> {
  const steps = generateIngestionSteps()
  const durations = [800, 1200, 1500, 1000]
  const stepKeys: (IngestionProgress['step'])[] = ['upload', 'chunk', 'embed', 'chroma']

  return new Promise((resolve) => {
    let i = 0
    const runNext = () => {
      if (i >= stepKeys.length) {
        resolve()
        return
      }
      steps[i] = { ...steps[i], status: 'in_progress' }
      onStep([...steps])

      setTimeout(() => {
        steps[i] = { ...steps[i], status: 'completed' }
        onStep([...steps])
        i++
        setTimeout(runNext, 300)
      }, durations[i])
    }
    runNext()
  })
}

export function simulateQueryResponse(
  query: string,
  searchType: 'similarity' | 'mmr',
  topK: number
): Promise<SearchResult> {
  const scoredCases = MOCK_TEST_CASES.map((tc, i) => ({
    ...tc,
    relevanceScore: Math.max(0.5, 0.97 - i * 0.03 - Math.random() * 0.05),
  })).sort((a, b) => b.relevanceScore - a.relevanceScore)

  const topDocs = scoredCases.slice(0, topK)

  const llmResponse: LLMResponse = simulateLLMGeneration(query, topDocs)

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        query,
        searchType,
        topK,
        retrievedDocs: topDocs,
        llmSynthesis: llmResponse,
      })
    }, 2000 + Math.random() * 1000)
  })
}

function simulateLLMGeneration(query: string, docs: TestCase[]): LLMResponse {
  const passedCount = docs.filter((d) => d.status === 'passed').length
  const failedCount = docs.filter((d) => d.status === 'failed').length
  const highPriorityCount = docs.filter((d) => d.priority === 'high').length

  const answer = `## Analysis Results

Based on semantic similarity search against **${docs.length}** retrieved test case documents matching your query: *"${query}"*

### Summary
- **Total Relevant Test Cases Found:** ${docs.length}
- **Passing Rate:** ${Math.round((passedCount / docs.length) * 100)}% (${passedCount}/${docs.length})
- **Failed/Blocked:** ${failedCount} test cases require attention
- **High Priority Items:** ${highPriorityCount} critical paths identified

### Key Findings
${docs.slice(0, 3).map((tc, i) => {
  const statusIcon = tc.status === 'passed' ? '✅' : tc.status === 'failed' ? '❌' : '⚠️'
  return `${i + 1}. **${tc.testCaseId}** ${statusIcon} — ${tc.description}
   - *Expected:* ${tc.expectedResult}
   - *Relevance:* ${(tc.relevanceScore * 100).toFixed(0)}% confident
   - *Status:* \`${tc.status}\``
}).join('\n\n')}

### Recommendations
1. Prioritize fixes for ${failedCount > 0 ? 'failed test scenarios affecting core user flows' : 'maintaining current passing rate across regression suites'}
2. Review ${docs.filter(d => d.priority === 'high').length} high-priority items for release-blocking issues
3. Consider expanding test coverage in areas with low confidence scores

*Generated via Groq Llama-3-70B · Semantic retrieval confidence: ${(docs.reduce((a, d) => a + d.relevanceScore, 0) / docs.length * 100).toFixed(0)}%*`

  return {
    answer,
    model: 'Llama-3-70B-Groq',
    latencyMs: Math.floor(1200 + Math.random() * 800),
    tokensUsed: Math.floor(350 + Math.random() * 200),
    confidence: docs.reduce((a, d) => a + d.relevanceScore, 0) / docs.length,
  }
}
