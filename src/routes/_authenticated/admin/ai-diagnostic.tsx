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
        <h1 className="text-2xl font-bold">'''Do not make any visual modifications. The phrases I write are commands to understand what I want, not to be written down. Understand their content well, then execute what is required.'''
                                        
                                            
                                            For the code present, I get the error below.

Please think step-by-step in order to resolve it.
```
Error: Citizen Copilot is temporarily unavailable due to a Lovable AI Gateway configuration issue (404). Please ensure 'Lovable AI' is enabled and 'Gemini' or 'OpenAI' models are accessible in your project's Cloud settings.

{
  "timestamp": 1787036444444,
  "error_type": "RUNTIME_ERROR",
  "filename": "https://localhost:8080/_serverFn/eyJmaWxlIjoiL3NyYy9saWIvY29waWxvdC5mdW5jdGlvbnMudHM_dHNzLXNlcnZlcmZuLXNwbGl0IiwiZXhwb3J0Ijoic2VuZENvcGlsb3RNZXNzYWdlX2NyZWF0ZVNlcnZlckZuX2hhbmRsZXIifQ",
  "lineno": 0,
  "colno": 0,
  "stack": "Error: Citizen Copilot is temporarily unavailable due to a Lovable AI Gateway configuration issue (404). Please ensure 'Lovable AI' is enabled and 'Gemini' or 'OpenAI' models are accessible in your project's Cloud settings.\n    at Object.eval (/dev-server/src/lib/copilot.functions.ts:166:13)\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async server (/dev-server/node_modules/@tanstack/start-client-core/src/createServerFn.ts:944:24)\n    at async callNextMiddleware (/dev-server/node_modules/@tanstack/start-client-core/src/createServerFn.ts:322:24)\n    at async userNext (/dev-server/node_modules/@tanstack/start-client-core/src/createServerFn.ts:312:26)\n    at async callNextMiddleware (/dev-server/node_modules/@tanstack/start-client-core/src/createServerFn.ts:322:24)\n    at async AsyncFunction.__executeServer (/dev-server/node_modules/@tanstack/start-client-core/src/createServerFn.ts:212:20)\n    at async eval (/dev-server/node_modules/@tanstack/start-server-core/src/server-functions-handler.ts:159:16)\n    at async eval (/dev-server/node_modules/@tanstack/start-server-core/src/server-functions-handler.ts:81:17)\n    at async handleServerAction (/dev-server/node_modules/@tanstack/start-server-core/src/server-functions-handler.ts:418:10)\n    at async Object.next (/dev-server/node_modules/@tanstack/start-server-core/src/createStartHandler.ts:301:16)\n    at async next (/dev-server/node_modules/@tanstack/start-server-core/src/createStartHandler.ts:301:16)\n    at async eval (/dev-server/src/start.ts:8:12)\n    at async next (/dev-server/node_modules/@tanstack/start-server-core/src/createStartHandler.ts:301:16)\n    at async executeMiddleware (/dev-server/node_modules/@tanstack/start-server-core/src/createStartHandler.ts:324:3)\n    at async startRequestResolver (/dev-server/node_modules/@tanstack/start-server-core/src/createStartHandler.ts:524:50)\",\n  \"has_blank_screen\": true\n}\n```</h1>

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
                      <p className="text-xs font-semibold text-destructive">Error Details:</p>
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
