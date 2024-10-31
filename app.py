# app.py
from flask import Flask, request, jsonify, render_template
from controllers.chat_controller import ChatController
from repositories.conversation_repository import SessionLocal

app = Flask(__name__)

@app.route('/', methods=['GET'])
def index():
    return render_template('chat.html')

@app.route('/api/conversations', methods=['GET'])
def get_conversations():
    session = SessionLocal()
    try:
        controller = ChatController(session)
        conversations = controller.get_all_conversations()
        conversations_data = [
            {'id': conv.id, 'title': conv.title or f'Conversa {conv.id}', 'created_at': conv.created_at.isoformat()}
            for conv in conversations
        ]
        return jsonify({'conversations': conversations_data})
    finally:
        session.close()

@app.route('/api/conversation/<int:conversation_id>', methods=['GET'])
def get_conversation(conversation_id):
    session = SessionLocal()
    try:
        controller = ChatController(session)
        conversation = controller.get_conversation(conversation_id)
        if conversation:
            messages = [
                {'role': msg.role, 'content': msg.content, 'timestamp': msg.timestamp.isoformat()}
                for msg in conversation.messages
            ]
            return jsonify({'conversation_id': conversation.id, 'messages': messages})
        else:
            return jsonify({'error': 'Conversa não encontrada'}), 404
    finally:
        session.close()

@app.route('/api/start_conversation', methods=['POST'])
def start_conversation():
    data = request.get_json()
    title = data.get('title', 'Nova Conversa')
    session = SessionLocal()
    try:
        controller = ChatController(session)
        conversation = controller.start_new_conversation(title)
        session.commit()
        return jsonify({'conversation_id': conversation.id})
    except Exception as e:
        session.rollback()
        print(f"Erro ao iniciar conversa: {e}")
        return jsonify({'error': 'Erro ao iniciar conversa'}), 500
    finally:
        session.close()

@app.route('/api/send_message', methods=['POST'])
def send_message():
    data = request.get_json()
    message_content = data.get('message')
    conversation_id = data.get('conversation_id')
    model_name = data.get('model_name', 'llama3.2')

    if not conversation_id:
        return jsonify({'error': 'conversation_id é obrigatório'}), 400

    session = SessionLocal()
    try:
        controller = ChatController(session)
        assistant_reply = controller.handle_user_input(conversation_id, message_content, model_name)
        session.commit()
        return jsonify({'reply': assistant_reply})
    except Exception as e:
        session.rollback()
        print(f"Erro ao enviar mensagem: {e}")
        return jsonify({'error': 'Erro ao enviar mensagem'}), 500
    finally:
        session.close()

if __name__ == '__main__':
    app.run(debug=True)
