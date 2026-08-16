import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useServerFn } from '@tanstack/react-start'
import { runAiDiagnostic } from '@/lib/diagnostic.functions'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/_authenticated/admin/ai-diagnostic')({
  component: () => {
    const run = useServerFn(runAiDiagnostic)
    const [res, setRes] = useState<any>(null)
    return (
      <div className="p-20">
        <Button onClick={async () => {
          const r = await run({ data: {} })
          setRes(r)
        }}>CLICK ME</Button>
        {res && <div id="results-json">{JSON.stringify(res)}</div>}
      </div>
    )
  }
})
