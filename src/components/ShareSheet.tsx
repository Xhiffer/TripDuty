import { useState } from 'react'
import { Link2, Share2, Check } from 'lucide-react'
import { useGroup } from '../state'
import { inviteLink } from '../lib/identity'
import { Sheet } from './ui'

/** Le code et le lien qui permettent de rejoindre le groupe. */
export function ShareSheet({ onClose }: { onClose: () => void }) {
  const { state, t } = useGroup()
  const [copied, setCopied] = useState(false)
  const link = inviteLink(state.group.inviteCode)

  async function share() {
    try {
      if (navigator.share) await navigator.share({ title: 'Trip Duty', url: link })
      else await navigator.clipboard.writeText(link)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <Sheet title={t('invitePeople')} subtitle={t('inviteSub')} onClose={onClose}>
      <div className="field-label">
        <Link2 size={14} style={{ verticalAlign: '-2px', marginRight: 6 }} />
        {t('inviteByLink')}
      </div>
      <div className="invite-code">{state.group.inviteCode}</div>
      <button type="button" className="btn btn-primary btn-block" style={{ marginTop: 14 }} onClick={() => void share()}>
        {copied ? <Check size={17} /> : <Share2 size={17} />}
        {copied ? t('linkCopied') : t('shareLink')}
      </button>
      <p className="hint">{t('shareHelp')}</p>
    </Sheet>
  )
}
