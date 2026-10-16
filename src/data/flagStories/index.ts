/**
 * «Η ιστορία της σημαίας»: σύντομη παράγραφος για κάθε χώρα, για την προέλευση
 * της σημαίας και τι συμβολίζουν τα χρώματα και τα σύμβολά της.
 * Ένα αρχείο ανά ήπειρο· κλειδί το iso2 (πεζά), όπως στα δεδομένα χωρών.
 */
import { FLAG_STORIES_AFRICA } from './africa';
import { FLAG_STORIES_ASIA } from './asia';
import { FLAG_STORIES_EUROPE } from './europe';
import { FLAG_STORIES_NORTH_AMERICA } from './northAmerica';
import { FLAG_STORIES_OCEANIA } from './oceania';
import { FLAG_STORIES_SOUTH_AMERICA } from './southAmerica';

export const FLAG_STORIES: Readonly<Record<string, string>> = {
  ...FLAG_STORIES_EUROPE,
  ...FLAG_STORIES_ASIA,
  ...FLAG_STORIES_AFRICA,
  ...FLAG_STORIES_NORTH_AMERICA,
  ...FLAG_STORIES_SOUTH_AMERICA,
  ...FLAG_STORIES_OCEANIA,
};

export function getFlagStory(iso2: string): string | undefined {
  return FLAG_STORIES[iso2.toLowerCase()];
}
