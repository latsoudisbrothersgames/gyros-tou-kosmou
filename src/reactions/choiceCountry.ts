import { ALL_COUNTRIES, getCountryByIsoCode } from '../data/countries';
import type { AnswerChoice, Question } from '../types/game';

/** Οι επιλογές πρωτεύουσας έχουν id cap-xN, όχι ISO χώρας. */
export function countryForChoice(question: Question, choice: AnswerChoice) {
  if (choice.id === question.correctAnswerId) return getCountryByIsoCode(question.countryId);
  return getCountryByIsoCode(choice.flagIso2 ?? choice.id)
    ?? (question.type === 'COUNTRY_TO_CAPITAL'
      ? ALL_COUNTRIES.find((country) => country.capitalGreek === choice.label)
      : undefined);
}
