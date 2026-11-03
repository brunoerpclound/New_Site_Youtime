# Análise da referência e direção visual

Fonte: https://saasly.demos.tailgrids.com/
Captura REA em 01/11/2026, Edge Chromium 156, viewport 1440 x 1000.
Evidence ID: ev_6e5bc7aef7d5139fab773687e353e54bf315727200c0b94145036b253c6f0c50
Arquivo bruto: output/rea-evidence.json. Captura: output/reference.png.

## Observado
Navegação flutuante branca; fundo claro atmosférico; hero central com título de duas linhas, dois CTAs e dashboard grande; funcionalidades; casos de uso; integrações; depoimentos; planos; FAQ e CTA final. Captura de DOM e imagem concluída; nenhum page-error registrado na janela de observação. REA navegou à URL e aguardou 3 segundos. O servidor da referência não foi inspecionado e nenhuma funcionalidade autenticada foi testada.

## Adaptação implementada
Reconstrução própria em React, preservando hierarquia, proporções e fluxo da referência. Sem reutilizar código ou imagens do template. Serviços B2B substituem funcionalidades SaaS; propostas sob medida substituem assinaturas; informações fornecidas substituem avaliações e números comerciais. Dashboard demonstrativo com estados de clientes/projetos e período.

## Tokens da marca
Poppins 400/500/600/700 local; display 58px desktop / 36px mobile; texto 12–14px; cor principal #7B1FA2, secundária #E91E63, violeta #5E35B1, acento #FF9800, branco #FFFFFF, tinta #242033. Fundo lavanda muito claro deriva da paleta, preservando o caráter leve da referência. Container 1232px, cantos 8–18px. O símbolo oficial é mostrado por recorte visual CSS do PNG original, acompanhado da assinatura tipográfica legível sobre fundo branco; arquivo original preservado integralmente.

## Limites e escolhas
Não é cópia pixel a pixel: identidade, idioma, conteúdo e ofertas são da Youtime. Foto e depoimentos identificados como ilustrativos. Dados do dashboard hero são exemplos. CMS usa armazenamento do navegador nesta etapa de front-end; publicar dados globais, autenticação, DNS e monitoramento externo exige integração no Replit.
