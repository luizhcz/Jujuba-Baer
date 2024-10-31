# controllers/chat_controller.py
from services.chat_service import ChatService

class ChatController:
    def __init__(self, session):
        self.chat_service = ChatService(session)

    def start_new_conversation(self, title):
        return self.chat_service.start_new_conversation(title)

    def get_all_conversations(self):
        return self.chat_service.get_all_conversations()

    def get_conversation(self, conversation_id):
        return self.chat_service.get_conversation(conversation_id)

    def handle_user_input(self, conversation_id, user_input, model_name):
        # Chamar o método correto do ChatService
        return self.chat_service.generate_response(conversation_id, user_input, model_name)
