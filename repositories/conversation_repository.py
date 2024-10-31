# conversation_repository.py
from sqlalchemy import create_engine, Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import sessionmaker, relationship, declarative_base
from datetime import datetime

# Configuração do banco de dados
engine = create_engine('sqlite:///conversas.db', echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Modelos
class Conversation(Base):
    __tablename__ = 'conversations'

    id = Column(Integer, primary_key=True)
    title = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    messages = relationship('Message', back_populates='conversation', cascade='all, delete-orphan')

class Message(Base):
    __tablename__ = 'messages'

    id = Column(Integer, primary_key=True)
    role = Column(String)
    content = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)
    conversation_id = Column(Integer, ForeignKey('conversations.id'))
    conversation = relationship('Conversation', back_populates='messages')

# Criação das tabelas no banco de dados
Base.metadata.create_all(engine)

# Repositório
class ConversationRepository:
    def __init__(self, session):
        self.session = session

    def create_conversation(self, title=None):
        conversation = Conversation(title=title or 'Nova Conversa')
        self.session.add(conversation)
        # Removido self.session.commit()
        return conversation

    def get_conversation(self, conversation_id):
        return self.session.query(Conversation).filter_by(id=conversation_id).first()

    def get_all_conversations(self):
        return self.session.query(Conversation).order_by(Conversation.created_at.desc()).all()

    def add_message(self, conversation_id, role, content):
        conversation = self.get_conversation(conversation_id)
        if conversation:
            message = Message(role=role, content=content, conversation=conversation)
            self.session.add(message)
            # Removido self.session.commit()
            return message
        else:
            return None

    def get_messages(self, conversation_id):
        conversation = self.get_conversation(conversation_id)
        if conversation:
            return conversation.messages
        else:
            return None

    def clear_all_conversations(self):
        self.session.query(Message).delete()
        self.session.query(Conversation).delete()
        # Removido self.session.commit()

    def delete_conversation(self, conversation_id):
        conversation = self.get_conversation(conversation_id)
        if conversation:
            self.session.delete(conversation)
            # Removido self.session.commit()
            return True
        else:
            return False