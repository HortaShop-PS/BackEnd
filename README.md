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
    - [4. Configure as Variáveis de Ambiente](#4-configure-as-variáveis-de-ambiente)
    - [5. Configure o Banco de Dados (Opcional)](#5-configure-o-banco-de-dados-opcional)
    - [6. Rode a Aplicação](#6-rode-a-aplicação)
  - [Rodando a Aplicação](#rodando-a-aplicação-modos)
  - [Executando Testes](#executando-testes)
  - [Documentação da API](#documentação-da-api)
  - [Fluxo de Trabalho com Git Flow](#fluxo-de-trabalho-com-git-flow)
    - [1. Criar uma nova feature](#1-criar-uma-nova-feature)
    - [2. Trabalhar na feature](#2-trabalhar-na-feature)
    - [3. Finalizar a feature](#3-finalizar-a-feature)
  - [Tecnologias Utilizadas](#tecnologias-utilizadas)


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

### 1. Criar uma nova feature

Para começar a trabalhar em uma nova funcionalidade, crie uma branch de feature:

```bash
git flow feature start nome-da-feature
```

Isso criará uma nova branch baseada na branch `develop`.

### 2. Trabalhar na feature

Implemente as alterações necessárias no código. Lembre-se de fazer commits regularmente:

```bash
git add .
git commit -m "Descrição do commit"
```

### 3. Finalizar a feature

Quando terminar de implementar e testar a funcionalidade, finalize a branch de feature:

```bash
git flow feature finish nome-da-feature
```

Isso fará o merge da branch de feature na branch `develop` e deletará a branch de feature local.