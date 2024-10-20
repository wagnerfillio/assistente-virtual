//index.js
const express = require("express");
const bodyParser = require("body-parser");
const OpenAI = require("openai");
const path = require("path");
const { NlpManager } = require("node-nlp");
const mongoose = require("mongoose");
require("dotenv").config();

const PORT = process.env.PORT || 3000;

// Modelo do MongoDB
const Conversation = require("./models/Conversation");

const app = express();
app.use(bodyParser.json());

// Configuração da API da OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Inicializa o NLP.js
const manager = new NlpManager({ languages: ["pt"], forceNER: true });

// Conexão com o MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Conectado ao MongoDB"))
  .catch((err) => console.error("Erro ao conectar ao MongoDB", err));

const deleteAllConversationsFromDataBase = false; // Ao marcar true, as mensagens iniciais serão redefinidas para o original
const shouldStoreConversations = false;
let isTrained = false;

// Função para adicionar exemplos iniciais ao banco de dados
async function seedConversations() {
  if (deleteAllConversationsFromDataBase) {
    await deleteAllConversations();
  }

  const exampleConversations = [
    // Saudação
    { userMessage: "Oi", category: "saudacao" },
    { userMessage: "Olá, tudo bem?", category: "saudacao" },
    { userMessage: "Como você está?", category: "saudacao" },
    { userMessage: "vc está bem?", category: "saudacao" },
    { userMessage: "Bom dia", category: "saudacao" },
    { userMessage: "Boa tarde", category: "saudacao" },
    { userMessage: "Boa noite", category: "saudacao" },
    { userMessage: "Oi, tudo certo?", category: "saudacao" },
    { userMessage: "E aí", category: "saudacao" },
    { userMessage: "Salve", category: "saudacao" },

    // Interação
    { userMessage: "Seu nome?", category: "interacao" },
    { userMessage: "Quem é você?", category: "interacao" },
    { userMessage: "Ok", category: "interacao" },

    // Agradecimento
    { userMessage: "Obrigado", category: "agradecimento" },

    // Suporte
    { userMessage: "Meu ramal está com defeito", category: "suporte" },
    { userMessage: "Chamadas mudas", category: "suporte" },
    { userMessage: "Chamadas robotizadas", category: "suporte" },
    { userMessage: "Problema", category: "suporte" },
    { userMessage: "Preciso de ajuda com a instalação", category: "suporte" },
    { userMessage: "Falha", category: "suporte" },
    { userMessage: "Exportar relatório", category: "suporte" },
    { userMessage: "Dashboard travado", category: "suporte" },
    { userMessage: "Vonix Phone com problema", category: "suporte" },
    { userMessage: "Sistema não funciona", category: "suporte" },
    { userMessage: "Problema no sistema", category: "suporte" },
    { userMessage: "Estou com problema ", category: "suporte" },

    // Comercial
    { userMessage: "Quanto custa este item?", category: "comercial" },
    { userMessage: "Qual o valor do plano?", category: "comercial" },
    { userMessage: "Gostaria de comprar mais produtos", category: "comercial" },
    { userMessage: "Sobre a Vonix", category: "comercial" },

    // Financeiro
    { userMessage: "Recebi uma fatura incorreta", category: "financeiro" },
    { userMessage: "Ramais utilizados", category: "financeiro" },
    { userMessage: "Dúvida sobre o pagamento", category: "financeiro" },
    { userMessage: "Tenho algumas pendências", category: "financeiro" },
    { userMessage: "Pendências financeiras", category: "financeiro" },
    { userMessage: "Pendências", category: "financeiro" },
    { userMessage: "Segunda via de boleto", category: "financeiro" },
    { userMessage: "Valor da conta", category: "financeiro" },

    // Elogio
    { userMessage: "Você é incrível", category: "elogio" },
    { userMessage: "Sensacional", category: "elogio" },
    { userMessage: "Você é demais", category: "elogio" },
  ];

  for (const example of exampleConversations) {
    // Verifica se a conversa já existe no banco de dados
    const existingConversation = await Conversation.findOne({
      userMessage: example.userMessage,
      category: example.category,
    });

    // Se não existir, insere a nova conversa
    if (!existingConversation) {
      await Conversation.create(example);
      console.log(`Novo exemplo de conversa adicionado: ${example.userMessage}`);
    }
  }
  console.log("Verificação de exemplos concluída - as conversas já existem no banco de dados.");
}

// Função para deletar todas as conversas
async function deleteAllConversations() {
  try {
    await Conversation.deleteMany({});
    console.log("Todas as conversas foram deletadas com sucesso.");
  } catch (error) {
    console.error("Erro ao deletar as conversas:", error);
  }
}

// Função para treinar o classificador com conversas armazenadas no MongoDB
async function trainModel() {
  console.log("Treinando o modelo com os exemplos de conversas existentes...");
  try {
    // Filtra feedbacks que são nulos ou verdadeiros
    const conversations = await Conversation.find({});

    conversations.forEach((cvs) => {
      if (cvs.feedback === true || cvs.feedback === null) {
        // treina NLP
        manager.addDocument("pt", cvs.userMessage, cvs.category);

        // treina NLU
        manager.addAnswer("pt", cvs.category, cvs.userMessage);
      }
    });

    await manager.train(); // Treina o modelo
    manager.save(); // Salva o modelo
    isTrained = true; // Marca que o modelo foi treinado

    // Teste de intenção
    const response = await manager.process("pt", "Voce sabe porque estou com problema no meu sistema?");
    console.log("Teste de Intenção", response);

    console.log("Modelo treinado com sucesso!");
  } catch (error) {
    console.error("Erro ao treinar o modelo:", error);
    isTrained = false; // Marca que o treinamento falhou
    throw new Error("Falha no treinamento do modelo.");
  }
}

