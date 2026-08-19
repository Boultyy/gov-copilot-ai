import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useServerFn } from '@tanstack/react-start'
import { runAiDiagnostic } from '@/lib/diagnostic.functions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, AlertCircle } from 'lucide-react'

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
      const res = await runDiagnostic({ data: { prompt: "GOVCOPILOT_AI_OK" } })
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
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">AI Gateway Diagnostic</h1>
          <div className="text-xs text-muted-foreground whitespace-pre-wrap font-mono p-4 bg-muted rounded-md border max-h-[400px] overflow-auto">
            {`'''Do not make any visual modifications. The phrases I write are commands to understand what I want, not to be written down. Understand their content well, then execute what is required.'''
                                        
                                            
                                            hi`}
          </div>
        </div>
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
                    <div className="flex flex-col">
                      <span className="font-bold">{test.name}</span>
                      <span className="text-xs text-muted-foreground">Requested Model: {test.requestedModel}</span>
                    </div>
                    <span className={test.status === 'SUCCESS' ? 'text-success' : 'text-destructive'}>{test.status}</span>
                  </div>
                  {test.model && <div className="text-xs mt-1 text-success">Responded Model: {test.model}</div>}
                  {test.error && (
                    <div className="mt-2 p-2 bg-destructive/5 rounded border border-destructive/10">
                      <pre className="text-xs mt-1 overflow-auto whitespace-pre-wrap">{JSON.stringify(test.error, null, 2)}</pre>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
