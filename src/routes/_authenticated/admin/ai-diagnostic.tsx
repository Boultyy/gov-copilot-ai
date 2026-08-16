import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useServerFn } from '@tanstack/react-start'
import { runAiDiagnostic } from '@/lib/diagnostic.functions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

export const Route = createFileRoute('/_authenticated/admin/ai-diagnostic')({
  component: AiDiagnosticPage
})

function AiDiagnosticPage() {
  const runDiagnostic = useServerFn(runAiDiagnostic)
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRun = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await runDiagnostic({ data: { prompt: "Ping" } })
      setResults(res)
    } catch (e: any) {
      setError(e.message || "Failed to run diagnostic")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">AI Gateway Diagnostic</h1>
        <Button onClick={handleRun} disabled={loading} id="run-diagnostic-btn">
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Run Diagnostic"}
        </Button>
      </div>

      {error && (
        <Card className="bg-destructive/10 border-destructive/20" id="error-card">
          <CardContent className="pt-6 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-destructive font-medium">{error}</p>
          </CardContent>
        </Card>
      )}

      {results && (
        <div className="space-y-6" id="results-area">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              {results.tests.map((test: any, i: number) => (
                <div key={i} className="p-4 border rounded mb-2">
                  <div className="flex justify-between">
                    <span className="font-bold">{test.name}</span>
                    <span className={test.status === 'SUCCESS' ? 'text-success' : 'text-destructive'}>{test.status}</span>
                  </div>
                  {test.error && <pre className="text-xs mt-2 overflow-auto">{JSON.stringify(test.error, null, 2)}</pre>}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
