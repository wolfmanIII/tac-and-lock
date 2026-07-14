import { useState } from 'react'
import { Modal } from '../modals/Modal.jsx'

export default function LegalFooter() {
  const [showAbout, setShowAbout] = useState(false)

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 h-7 flex items-center px-3 bg-gunmetal-950/95 border-t border-gunmetal-800">
        <p className="text-xs text-gunmetal-400 font-mono leading-none">
          The Traveller game in all forms is owned by{' '}
          <a href="https://www.mongoosepublishing.com/" target="_blank" rel="noreferrer" className="underline hover:text-gunmetal-200 transition-colors">
            Mongoose Publishing
          </a>
          . Copyright 1977–2025 Mongoose Publishing. Non-commercial use only.
          {' '}
          <button onClick={() => setShowAbout(true)} className="underline hover:text-gunmetal-200 transition-colors">
            About
          </button>
        </p>
      </div>

      {showAbout && (
        <Modal title="ABOUT — TAC & LOCK" onClose={() => setShowAbout(false)} width="max-w-lg" variant="dialog">
          <div className="p-4 space-y-4 font-mono text-xs text-gunmetal-300 leading-relaxed">
            <p>
              <span className="text-bronze-400 font-bold">TAC &amp; LOCK</span> is a free, non-commercial
              browser tool for playing 2300AD space combat (Mongoose Publishing, 2021) at the table.
              Rules implemented: 2300AD Core Book 3 p.52–62 (primary); Trav2022 CRB p.158–159 (internal crits), p.75 (weapon traits).
            </p>
            <p>
              The Traveller, 2300AD and related games in all forms are owned by Mongoose Publishing.
              Copyright 1977–2025 Mongoose Publishing. Traveller is a registered trademark of
              Mongoose Publishing. Mongoose Publishing permits web sites and fanzines for this game,
              provided it contains this notice, that Mongoose Publishing is notified, and subject to
              a withdrawal of permission on 90 days notice.
            </p>
            <p>
              The contents of this site are for personal, non-commercial use only. Any use of Mongoose
              Publishing's copyrighted material or trademarks anywhere on this web site and its files
              should not be viewed as a challenge to those copyrights or trademarks.
            </p>
          </div>
        </Modal>
      )}
    </>
  )
}
