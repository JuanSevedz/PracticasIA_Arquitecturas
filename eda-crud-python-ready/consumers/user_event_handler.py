from messaging.events import UserCreated,UserUpdated,UserDeleted
class UserEventHandler:
    """Consumer: transforma eventos en operaciones de persistencia."""
    def __init__(self,repository): self.repository=repository
    def handle(self,event):
        print(f'[Consumer] Recibido {event.event_type} event_id={event.event_id}')
        if isinstance(event,UserCreated): self.repository.insert(event.data['nombre'],event.data['email'])
        elif isinstance(event,UserUpdated): self.repository.update(event.data['id'],event.data['nombre'],event.data['email'])
        elif isinstance(event,UserDeleted): self.repository.delete(event.data['id'])
        else: raise ValueError(f'Evento no soportado: {event.event_type}')
        print(f'[Consumer] {event.event_type} persistido en MySQL')
