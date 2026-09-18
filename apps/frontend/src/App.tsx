function App() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <header className="border-b border-slate-800 px-6 py-4">
        <h1 className="text-xl font-semibold tracking-tight">LLM Chess</h1>
      </header>

      <main className="mx-auto flex max-w-5xl gap-6 p-6">
        <section className="flex aspect-square w-full max-w-xl items-center justify-center rounded-lg bg-slate-800">
          <span className="text-slate-500">Board goes here</span>
        </section>

        <aside className="flex w-64 flex-col rounded-lg bg-slate-800 p-4">
          <span className="text-slate-500">Move history goes here</span>
        </aside>
      </main>
    </div>
  )
}

export default App
