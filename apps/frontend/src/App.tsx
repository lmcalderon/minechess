import { useRef, useState } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import type { PieceDropHandlerArgs } from 'react-chessboard'
import { requestLlmMove } from './api'

const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced', 'Grandmaster'] as const
type Difficulty = (typeof DIFFICULTIES)[number]

type Status = 'idle' | 'thinking' | 'error'

function movePairs(history: string[]) {
  const pairs: { moveNumber: number; white: string; black?: string }[] = []
  for (let i = 0; i < history.length; i += 2) {
    pairs.push({ moveNumber: i / 2 + 1, white: history[i], black: history[i + 1] })
  }
  return pairs
}

function describeGameOver(game: Chess): string | null {
  if (!game.isGameOver()) return null
  if (game.isCheckmate()) return `Checkmate — ${game.turn() === 'w' ? 'Black' : 'White'} wins`
  if (game.isStalemate()) return 'Draw — stalemate'
  if (game.isThreefoldRepetition()) return 'Draw — threefold repetition'
  if (game.isInsufficientMaterial()) return 'Draw — insufficient material'
  if (game.isDraw()) return 'Draw'
  return 'Game over'
}

function App() {
  const gameRef = useRef(new Chess())
  const [fen, setFen] = useState(gameRef.current.fen())
  const [history, setHistory] = useState<string[]>([])
  const [difficulty, setDifficulty] = useState<Difficulty>('Beginner')
  const [status, setStatus] = useState<Status>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [banter, setBanter] = useState<string | null>(null)

  async function requestLlmReply() {
    const game = gameRef.current
    setStatus('thinking')
    setErrorMessage(null)

    try {
      const { move, banter: reply } = await requestLlmMove({
        fen: game.fen(),
        history: game.history(),
        legalMoves: game.moves(),
        difficulty,
      })
      game.move(move)
      setFen(game.fen())
      setHistory(game.history())
      setBanter(reply)
      setStatus('idle')
    } catch (err) {
      setStatus('error')
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong asking the LLM for a move')
    }
  }

  function onPieceDrop({ sourceSquare, targetSquare }: PieceDropHandlerArgs): boolean {
    if (!targetSquare) return false

    const game = gameRef.current
    if (game.turn() !== 'w' || game.isGameOver() || status === 'thinking') return false

    try {
      game.move({ from: sourceSquare, to: targetSquare, promotion: 'q' })
    } catch {
      return false
    }

    setFen(game.fen())
    setHistory(game.history())
    if (!game.isGameOver()) {
      void requestLlmReply()
    }
    return true
  }

  const gameOverMessage = describeGameOver(gameRef.current)
  const gameStarted = history.length > 0

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <header className="border-b border-slate-800 px-6 py-4">
        <h1 className="text-xl font-semibold tracking-tight">LLM Chess</h1>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-6 p-6 sm:flex-row">
        <section className="w-full max-w-xl">
          <div className="mb-3 flex items-start gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-700 text-sm font-semibold">
              {difficulty[0]}
            </div>
            {banter && (
              <div className="rounded-lg rounded-tl-none bg-slate-800 px-3 py-2 text-sm text-slate-200">{banter}</div>
            )}
          </div>

          <Chessboard
            options={{
              position: fen,
              onPieceDrop,
              boardOrientation: 'white',
              boardStyle: { height: 'auto', aspectRatio: '1/1', gridTemplateRows: 'repeat(8, 1fr)' },
              squareStyle: { aspectRatio: 'auto', height: '100%' },
              canDragPiece: ({ piece }) =>
                !gameRef.current.isGameOver() &&
                status !== 'thinking' &&
                piece.pieceType.startsWith('w') &&
                gameRef.current.turn() === 'w',
              id: 'main-board',
            }}
          />

          <div className="mt-3 h-5 text-sm">
            {status === 'thinking' && <span className="text-slate-400">LLM is thinking…</span>}
            {gameOverMessage && <span className="text-slate-200">{gameOverMessage}</span>}
            {status === 'error' && errorMessage && <span className="text-red-400">{errorMessage}</span>}
          </div>
        </section>

        <aside className="flex w-full flex-col gap-4 rounded-lg bg-slate-800 p-4 sm:w-64">
          <label className="flex flex-col gap-1 text-sm text-slate-400">
            Difficulty
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty)}
              disabled={gameStarted}
              className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-slate-100 disabled:opacity-50"
            >
              {DIFFICULTIES.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-col gap-1 overflow-y-auto text-sm">
            <span className="text-slate-400">Moves</span>
            {movePairs(history).map(({ moveNumber, white, black }) => (
              <div key={moveNumber} className="flex gap-2">
                <span className="w-5 text-slate-500">{moveNumber}.</span>
                <span className="w-14">{white}</span>
                <span className="w-14">{black ?? ''}</span>
              </div>
            ))}
          </div>
        </aside>
      </main>
    </div>
  )
}

export default App
