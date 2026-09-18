import { useRef, useState } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import type { PieceDropHandlerArgs } from 'react-chessboard'
import { requestLlmMove } from './api'
import lightSquareTexture from './assets/textures/stripped_spruce_log.png'
import darkSquareTexture from './assets/textures/stripped_dark_oak_log.png'
import beginnerAvatar from './assets/avatars/beginner.png'
import intermediateAvatar from './assets/avatars/intermediate.png'
import advancedAvatar from './assets/avatars/advanced.png'
import grandmasterAvatar from './assets/avatars/grandmaster.png'
import mcBeginnerAvatar from './assets/avatars-minecraft/beginner.png'
import mcIntermediateAvatar from './assets/avatars-minecraft/intermediate.png'
import mcAdvancedAvatar from './assets/avatars-minecraft/advanced.png'
import mcGrandmasterAvatar from './assets/avatars-minecraft/grandmaster.png'

const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced', 'Grandmaster'] as const
type Difficulty = (typeof DIFFICULTIES)[number]

const BOT_THEMES = ['Default', 'Minecraft'] as const
type BotTheme = (typeof BOT_THEMES)[number]

const DIFFICULTY_BLURB: Record<Difficulty, string> = {
  Beginner: 'Nervous and a little unsure. Expect genuine beginner mistakes.',
  Intermediate: 'Casual and friendly, with some light trash talk.',
  Advanced: 'Confident and competitive. Sharp tactics, a bit cocky about it.',
  Grandmaster: 'Cold, terse, and supremely confident. Plays the strongest move it can find.',
}

const AVATARS_BY_THEME: Record<BotTheme, Record<Difficulty, string>> = {
  Default: {
    Beginner: beginnerAvatar,
    Intermediate: intermediateAvatar,
    Advanced: advancedAvatar,
    Grandmaster: grandmasterAvatar,
  },
  Minecraft: {
    Beginner: mcBeginnerAvatar,
    Intermediate: mcIntermediateAvatar,
    Advanced: mcAdvancedAvatar,
    Grandmaster: mcGrandmasterAvatar,
  },
}

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
  if (game.isStalemate()) return 'Draw by stalemate'
  if (game.isThreefoldRepetition()) return 'Draw by threefold repetition'
  if (game.isInsufficientMaterial()) return 'Draw by insufficient material'
  if (game.isDraw()) return 'Draw'
  return 'Game over'
}

