import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { NewModeSession } from '../hooks/useNewModeSession';
import { GAME_MODE_LABELS } from '../types/game';
import { ScoreDisplay } from '../components/ScoreDisplay/ScoreDisplay';
import { ExplorerPassport } from '../components/Passport/ExplorerPassport';
import { GameResults } from '../components/GameResults/GameResults';
import { Button } from '../components/Button/Button';
import './NewModes.css';

export function NewModeLayout({ session: s, children, automatic = false }: {
  session: NewModeSession; children: ReactNode; automatic?: boolean;
}) {
  if (s.state.finished) return <GameResults state={s.state} onPlayAgain={s.restart} />;
  const last = s.selected !== null ? s.state.answers.at(-1) : undefined;
  return <div className="new-mode">
    <div className="new-mode__top"><Link to="/games">← Έξοδος</Link>
      <span>{GAME_MODE_LABELS[s.state.config.mode]}</span>
      {s.total === null && <Button variant="secondary" onClick={s.finish}>Τέλος παιχνιδιού</Button>}
    </div>
    <ScoreDisplay score={s.state.score} streak={s.state.streak} questionNumber={s.state.questionIndex + 1} totalQuestions={s.total} />
    <ExplorerPassport stops={s.state.answers} totalQuestions={s.total} compact />
    <section className="new-mode__round card" data-mode={s.state.config.mode} data-round={s.round.id}
      data-answered={s.selected !== null} data-answer={s.selected !== null ? s.round.country.iso2 : undefined}>
      {children}
      {last && <div className="new-mode__feedback" role="status">
        <p>{last.correct ? `✓ Σωστό! +${last.pointsAwarded} πόντοι` : `✕ Η σωστή χώρα: ${s.round.country.nameGreek}`}</p>
        {last.discovered && <p>🎁 Νέα φιγούρα στη Συλλογή σου!</p>}
        {!automatic && <Button onClick={s.next}>{s.total !== null && s.state.questionIndex + 1 >= s.total ? 'Αποτελέσματα →' : 'Επόμενη ερώτηση →'}</Button>}
      </div>}
    </section>
  </div>;
}
