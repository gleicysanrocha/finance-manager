# Finanças Gley Rocha

Gerenciador financeiro premium em HTML, CSS e JavaScript puro. O projeto funciona direto no navegador e guarda os dados localmente no `localStorage`, sem banco de dados e sem servidor.

## Recursos

- Dashboard com métricas de despesas, receitas, cartões, contas a pagar e valores a receber.
- Cadastro de despesas, receitas, ordens de serviço, cartões, contas bancárias e metas.
- Visão de fluxo de caixa e relatórios visuais.
- Tema claro/escuro e interface responsiva.
- Exportação e restauração de dados em JSON pela área de administração.

## Como abrir localmente

Abra o arquivo `index.html` no navegador.

Também dá para usar uma extensão como Live Server no VS Code. Não há dependências para instalar.

## Hospedagem no GitHub Pages

Este projeto já está pronto para GitHub Pages. A pasta publicada deve conter apenas:

- `index.html`
- `css/`
- `js/`
- `.nojekyll`

Os arquivos `.docx`, `.git_recovery/` e outros backups ficam ignorados pelo Git para não irem para o site público.

### Opção 1: Publicar com GitHub Actions

1. Crie um repositório no GitHub.
2. Suba estes arquivos para a branch `main`.
3. No GitHub, vá em `Settings > Pages`.
4. Em `Build and deployment`, escolha `GitHub Actions`.
5. Faça um push para `main`. O workflow `.github/workflows/pages.yml` publica o site automaticamente.

### Opção 2: Publicar pela branch

1. Crie um repositório no GitHub.
2. Suba os arquivos do projeto para a branch `main`.
3. No GitHub, vá em `Settings > Pages`.
4. Em `Build and deployment`, escolha `Deploy from a branch`.
5. Selecione `main` e `/root`.
6. Salve e aguarde o link ficar disponível.

## Importante sobre privacidade

Os dados financeiros ficam salvos no navegador de cada pessoa que usa o sistema. Ao hospedar no GitHub Pages, o código fica público se o repositório for público, mas os dados cadastrados no app não são enviados para o GitHub.

## Estrutura

```text
.
|-- index.html
|-- css/
|   `-- style.css
|-- js/
|   |-- app.js
|   |-- data.js
|   `-- icons.js
|-- .github/
|   `-- workflows/
|       `-- pages.yml
|-- .gitignore
|-- .nojekyll
`-- README.md
```

## Observação de recuperação

Este projeto passou por uma recuperação de arquivos. Se ainda existir uma pasta `.git_recovery/` ou arquivos `.docx` antigos na sua máquina, mantenha-os fora do repositório público.
