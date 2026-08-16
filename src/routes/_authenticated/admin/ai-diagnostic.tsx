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
        <Button onClick={handleRun} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Run Diagnostic"}
        </Button>
      </div>

      {error && (
        <Card className="bg-destructive/10 border-destructive/20">
          <CardContent className="pt-6 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-destructive font-medium">{error}</p>
          </CardContent>
        </Card>
      )}

      {results && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Environment Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(results.env).map(([key, value]) => (
                  <div key={key} className="flex flex-col gap-1 p-3 bg-muted rounded-lg">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground">{key.replace(/_/g, ' ')}</span>
                    <span className="font-mono text-sm">{String(value)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Test Results</h3>
            {results.tests.map((test: any, i: number) => (
              <Card key={i} className={test.status === 'SUCCESS' ? 'border-success/20' : 'border-destructive/20'}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      {test.status === 'SUCCESS' ? (
                        <CheckCircle2 className="h-5 w-5 text-success" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-destructive" />
                      )}
                      <div>
                        <h4 className="font-bold">{test.name}</h4>
                        <p className="text-xs text-muted-foreground">{test.status === 'SUCCESS' ? `Completed in ${test.duration}ms` : 'Request failed'}</p>
                      </div>
                    </div>
                    <div className={test.status === 'SUCCESS' ? 'text-success' : 'text-destructive'}>
                      <span className="text-[10px] font-bold uppercase px-2 py-1 rounded bg-current/10 border border-current/20">
                        {test.status}
                      </span>
                    </div>
                  </div>

                  {test.error && (
                    <div className="mt-4 p-4 bg-destructive/5 rounded-lg border border-destructive/10 overflow-auto max-h-64">
                      <pre className="text-xs text-destructive-foreground whitespace-pre-wrap">
                        {JSON.stringify(test.error, null, 2)}
                      </pre>
                    </div>
                  )}

                  {test.model && (
                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 bg-muted rounded">Model: {test.model}</div>
                      {test.usage && (
                        <div className="p-2 bg-muted rounded">Tokens: {test.usage.total_tokens}</div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {!results && !loading && !error && (
        <div className="text-center py-12 text-muted-foreground">
          Click "Run Diagnostic" to check the AI integration status.
        </div>
      )}
    </div>
  )
}