// Função para iniciar a aplicação e rodar o treino inicial
async function startApp() {
  console.log("Iniciando o servidor");
  try {
    await seedConversations(); // Adiciona exemplos iniciais, se necessário
    await trainModel(); // Tenta treinar o modelo
    console.log("Modelo pronto para uso.");

    // Rota para re-treinamento manual
    app.get("/", (req, res) => {
      res.sendFile(path.resolve("views", "index.html"));
    });

    // Rota para registrar feedback do usuário
    app.post("/feedback", async (req, res) => {
      const { isCorrect, userMessage, category } = req.body;

      try {
        // Registre o feedback, incluindo a mensagem do usuário e a categoria classificada
        const existingConversation = await Conversation.findOne({
          userMessage,
        });

        if (existingConversation) {
          existingConversation.feedback = isCorrect;
          await existingConversation.save();
        } else {
          const newConversation = new Conversation({
            userMessage: userMessage,
            category,
            feedback: isCorrect,
          });

          await newConversation.save();
        }

        if (isCorrect) {
          manager.addDocument("pt", userMessage, category);
          console.log("Feedback positivo recebido:", category);
        } else {
          const response = await manager.process("pt", userMessage);
          console.log(response);

          console.log("Feedback negativo recebido", category);
        }

        return res.json({
          success: true,
          message: isCorrect
            ? "Feedback positivo registrado"
            : "Feedback negativo registrado.",
        });
      } catch (error) {
        console.error("Erro ao processar feedback:", error);
        res.status(500).json({
          success: false,
          message: "Erro ao processar feedback.",
        });
      }
    });

    // Rota para re-treinamento manual
    app.post("/retrain", async (req, res) => {
      try {
        await trainModel(); // Re-treinar o modelo
        res.json({
          success: true,
          message: "Modelo re-treinado com sucesso!",
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: "Erro ao re-treinar o modelo.",
        });
      }
    });

    // Rota para classificar mensagens e armazenar a interação
    app.post("/atendimento", async (req, res) => {
      const { userMessage } = req.body;

      // Verifica se o classificador foi treinado
      if (!isTrained) {
        return res.status(500).json({
          success: false,
          message: "Classificador não treinado",
        });
      }

      const result = await manager.process("pt", userMessage);
      const bayesianCategory = result.intent;

      const promptResponse = `Seu nome é Vix, e você é um assistente da Vonix que auxilia com Suporte Técnico, Comercial e Financeiro.
                          Forneça uma resposta adequada de acordo com a categoria: "${bayesianCategory}".
                          Informe que o atendimento será transferido para o setor correspondente
                          somente se a categoria for 'suporte', 'comercial' ou 'financeiro', . 
                          Nunca peça ao usuário para entrar em contato com o setor.
                          Você está atendendo um usuário da categoria "${bayesianCategory}".
                          Nunca peça mais detalhes.
                          Nunca pergunte se pode transferir para algum setor.
                          Em caso do usuário agradecer, apenas finalize o contato gentilmente.
                          Envie emoji somente se categoria for "saudacao" ou "agradecimento".
                          Responda apenas com um elogio, caso a categoria seja um "elogio".
                          Nunca pergunte se pode ajudar em algo mais.`;

      try {
        const chatCompletion = await openai.chat.completions.create({
          messages: [
            { role: "system", content: promptResponse },
            { role: "user", content: userMessage },
          ],
          model: "gpt-3.5-turbo",
        });

        const openAIResponse = chatCompletion.choices[0].message.content.trim();

        let response = openAIResponse;
        if (["suporte", "comercial", "financeiro"].includes(bayesianCategory)) {
          // Personalizar a resposta com base na categoria
          // response += ` O seu atendimento será transferido para o setor de ${bayesianCategory}.`;

          // Armazenar a conversa no MongoDB somente se shouldStoreConversations for true
          // e se a mensagem não existir no banco de dados
          const existingConversation = await Conversation.findOne({
            userMessage: userMessage,
          });

          if (shouldStoreConversations && !existingConversation) {
            const newConversation = new Conversation({
              userMessage: userMessage,
              category: bayesianCategory,
              feedback: null,
            });
            await newConversation.save();
          }
          // Aqui será criado uma função para transferir o usuário
          console.log("Transfere o chat para:", bayesianCategory);
        }

        res.json({
          success: true,
          botMessage: response,
          userMessage: userMessage,
          category: bayesianCategory,
        });
      } catch (error) {
        console.error("Erro na API OpenAI:", error);
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({
          success: false,
          message: error.message || "Falha ao processar a solicitação",
        });
      }
    });

    // Inicia o servidor
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
      console.log(`Assistente Link http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Erro ao iniciar a aplicação:", error.message);
  }
}

// Inicia a aplicação
startApp();
