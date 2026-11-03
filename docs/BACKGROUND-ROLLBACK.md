> Histórico: instruções de navegador e rollback local não se aplicam ao CMS atual. Backups não acompanham esta cópia.

# Teste local de Background — 02/11/2026

Versão anterior preservada em `backups/antes-background-2026-11-02` (fontes, conteúdo, imagens e dependências declaradas). Não foi gerado novo ZIP nem publicado no Replit.

Para testar: executar INICIAR-SITE.cmd, abrir /admin > Marca e domínio > Background, selecionar uma opção e salvar. Abrir o site em outra aba. O conteúdo continua salvo somente no navegador; exportar JSON para preservar as escolhas. As imagens são incorporadas ao JSON e têm limite de 2 MB cada; o armazenamento do navegador pode exigir imagens menores.

Para voltar apenas o visual: selecionar “Voltar ao degradê padrão” e salvar.

Para rollback completo: parar o servidor e executar RESTAURAR-ANTES-BACKGROUND.ps1. Depois iniciar novamente. As preferências Background salvas no navegador são ignoradas pela versão anterior; o restante do conteúdo é preservado.

A cena 3D é externa e exige acesso à prod.spline.design e WebGL. O código altera a propriedade pública color dos objetos do robô com nomes identificáveis; a inspeção visual da cena deve confirmar o resultado. O parallax usa GSAP ScrollTrigger, sem substituir a rolagem nativa do site.

## Ajustes de 02/11/2026
- Removida a camada branca sobre a imagem.
- Parallax ligado à rolagem nativa, com deslocamento de 40% e margem de imagem para evitar bordas vazias.
- Hero 3D mantém a disposição central original; robô ocupa a área abaixo dos textos, com zoom reduzido.
- Rastreamento do cursor aplicado às rotações dos objetos head/eye da cena.
- A validação visual final do enquadramento e rastreamento ficou pendente: a cena externa deixou o navegador de teste sem resposta.
- Backup original e script de rollback não foram alterados.

