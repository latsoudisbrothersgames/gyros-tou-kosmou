import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { GAME_MODE_LABELS, type SessionState } from '../types/game';
import { ScoreDisplay } from '../components/ScoreDisplay/ScoreDisplay';
import { ExplorerPassport } from '../components/Passport/ExplorerPassport';
import { GameResults } from '../components/GameResults/GameResults';
import { Button } from '../components/Button/Button';
import './NewModes.css';
import './GeoModes.css';

export function GeoModeLayout({ state, total, answered, next, restart, finish, children }: {
  state: SessionState; total: number | null; answered: boolean;
  next: () => void; restart: () => void; finish: () => void; children: ReactNode;
}) {
  if (state.finished) return <GameResults state={state} onPlayAgain={restart} />;
  const last = answered ? state.answers.at(-1) : undefined;
  return <div className="new-mode geo-mode">
    <div className="new-mode__top"><Link to="/games">← Έξοδος</Link>
      <span>{GAME_MODE_LABELS[state.config.mode]}</span>
      {total === null && <Button variant="secondary" onClick={finish}>Τέλος παιχνιδιού</Button>}
    </div>
    <ScoreDisplay score={state.score} streak={state.streak} questionNumber={state.questionIndex + 1} totalQuestions={total} />
    <ExplorerPassport stops={state.answers} totalQuestions={total} compact />
    <section className="new-mode__round card" data-mode={state.config.mode} data-answered={answered} data-round={state.questionIndex}>
      {children}
      {last && <div className="new-mode__feedback" role="status">
        <p>{last.correct ? `✓ Μπράβο! +${last.pointsAwarded} πόντοι` : `Προσπάθησε ξανά στον επόμενο γύρο! +${last.pointsAwarded} πόντοι`}</p>
        {last.discovered && <p>🎁 Νέα φιγούρα στη Συλλογή σου!</p>}
        <Button onClick={next}>{total !== null && state.questionIndex + 1 >= total ? 'Αποτελέσματα →' : 'Επόμενος γύρος →'}</Button>
      </div>}
    </section>
  </div>;
}
