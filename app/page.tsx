'use client'

import { useEffect, useState } from 'react'
import Papa from 'papaparse'

type Content = { contentId: string; title: string }
type Recommendation = { contentId: string; recommendedContentId: string; score: string }

export default function Home() {
  const [contents, setContents] = useState<Content[]>([])
  const [recommender1, setRecommender1] = useState<Recommendation[]>([])
  const [recommender2, setRecommender2] = useState<Recommendation[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      const parse = async (filePath: string): Promise<any[]> => {
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

      const [contentData, rec1, rec2] = await Promise.all([
        parse('/shared_articles.csv'),
        parse('/colab_recommender.csv'),
        parse('/content_filtering_results.csv'),
      ])

      setContents(contentData)
      setRecommender1(rec1)
      setRecommender2(rec2)
    }

    loadData()
  }, [])

  const getTop5 = (data: Recommendation[]) => {
    if (!selectedId) return []
    const filtered = data.filter((r) => r.contentId === selectedId)
    return filtered
      .sort((a, b) => parseFloat(b.score) - parseFloat(a.score))
      .slice(0, 5)
      .map((rec) => ({
        ...rec,
        title: contents.find((c) => c.contentId === rec.recommendedContentId)?.title || 'Unknown',
      }))
  }

  return (
    <main className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Recommendation Viewer</h1>

      <select
        className="p-2 border rounded mb-6 w-full"
        onChange={(e) => setSelectedId(e.target.value)}
        value={selectedId || ''}
      >
        <option value="">Select an article</option>
        {contents.map((item) => (
          <option key={item.contentId} value={item.contentId}>
            {item.title}
          </option>
        ))}
      </select>

      {selectedId && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">Top 5 from Recommender 1</h2>
            <ul className="list-disc list-inside">
              {getTop5(recommender1).map((rec, idx) => (
                <li key={idx}>{rec.title} (score: {rec.score})</li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">Top 5 from Recommender 2</h2>
            <ul className="list-disc list-inside">
              {getTop5(recommender2).map((rec, idx) => (
                <li key={idx}>{rec.title} (score: {rec.score})</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </main>
  )
}
