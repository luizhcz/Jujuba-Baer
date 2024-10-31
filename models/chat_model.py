#chat_model
from langchain_ollama import OllamaLLM
from config import Config

class ChatModel:
    _models = {}

    @classmethod
    def load_model(cls, model_name):
        try:
            if model_name not in cls._models:
                cls._models[model_name] = OllamaLLM(model=model_name)
            return cls._models[model_name]
        except Exception as e:
            print(f"Erro ao gerar resposta do modelo: {e}")
            return "Desculpe, ocorreu um erro ao processar sua mensagem."