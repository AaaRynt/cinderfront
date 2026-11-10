import { defineConfig } from 'oxfmt'

export default defineConfig({
  // Historical fixture guards hash the original serialization.
  ignorePatterns: ['/src/simulation/fixtures/stage7cConstructionPreservation.json', '/src/simulation/fixtures/stage7cPresentationPreservation.json'],
  printWidth: 320,
  semi: false,
  singleQuote: true,
  sortImports: {
    groups: ['type-import', ['value-builtin', 'value-external'], 'type-internal', 'value-internal', ['type-parent', 'type-sibling', 'type-index'], ['value-parent', 'value-sibling', 'value-index'], 'unknown'],
  },
  sortTailwindcss: {
    stylesheet: './src/index.css',
    functions: ['clsx', 'cn'],
    preserveWhitespace: false,
    preserveDuplicates: false,
  },
})
