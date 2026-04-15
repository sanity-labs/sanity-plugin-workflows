import {useEffect, useState} from 'react'
import {useClient} from 'sanity'

import {getWorkflowsApiVersion} from '../plugin/constants'

/** @public */
export function useHasWorkflow(documentType: string): boolean | null {
  const client = useClient({apiVersion: getWorkflowsApiVersion()})
  const [hasWorkflow, setHasWorkflow] = useState<boolean | null>(null)

  useEffect(() => {
    const query = `*[_type == "workflowDefinition" && documentType == $docType][0]._id`

    client
      .fetch<string | null>(query, {docType: documentType})
      .then((id) => setHasWorkflow(id !== null))
      .catch(() => setHasWorkflow(false))
  }, [client, documentType])

  return hasWorkflow
}
