'use client'

import { useEffect, useState } from 'react'
import Papa from 'papaparse'

type ColabRecommendation = { contentId: string; recommendations: string[] }
type ContentFilteringRecommendation = { contentId: string; scores: Record<string, number> }

export default function Home() {
  const [availableIds, setAvailableIds] = useState<string[]>([])
  const [colabRecs, setColabRecs] = useState<ColabRecommendation[]>([])
  const [contentFilteringRecs, setContentFilteringRecs] = useState<ContentFilteringRecommendation[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    const parseWithHeader = async (filePath: string): Promise<any[]> => {
      const res = await fetch(filePath)
      const text = await res.text()
      return new Promise((resolve) =>
        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => resolve(results.data as any[]),
        })
      )
    }

    const parseWithoutHeader = async (filePath: string): Promise<string[][]> => {
      const res = await fetch(filePath)
      const text = await res.text()
      return new Promise((resolve) =>
        Papa.parse<string[]>(text, {
          header: false,
          skipEmptyLines: true,
          complete: (results) => resolve(results.data as string[][]),
        })
      )
    }

    const loadData = async () => {
      const [colabRawRows, filterRaw] = await Promise.all([
        parseWithoutHeader('/colab_recommender.csv'),
        parseWithHeader('/content_filtering_results.csv'),
      ])

      // Skip the header row in colab recommender manually
      const [_, ...dataRows] = colabRawRows

      const colabParsed: ColabRecommendation[] = dataRows.map((row) => ({
        contentId: row[0]?.trim(),
        recommendations: row.slice(2, 7).map((val) => val?.trim() ?? ''),
      }))
      setColabRecs(colabParsed)

      const filterParsed: ContentFilteringRecommendation[] = filterRaw.map((row: any) => {
        const contentId = String(row.contentId).trim()
        const scores: Record<string, number> = {}
        for (const key in row) {
          if (key !== 'contentId') {
            const score = parseFloat(row[key])
            if (!isNaN(score)) {
              scores[key.trim()] = score
            }
          }
        }
        return { contentId, scores }
      })
      setContentFilteringRecs(filterParsed)

      // Merge unique IDs
      const uniqueIds = new Set<string>()
      colabParsed.forEach((row) => uniqueIds.add(row.contentId))
      filterParsed.forEach((row) => uniqueIds.add(row.contentId))
      setAvailableIds(Array.from(uniqueIds).sort())
    }

    loadData()
  }, [])

  const getTop5Colab = () => {
    if (!selectedId) return []
    return colabRecs.find((rec) => rec.contentId === selectedId)?.recommendations || []
  }

  const getTop5Filter = () => {
    if (!selectedId) return []
    const found = contentFilteringRecs.find((rec) => rec.contentId === selectedId?.trim())
    if (!found) return []
    return Object.entries(found.scores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([contentId]) => contentId)
  }

  return (
    <main className="p-3 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Recommendation Viewer</h1>

      <select
        className="p-2 border rounded mb-8 w-full h-10 bg-white text-black"
        onChange={(e) => setSelectedId(e.target.value)}
        value={selectedId || ''}
      >
        <option value="">Select a content ID</option>
        {availableIds.map((id) => (
          <option key={id} value={id}>
            {id}
          </option>
        ))}
      </select>

      {selectedId && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <h2 className="text-xl font-semibold mb-2">Top 5 from Collaborative Filtering</h2>
            <ul className="list-disc list-inside">
              {getTop5Colab().map((val, idx) => (
                <li key={idx}>{val?.slice(0, 35)}</li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">Top 5 from Content Filter</h2>
            <ul className="list-disc list-inside">
              {getTop5Filter().map((id, idx) => (
                <li key={idx}>{id}</li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-2">Top 5 from Wide and Deep Model</h2>
          </div>
        </div>
      )}
    </main>
  )
}
