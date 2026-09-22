import type { Question } from '../../types/game';
import { getCountryByIsoCode } from '../../data/countries';
import { LANDMARK_BY_ID } from '../../data/landmarks';
import { continentVars } from '../../theme/continents';
import { countryForChoice } from '../../reactions/choiceCountry';
import { CountryBall } from '../CountryBall/CountryBall';
import { Flag } from '../Flag/Flag';
import { LandmarkArt } from '../LandmarkArt/LandmarkArt';
import './QuestionCard.css';

interface QuestionCardProps {
  question: Question;
  selectedAnswerId: string | null;
  onSelect: (answerId: string) => void;
  /** Επιλογές κρυμμένες από τη βοήθεια 50:50 */
  eliminatedIds?: string[];
}

/**
 * Κάρτα ερώτησης πολλαπλής επιλογής. Μετά την απάντηση δείχνει
 * ✓/✕ και αποκαλύπτει τη σωστή επιλογή (όχι μόνο με χρώμα).
 */
export function QuestionCard({
  question,
  selectedAnswerId,
  onSelect,
  eliminatedIds = [],
}: QuestionCardProps) {
  const answered = selectedAnswerId !== null;
  const country = getCountryByIsoCode(question.countryId);
  const showPromptFlag =
    question.type === 'FLAG_TO_COUNTRY' || question.type === 'COUNTRY_TO_CAPITAL';
  const flagChoices = question.type === 'COUNTRY_TO_FLAG';
  const landmark =
    question.type === 'LANDMARK_TO_COUNTRY' && question.landmarkId
      ? LANDMARK_BY_ID.get(question.landmarkId)
      : undefined;

  return (
    <section data-question-id={question.id} className="question-card card" aria-label="Ερώτηση">
      <div className="question-card__prompt-area">
        {showPromptFlag && country && (
          <Flag
            iso2={country.iso2}
            countryName={question.type === 'FLAG_TO_COUNTRY' ? undefined : country.nameGreek}
            size={question.type === 'FLAG_TO_COUNTRY' ? 'xl' : 'lg'}
            className="question-card__flag"
          />
        )}
        {landmark && (
          <LandmarkArt
            landmarkId={landmark.id}
            ariaLabel={answered ? landmark.nameGreek : 'Μυστηριώδες μνημείο'}
            celebrate={answered && selectedAnswerId === question.correctAnswerId}
            frameAccent={answered}
            style={answered && country ? continentVars(country.continent) : undefined}
          />
        )}
        {landmark && answered && country && (
          <div className="question-card__reveal" role="status">
            <Flag iso2={country.iso2} countryName={country.nameGreek} size="lg" />
            <p className="question-card__reveal-text">
              <strong>{landmark.nameGreek}</strong>
              {landmark.placeGreek ? ` · ${landmark.placeGreek}` : ''}
            </p>
          </div>
        )}
        <h2 className="question-card__prompt">{question.prompt}</h2>
      </div>

      <div
        className={`question-card__choices ${flagChoices ? 'question-card__choices--flags' : ''}`}
        role="group"
        aria-label="Επιλογές απάντησης"
      >
        {question.choices.map((choice, index) => {
          const choiceCountry = countryForChoice(question, choice);
          // 22.09.2026 (Apollo): οι μπάλες έχουν τη σημαία της χώρας και προδίδουν τη λύση —
          // εμφανίζονται ΜΟΝΟ αφού δοθεί απάντηση, σε όλα τα modes. Πριν, ένα ουδέτερο «μυστήριο».
          const showBall = answered;
          const isCorrect = choice.id === question.correctAnswerId;
          const isSelected = choice.id === selectedAnswerId;
          const isEliminated = !answered && eliminatedIds.includes(choice.id);
          let stateClass = '';
          if (answered && isCorrect) stateClass = 'choice--correct';
          else if (answered && isSelected) stateClass = 'choice--wrong';
          else if (answered) stateClass = 'choice--muted';
          else if (isEliminated) stateClass = 'choice--muted';

          return (
            <button
              data-choice-id={choice.id}
              key={choice.id}
              type="button"
              className={`choice ${flagChoices ? 'choice--flag' : ''} ${stateClass}`}
              disabled={answered || isEliminated}
              onClick={() => onSelect(choice.id)}
              aria-label={
                flagChoices
                  ? `Επιλογή ${index + 1}: σημαία`
                  : `Επιλογή ${index + 1}: ${choice.label}`
              }
            >
              {showBall && choiceCountry && (
                <CountryBall country={choiceCountry} size={42} />
              )}
              {!showBall && choiceCountry && (
                <span className="choice__ball-mystery" aria-hidden="true">?</span>
              )}
              <span className="choice__key" aria-hidden="true">{index + 1}</span>
              {flagChoices && choice.flagIso2 ? (
                <Flag iso2={choice.flagIso2} size="lg" className="choice__flag-img" />
              ) : (
                <span className="choice__label">{choice.label}</span>
              )}
              {answered && isCorrect && (
                <span className="choice__result choice__result--ok">✓ Σωστό</span>
              )}
              {answered && isSelected && !isCorrect && (
                <span className="choice__result choice__result--no">✕ Λάθος</span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