function App() {
  const gameRef = useRef(new Chess())
  const [fen, setFen] = useState(gameRef.current.fen())
  const [history, setHistory] = useState<string[]>([])
  const [difficulty, setDifficulty] = useState<Difficulty>('Beginner')
  const [theme, setTheme] = useState<BotTheme>('Default')
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

  function newGame() {
    gameRef.current = new Chess()
    setFen(gameRef.current.fen())
    setHistory([])
    setBanter(null)
    setStatus('idle')
    setErrorMessage(null)
  }

  const gameOverMessage = describeGameOver(gameRef.current)
  const gameStarted = history.length > 0

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800/80 px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-baseline gap-3">
          <h1 className="text-xl font-semibold tracking-tight">LLM Chess</h1>
          <span className="text-sm text-slate-500">You play White. OpenAI plays Black.</span>
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-6 p-6 sm:flex-row sm:items-start">
        <section className="w-full max-w-xl">
          <div className="mb-3 flex min-h-[3rem] items-start gap-2">
            <div
              className={`h-9 w-9 shrink-0 overflow-hidden rounded-full bg-slate-800 ring-2 transition-colors ${
                status === 'thinking' ? 'ring-emerald-500' : 'ring-transparent'
              }`}
            >
              <img src={AVATARS_BY_THEME[theme][difficulty]} alt="" className="h-full w-full object-cover" />
            </div>
            {banter && (
              <div className="relative rounded-lg rounded-tl-none bg-slate-800 px-3 py-2 text-sm text-slate-200 shadow-sm">
                {banter}
              </div>
            )}
          </div>

          <div className="overflow-hidden rounded-xl shadow-xl shadow-black/30 ring-1 ring-slate-800">
            <Chessboard
              options={{
                position: fen,
                onPieceDrop,
                boardOrientation: 'white',
                boardStyle: { height: 'auto', aspectRatio: '1/1', gridTemplateRows: 'repeat(8, 1fr)' },
                squareStyle: { aspectRatio: 'auto', height: '100%' },
                ...(theme === 'Minecraft'
                  ? {
                      lightSquareStyle: {
                        backgroundImage: `url(${lightSquareTexture})`,
                        backgroundSize: 'cover',
                        imageRendering: 'pixelated' as const,
                      },
                      darkSquareStyle: {
                        backgroundImage: `url(${darkSquareTexture})`,
                        backgroundSize: 'cover',
                        imageRendering: 'pixelated' as const,
                      },
                    }
                  : {}),
                canDragPiece: ({ piece }) =>
                  !gameRef.current.isGameOver() &&
                  status !== 'thinking' &&
                  piece.pieceType.startsWith('w') &&
                  gameRef.current.turn() === 'w',
                id: 'main-board',
              }}
            />
          </div>

          <div className="mt-3 min-h-[1.5rem] text-sm">
            {status === 'thinking' && (
              <span className="inline-flex items-center gap-1.5 text-slate-400">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                LLM is thinking…
              </span>
            )}
            {gameOverMessage && (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-900/40 px-2 py-1 font-medium text-emerald-300">
                {gameOverMessage}
              </span>
            )}
            {status === 'error' && errorMessage && <span className="text-red-400">{errorMessage}</span>}
          </div>
        </section>

        <aside className="flex w-full flex-col gap-5 rounded-xl bg-slate-900 p-4 ring-1 ring-slate-800 sm:w-64">
          <div className="flex flex-col gap-1.5 text-sm text-slate-400">
            Bot theme
            <div className="inline-flex w-fit rounded-md border border-slate-700 bg-slate-950 p-0.5">
              {BOT_THEMES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTheme(t)}
                  aria-pressed={theme === t}
                  className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                    theme === t ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5 text-sm text-slate-400">
            Difficulty
            <div className="flex gap-2">
              {DIFFICULTIES.map((level, index) => {
                const selected = difficulty === level
                const isFirst = index === 0
                const isLast = index === DIFFICULTIES.length - 1
                const tooltipPosition = isFirst
                  ? 'left-0'
                  : isLast
                    ? 'right-0'
                    : 'left-1/2 -translate-x-1/2'
                return (
                  <div key={level} className="group relative">
                    <button
                      type="button"
                      onClick={() => setDifficulty(level)}
                      disabled={gameStarted}
                      aria-pressed={selected}
                      aria-label={`${level}: ${DIFFICULTY_BLURB[level]}`}
                      className={`h-12 w-12 overflow-hidden rounded-full border-2 bg-slate-800 transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                        selected ? 'border-emerald-500' : 'border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      <img src={AVATARS_BY_THEME[theme][level]} alt="" className="h-full w-full object-cover" />
                    </button>

                    <div
                      role="tooltip"
                      className={`pointer-events-none absolute top-full z-10 mt-2 w-48 rounded-md border border-slate-700 bg-slate-800 px-2.5 py-2 text-xs opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 ${tooltipPosition}`}
                    >
                      <div className="font-semibold text-slate-100">{level}</div>
                      <div className="mt-0.5 text-slate-400">{DIFFICULTY_BLURB[level]}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-1 overflow-y-auto font-mono text-sm">
            <span className="mb-1 font-sans text-slate-400">Moves</span>
            {movePairs(history).map(({ moveNumber, white, black }) => (
              <div key={moveNumber} className="flex gap-2 rounded px-1 py-0.5 odd:bg-slate-800/40">
                <span className="w-5 text-slate-500">{moveNumber}.</span>
                <span className="w-14">{white}</span>
                <span className="w-14">{black ?? ''}</span>
              </div>
            ))}
            {history.length === 0 && <span className="font-sans text-slate-600">No moves yet.</span>}
          </div>

          <button
            type="button"
            onClick={newGame}
            className="rounded-md border border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-300 transition-colors hover:border-emerald-600 hover:text-emerald-400"
          >
            New game
          </button>
        </aside>
      </main>
    </div>
  )
}

export default App
