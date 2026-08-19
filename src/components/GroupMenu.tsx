import { Pencil, Share2, Trash2, LogOut, Flag } from 'lucide-react'
import { useGroup } from '../state'
import { Sheet } from './ui'

/** Les trois points en haut à droite : tout ce qui concerne le groupe. */
export function GroupMenu({
  onClose,
  onEdit,
  onShare,
  onLeave,
  onClosing,
}: {
  onClose: () => void
  onEdit: () => void
  onShare: () => void
  onLeave: () => void
  onClosing: () => void
}) {
  const { state, isChef, isHost, t } = useGroup()

  return (
    <Sheet title={state.group.name} onClose={onClose}>
      <div className="stack">
        {isChef && (
          <button type="button" className="menu-row" onClick={onEdit}>
            <Pencil size={18} />
            <span>{t('editGroup')}</span>
          </button>
        )}

        {/* Un groupe sans date de fin ne se cloture pas : une coloc ou un
            couple n'ont pas de dernier jour, et le bilan y serait vide. */}
        {state.group.endDate && (
          <button type="button" className="menu-row" onClick={onClosing}>
            <Flag size={18} />
            <span>{t('closingTitle')}</span>
          </button>
        )}

        <button type="button" className="menu-row" onClick={onShare}>
          <Share2 size={18} />
          <span>{t('shareGroup')}</span>
        </button>

        <button type="button" className="menu-row is-danger" onClick={onLeave}>
          {isHost ? <Trash2 size={18} /> : <LogOut size={18} />}
          <span>{isHost ? t('deleteGroup') : t('leaveGroup')}</span>
        </button>
      </div>
    </Sheet>
  )
}
