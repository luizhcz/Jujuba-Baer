# services/chat_service.py
from repositories.conversation_repository import ConversationRepository
from models.chat_model import ChatModel

class ChatService:
    def __init__(self, session):
        self.repository = ConversationRepository(session)

    def start_new_conversation(self, title):
        return self.repository.create_conversation(title)

    def get_all_conversations(self):
        return self.repository.get_all_conversations()

    def get_conversation(self, conversation_id):
        return self.repository.get_conversation(conversation_id)

    def generate_response(self, conversation_id, user_input, model_name):
        # Adicionar a mensagem do usuário ao banco de dados
        self.repository.add_message(conversation_id, 'user', user_input)
        # Gerar a resposta do assistente usando o modelo de IA
        assistant_reply = self.process_with_ai_model(user_input, model_name)
        # Adicionar a resposta do assistente ao banco de dados
        self.repository.add_message(conversation_id, 'assistant', assistant_reply)
        return assistant_reply

    def process_with_ai_model(self, user_input, model_name):
        # Carregar o modelo e gerar a resposta
        model = ChatModel.load_model(model_name)
        response = model(user_input)
        return response