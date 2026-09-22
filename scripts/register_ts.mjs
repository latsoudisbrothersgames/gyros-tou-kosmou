import { registerHooks } from 'node:module';

// Μόνο για τα παλιά scripts ελέγχου με σχετικές εισαγωγές χωρίς κατάληξη.
registerHooks({
  load(url, context, nextLoad) {
    return nextLoad(url, url.endsWith('.json') ? { ...context, importAttributes: { type: 'json' } } : context);
  },
  resolve(specifier, context, nextResolve) {
    try { return nextResolve(specifier, context); }
    catch (error) {
      if (['ERR_MODULE_NOT_FOUND', 'ERR_UNSUPPORTED_DIR_IMPORT'].includes(error.code) && specifier.startsWith('.')) {
        return nextResolve(`${specifier}.ts`, context);
      }
      throw error;
    }
  },
});
