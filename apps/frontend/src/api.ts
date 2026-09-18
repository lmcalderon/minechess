const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'

export async function requestLlmMove(params: {
  fen: string
  history: string[]
  legalMoves: string[]
  difficulty: string
  theme: string
}): Promise<{ move: string; banter: string }> {
  const res = await fetch(`${API_BASE_URL}/api/move`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error ?? `Request failed with status ${res.status}`)
  }

  return (await res.json()) as { move: string; banter: string }
}
