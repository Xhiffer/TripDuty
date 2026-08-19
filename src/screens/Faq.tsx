import { useMemo, useState } from 'react'
import { ArrowLeft, Search, ChevronDown } from 'lucide-react'
import { useApp } from '../state'
import { FAQ } from '../lib/faq'

/** Retire accents et majuscules : « clôture » se trouve en tapant « cloture ». */
function fold(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

export function Faq({ onClose }: { onClose: () => void }) {
  const { lang, t } = useApp()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState<number | null>(0)

  const results = useMemo(() => {
    const needle = fold(query.trim())
    const items = FAQ.map((item, index) => ({ ...item, index }))
    if (!needle) return items
    return items.filter((item) => fold(`${item.q[lang]} ${item.a[lang]}`).includes(needle))
  }, [query, lang])

  return (
    <>
      <div className="topbar">
        <button type="button" className="icon-button" onClick={onClose} aria-label={t('back')}>
          <ArrowLeft size={20} />
        </button>
        <div className="topbar-title">
          <span className="topbar-name">{t('faq')}</span>
        </div>
        <span className="icon-button is-ghost" />
      </div>

      <div className="search-field">
        <Search size={17} />
        <input
          className="search-input"
          value={query}
          placeholder={t('searchQuestion')}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="stack" style={{ marginTop: 14 }}>
        {results.length === 0 && <div className="empty">{t('noQuestionFound')}</div>}
        {results.map((item) => {
          const expanded = open === item.index
          return (
            <div key={item.index} className={`faq-card ${expanded ? 'is-open' : ''}`}>
              <button type="button" className="faq-head" onClick={() => setOpen(expanded ? null : item.index)}>
                <span className="faq-question">{item.q[lang]}</span>
                <ChevronDown size={18} className="faq-chevron" />
              </button>
              {expanded && <p className="sheet-body" style={{ margin: '10px 0 0' }}>{item.a[lang]}</p>}
            </div>
          )
        })}
      </div>
    </>
  )
}
