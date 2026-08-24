import {useEffect, useState} from 'react'
import {useClient} from 'sanity'

import {getWorkflowsApiVersion} from '../plugin/constants'

/** @public */
export function useHasWorkflow(documentType: string): boolean | null {
  const client = useClient({apiVersion: getWorkflowsApiVersion()})
  const [hasWorkflow, setHasWorkflow] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false
    const query = `*[_type == "workflow.definition" && documentType == $docType][0]._id`

    void client
      .fetch<string | null>(query, {docType: documentType})
      .then((id) => {
        if (!cancelled) setHasWorkflow(id !== null)
      })
      .catch(() => {
        if (!cancelled) setHasWorkflow(false)
      })

    return () => {
      cancelled = true
    }
  }, [client, documentType])

  return hasWorkflow
}
