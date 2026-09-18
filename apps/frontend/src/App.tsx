import { useRef, useState } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import type { PieceDropHandlerArgs } from 'react-chessboard'

const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced', 'Grandmaster'] as const
type Difficulty = (typeof DIFFICULTIES)[number]

function movePairs(history: string[]) {
  const pairs: { moveNumber: number; white: string; black?: string }[] = []
  for (let i = 0; i < history.length; i += 2) {
    pairs.push({ moveNumber: i / 2 + 1, white: history[i], black: history[i + 1] })
  }
  return pairs
}

function App() {
  const gameRef = useRef(new Chess())
  const [fen, setFen] = useState(gameRef.current.fen())
  const [history, setHistory] = useState<string[]>([])
  const [difficulty, setDifficulty] = useState<Difficulty>('Beginner')

  function onPieceDrop({ sourceSquare, targetSquare }: PieceDropHandlerArgs): boolean {
    if (!targetSquare) return false

    const game = gameRef.current
    if (game.turn() !== 'w') return false

    try {
      game.move({ from: sourceSquare, to: targetSquare, promotion: 'q' })
    } catch {
      return false
    }

    setFen(game.fen())
    setHistory(game.history())
    return true
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <header className="border-b border-slate-800 px-6 py-4">
        <h1 className="text-xl font-semibold tracking-tight">LLM Chess</h1>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-6 p-6 sm:flex-row">
        <section className="w-full max-w-xl">
          <Chessboard
            options={{
              position: fen,
              onPieceDrop,
              boardOrientation: 'white',
              canDragPiece: ({ piece }) => piece.pieceType.startsWith('w') && gameRef.current.turn() === 'w',
              id: 'main-board',
            }}
          />
        </section>

        <aside className="flex w-full flex-col gap-4 rounded-lg bg-slate-800 p-4 sm:w-64">
          <label className="flex flex-col gap-1 text-sm text-slate-400">
            Difficulty
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty)}
              className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-slate-100"
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
