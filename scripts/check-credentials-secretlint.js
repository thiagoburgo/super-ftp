#!/usr/bin/env node

/**
 * Wrapper para secretlint que verifica apenas arquivos staged
 * Integra secretlint com git para verificar apenas arquivos que serão commitados
 */

const { execSync } = require('child_process');
const fs = require('fs');

/**
 * Obtém arquivos staged para commit
 */
function getStagedFiles() {
  try {
    const output = execSync('git diff --cached --name-only --diff-filter=ACM', {
      encoding: 'utf-8',
    });
    return output
      .split('\n')
      .filter((line) => line.trim())
      .filter((file) => fs.existsSync(file));
  } catch (error) {
    return [];
  }
}

/**
 * Função principal
 */
function main() {
  console.log('🔍 Verificando vazamento de credenciais com secretlint...\n');

  const stagedFiles = getStagedFiles();
  
  if (stagedFiles.length === 0) {
    console.log('✅ Nenhum arquivo staged para verificação.');
    process.exit(0);
  }

  // Filtrar arquivos ignorados pelo .secretlintignore
  const filesToCheck = stagedFiles.filter((file) => {
    // Verificar se o arquivo está na lista de ignorados
    const ignoredPatterns = [
      /README\.md$/,
      /CHANGELOG\.md$/,
      /LICENSE$/,
      /examples\//,
      /docs\//,
      /node_modules\//,
      /dist\//,
      /coverage\//,
      /\.test-temp\//,
      /package\.json$/,
      /package-lock\.json$/,
      /\.gitignore$/,
      /test\/unit\//,
    ];

    return !ignoredPatterns.some((pattern) => pattern.test(file));
  });

  if (filesToCheck.length === 0) {
    console.log('✅ Nenhum arquivo relevante para verificação.');
    process.exit(0);
  }

  try {
    // Executar secretlint nos arquivos staged
    const filesArg = filesToCheck.map((f) => `"${f}"`).join(' ');
    execSync(`npx secretlint ${filesArg}`, {
      stdio: 'inherit',
      encoding: 'utf-8',
    });
    console.log(`\n✅ Verificação concluída: ${filesToCheck.length} arquivo(s) verificado(s) sem problemas.`);
    process.exit(0);
  } catch (error) {
    console.error('\n❌ CREDENCIAIS SUSPEITAS ENCONTRADAS!');
    console.error('⚠️  O commit foi bloqueado para evitar vazamento de credenciais.\n');
    console.error('💡 Dicas:');
    console.error('   - Use variáveis de ambiente (process.env.VAR_NAME)');
    console.error('   - Use arquivos .env (adicionados ao .gitignore)');
    console.error('   - Remova credenciais hardcoded do código\n');
    process.exit(1);
  }
}

main();

