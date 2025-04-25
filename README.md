# Backend

<div align="center">
  <img src="/img/logo/hortaShop.png" alt="logo" style="height: 5cm;">
</div>

- Índice
  - [Pré-requisitos](#pré-requisitos)
  - [Configuração do Projeto](#configuração-do-projeto)
    - [1. Clone o repositório](#1-clone-o-repositório)
    - [2. Inicialize o Git Flow](#2-inicialize-o-git-flow)
    - [3. Instale as dependências](#3-instale-as-dependências)
    - [4. Rode a Aplicação (Desenvolvimento)](#4-rode-a-aplicação-desenvolvimento)
  - [Documentação da API](#documentação-da-api)
  - [Fluxo de Trabalho com Git Flow](#fluxo-de-trabalho-com-git-flow)
    - [1. Pull para verificar atualizações](#1-pull-para-verificar-atualizações)
    - [2. Criar uma nova feature](#2-criar-uma-nova-feature)
    - [3. Trabalhar na feature](#3-trabalhar-na-feature)
    - [4. Pull Request da feature](#4-pull-request-da-feature)


[Voltar ao README principal](https://github.com/HortaShop-PS)


Este é o repositório do BackEnd do projeto Hortashop, desenvolvido com [NestJS](https://nestjs.com/), [TypeScript](https://www.typescriptlang.org/) e [Node.js](https://nodejs.org/). Este guia irá ajudar a configurar o ambiente, rodar o projeto e seguir o fluxo de trabalho com Git Flow. Este backend fornece as APIs necessárias para o funcionamento do [Frontend HortaShop](https://github.com/HortaShop-PS/FrontEnd).

## Pré-requisitos

Antes de começar, certifique-se de ter os seguintes itens instalados:

1.  **Git**: [Instalar Git](https://git-scm.com/)
2.  **Node.js**: [Instalar Node.js](https://nodejs.org/) 

## Configuração do Projeto

### 1. Clone o repositório

Clone o repositório para sua máquina local:

```bash
git clone https://github.com/HortaShop-PS/BackEnd.git
```

### 2. Inicialize o Git Flow

Inicialize o Git Flow no repositório (se for usar este fluxo):

```bash
git flow init
```

Durante a inicialização, você pode aceitar as configurações padrão pressionando `Enter` para cada pergunta.

### 3. Instale as dependências

Instale as dependências do projeto usando NPM ou Yarn:

```bash
npm install
```

### 4. Rode a Aplicação (Desenvolvimento)

Inicie o servidor de desenvolvimento do NestJS:

```bash
npm run start:dev
```

## Documentação da API

Se o projeto utiliza Swagger (comum em NestJS), a documentação da API estará disponível automaticamente após iniciar a aplicação. Acesse pelo navegador:

`http://localhost:[PORTA]/api`

*(Substitua `[PORTA]` pela porta configurada, geralmente 3000)*

## Fluxo de Trabalho com Git Flow

### 1. Pull para verificar atualizações

Antes de começar a trabalhar em uma nova funcionalidade, sempre faça um pull das últimas alterações da branch `develop`:

```bash
git checkout develop
git pull origin develop
```
Isso garante que você esteja trabalhando com a versão mais recente do código.

### 2. Criar uma nova feature

Para começar a trabalhar em uma nova funcionalidade, crie uma branch de feature:

```bash
git flow feature start nome-da-feature
```

Isso criará uma nova branch baseada na branch `develop`.

### 3. Trabalhar na feature

Implemente as alterações necessárias no código. Lembre-se de fazer commits regularmente:

```bash
git add .
git commit -m "Descrição do commit"
```

### 4. Pull Request da feature

Quando você terminar de implementar e testar a funcionalidade, faça um pull request (PR) para a branch `develop`. Isso pode ser feito através da interface do GitHub.
