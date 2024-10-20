# ASSISTENTE VIRTUAL

## Descrição

Esta aplicação, chamada **Assistente Virtual**, é um assistente virtual que utiliza a biblioteca `node-nlp` e a API da `OpenAI` para fornecer respostas automatizadas em diversas categorias, como Suporte Técnico, Comercial e Financeiro. A aplicação armazena interações em um banco de dados MongoDB para treinamento contínuo do modelo.

[DESAFIO IA VONIX](https://github.com/vonix/desafio-ia)

## Requisitos

### Tecnologias e Dependências

1. **Node.js**: [Baixe aqui](https://nodejs.org/)
2. **MongoDB**: [Guia de instalação](https://docs.mongodb.com/manual/installation/)
3. **Bibliotecas Node.js**:
   - `express`: [Documentação](https://expressjs.com/)
   - `body-parser`: [Documentação](https://github.com/expressjs/body-parser)
   - `openai`: [Documentação](https://www.npmjs.com/package/openai)
   - `node-nlp`: [Documentação](https://www.npmjs.com/package/node-nlp#installation)
   - `mongoose`: [Documentação](https://mongoosejs.com/)
   - `dotenv`: [Documentação](https://www.npmjs.com/package/dotenv)

### Variáveis de Ambiente

Certifique-se de criar um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```
OPENAI_API_KEY=your_openai_api_key
MONGODB_URI=your_mongodb_uri
PORT=3000
```

- `OPENAI_API_KEY`: Sua chave de API da OpenAI.
- `MONGODB_URI`: URL de conexão do seu banco de dados MongoDB.
- `PORT`: Porta onde a aplicação irá rodar.

## Como Executar a Aplicação

1. **Clone o repositório**:

   ```bash
   git clone https://github.com/wagnerfillio/assistente-virtual.git
   cd assistente-virtual
   ```

2. **Instale as dependências**:

   ```bash
   pnpm install ou npm install
   ```

3. **Inicie a aplicação**:

   ```bash
   pnpm run start ou npm start
   ```

4. **Acesse a aplicação**:
   Abra o navegador e acesse `http://localhost:3000`.

## Funcionalidades
- **Primeira Instalação**: Ao instalar a aplicação pela primeira vez, a tabela `conversations` será criada no banco de dados e, automáticamente serão importados alguns exemplos de conversas.
Estes mesmos exemplos serão utilizados para treinar o modelo.
Caso seja necessário, você poderá adicionar novos exemplos de conversas à `const exampleConversations`.

- **Classificação de Mensagens**: O assistente classifica mensagens em categorias como "suporte", "comercial" e "financeiro" usando um sistema baseado em intenções. O modelo é treinado com conversas armazenadas.
- **Integração com OpenAI**: As respostas são refinadas usando a API da OpenAI, garantindo maior fluidez e relevância nas respostas.
- **Armazenamento de Conversas**: Todas as interações podem ser armazenadas no MongoDB para re-treinamento do modelo.
- **Re-treinamento Manual**: É possível re-treinar o modelo de intenções via uma rota dedicada.
- **Re-treinamento Por Feedback**: O usuário pode alimentar a base de dados, oferencendo feedbacks através do chat, marcando uma resposta do modelo positiva ou negativamente. (Esses feedbacks podem ser utilizandos para melhorar futuras classificações do modelo)

## Configurações Opcionais

Você pode personalizar o comportamento da aplicação através das seguintes variáveis:

### Desativar o Salvamento de Conversas

Para não alimentar o modelo com novos dados, você pode definir a variável `shouldStoreConversations` no arquivo `index.js`:

```javascript
const shouldStoreConversations = false; // Mude para true para armazenar as conversas
```

### Exclusão de Todas as Mensagens

Caso deseje excluir todas as mensagens armazenadas no banco de dados, você pode definir a variável `deleteAllConversationsFromDataBase` também no arquivo `index.js`:

```javascript
const deleteAllConversationsFromDataBase = true; // Mude para false para não excluir as conversas
```

## Uso da Rota de Re-treinamento

Para re-treinar o modelo manualmente, você pode enviar uma requisição `POST` para a rota `/retrain`.

### Exemplo de Requisição

#### Usando cURL

```bash
curl -X POST http://localhost:3000/retrain
```

#### Usando Postman

1. Abra o Postman.
2. Selecione o método `POST`.
3. Insira a URL: `http://localhost:3000/retrain`.
4. Clique em "Send".

### Resposta

Se o re-treinamento for bem-sucedido, você receberá uma resposta JSON semelhante a:

```json
{
  "success": true,
  "message": "Modelo re-treinado com sucesso!"
}
```

Caso ocorra um erro, você receberá uma mensagem de erro com status 500.

## Contexto do Re-treinamento

### Armazenamento de Conversas

A cada interação com o assistente, a mensagem do usuário e sua respectiva intenção são armazenadas no MongoDB, isso acontecerá se a constante `shouldStoreConversations` estiver definida como `true`. Isso permite que você mantenha um histórico de interações que pode ser usado para melhorar o desempenho do modelo.

### Treinamento Inicial

O modelo é inicialmente treinado com as conversas de exemplo que você definiu. Esse treinamento fornece uma base para a classificação de mensagens.

### Re-treinamento

Quando você chama a rota `/retrain`, o modelo é treinado novamente com todas as interações armazenadas no banco de dados. Qualquer nova interação que tenha sido classificada e armazenada desde o último treinamento será incluída no conjunto de dados de treinamento.

### O que muda no modelo?

- **Aprimoramento da Precisão**: O re-treinamento permite que o modelo aprenda com novas interações e ajuste suas classificações.
- **Adaptação a Novos Padrões**: O re-treinamento ajuda a manter o modelo atualizado e relevante em resposta a mudanças nas interações dos usuários.
- **Correção de Erros**: O re-treinamento pode ajudar a corrigir falhas anteriores, desde que as correções sejam registradas no banco de dados.

### Considerações

- **Desempenho**: O re-treinamento pode exigir recursos computacionais, especialmente se o número de conversas armazenadas for grande.
- **Validação**: É uma boa prática validar o desempenho do modelo após o re-treinamento, usando um conjunto de dados de teste.

## Aviso Importante

**Atenção:** O modelo de classificação utilizado nesta aplicação não é persistido. Portanto, se o servidor for reiniciado, o modelo perderá seu estado atual e precisará ser re-treinado novamente.

### Conclusão

O re-treinamento é uma forma de evoluir o modelo, tornando-o mais adaptável e preciso ao longo do tempo, aproveitando as interações reais coletadas. Isso é essencial para manter a eficácia do assistente, especialmente em ambientes dinâmicos.

## Estrutura do Projeto

- `index.js`: Código principal da aplicação.
- `models/Conversation.js`: Modelo de dados para armazenar conversas no MongoDB.
- `views/index.html`: Frontend da aplicação.
- `.env`: Arquivo de configuração das variáveis de ambiente.

## Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

---