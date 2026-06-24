# Finance Manager

Gerenciador financeiro em HTML, CSS e JavaScript puro, com contas de usuário e sincronização pelo Firebase Authentication e Cloud Firestore.

## Recursos

- Dashboard com métricas de despesas, receitas, cartões, contas a pagar e valores a receber.
- Cadastro de despesas, receitas, ordens de serviço, cartões, contas bancárias e metas.
- Visão de fluxo de caixa e relatórios visuais.
- Tema claro/escuro e interface responsiva.
- Exportação e restauração de dados em JSON pela área de administração.
- Cadastro e login por e-mail, recuperação de senha e dados privados por usuário.

## Configuração do Firebase

1. Em `Authentication > Sign-in method`, habilite o provedor `E-mail/senha`.
2. Em `Authentication > Settings > Authorized domains`, inclua o domínio publicado na Vercel.
3. Crie o banco do Cloud Firestore.
4. Publique o conteúdo de `firestore.rules` na aba `Firestore Database > Regras`.
5. Na Vercel, mantenha as variáveis `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID`, `FIREBASE_STORAGE_BUCKET`, `FIREBASE_MESSAGING_SENDER_ID` e `FIREBASE_APP_ID`.

Cada usuário é autenticado pelo Firebase e seus dados são gravados somente em `financial_data/{uid}`. As regras impedem que uma conta leia ou altere o documento de outra.

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
