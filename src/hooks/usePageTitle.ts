import { useEffect } from 'react'

const BRAND = 'SDLC Platform'

export function usePageTitle(title: string) {
  useEffect(() => {
    if (!title) return
    document.title = `${title} - ${BRAND}`
  }, [title])
}
