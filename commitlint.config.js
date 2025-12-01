module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // Nova feature
        'fix',      // Bug fix
        'docs',     // Mudanças em documentação
        'style',    // Formatação, ponto e vírgula, etc
        'refactor', // Refatoração de código
        'perf',     // Melhorias de performance
        'test',     // Adição ou correção de testes
        'build',    // Mudanças no build system
        'ci',       // Mudanças em CI/CD
        'chore',    // Outras mudanças
        'revert',   // Revert de commit anterior
      ],
    ],
    'subject-case': [0], // Permite qualquer case no subject
    'header-max-length': [2, 'always', 100], // Limita header a 100 caracteres
  },
};

