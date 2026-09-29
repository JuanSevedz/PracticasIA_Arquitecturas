class UserService:
    """CUD publica eventos; READ consulta el modelo de lectura de MySQL."""
    def __init__(self,broker,repository): self.broker=broker; self.repository=repository
    def create_user(self,event): self.broker.publish(event)
    def update_user(self,event): self.broker.publish(event)
    def delete_user(self,event): self.broker.publish(event)
    def get_users(self): return self.repository.find_all()
    def get_user(self,user_id): return self.repository.find_by_id(user_id)
