import { useSearchParams } from 'react-router-dom';
import type { GameConfig } from '../types/game';
import { formatPopulationGreek, formatAreaGreek } from '../types/country';
import { parseGameConfig } from './QuizGamePage';
import { useNewModeSession } from '../hooks/useNewModeSession';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { scoreCorrectAnswer } from '../game/scoring';
import { CountryBall } from '../components/CountryBall/CountryBall';
import { NewModeLayout } from './NewModeLayout';

export function BiggerGamePage() {
  const [params] = useSearchParams();
  return <BiggerSession key={params.toString()} config={parseGameConfig('bigger', params)!} />;
}
function BiggerSession({ config }: { config: GameConfig }) {
  const s = useNewModeSession(config);
  const reduced = useReducedMotion();
  const answered = s.selected !== null;
  const population = s.round.metric === 'population';
  return <NewModeLayout session={s}>
    <h1>{population ? 'Ποια έχει περισσότερους κατοίκους;' : 'Ποια έχει μεγαλύτερη έκταση;'}</h1>
    <p>Διάλεξε μία χώρα για να τις συγκρίνουμε.</p>
    <div className={`new-mode__choices bigger__choices ${reduced ? 'bigger__choices--reduced' : ''}`}
      data-metric={s.round.metric} role="group" aria-label="Σύγκριση χωρών">
      {s.round.choices.map(country => {
        const winner = country.iso2 === s.round.country.iso2;
        return <button type="button" key={`${s.round.id}-${country.iso2}`} data-choice={country.iso2}
          disabled={answered} onClick={() => s.answer(country.iso2, scoreCorrectAnswer)}
          className={`new-mode__choice bigger__choice ${answered && winner ? 'new-mode__choice--correct' : answered && s.selected === country.iso2 ? 'new-mode__choice--wrong' : ''}`}>
          <span>{country.nameGreek}</span>
          <span className={`bigger__ball ${answered && winner ? 'bigger__ball--large' : ''}`}>
            <CountryBall country={country} size={96} identityVisible={answered} concealed={!answered} reactive={false}
              className={answered ? 'new-mode__reveal' : ''} mood={!answered ? 'thinking' : winner ? 'proud' : 'shy'} />
          </span>
          {answered && <span className="bigger__value">{population ? formatPopulationGreek(country.population) : formatAreaGreek(country.areaKm2)}</span>}
          {answered && winner && <span className="bigger__winner">↑ Μεγαλύτερη</span>}
        </button>;
      })}
    </div>
  </NewModeLayout>;
}
