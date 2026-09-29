from flask import Flask, jsonify, request, send_from_directory
from config import Config
from infrastructure.mysql_repository import MySQLUserRepository
from messaging.event_broker import EventBroker
from messaging.events import UserCreated,UserUpdated,UserDeleted
from consumers.user_event_handler import UserEventHandler
from services.user_service import UserService

def create_app():
    app=Flask(__name__, static_folder='public'); config=Config(); repository=MySQLUserRepository(config)
    broker=EventBroker(); broker.subscribe(UserEventHandler(repository)); service=UserService(broker,repository)
    @app.get('/')
    def home():
        return send_from_directory(app.static_folder, 'index.html')

    @app.get('/api/info')
    def info():
        return jsonify({'application':'EDA CRUD','broker':'queue.Queue','events':['UserCreated','UserUpdated','UserDeleted'],'endpoints':['POST /users','GET /users','GET /users/<id>','PUT /users/<id>','DELETE /users/<id>']})
    @app.post('/users')
    def create():
        b=request.get_json(silent=True) or {}
        if not b.get('nombre') or not b.get('email'): return jsonify({'error':'nombre y email son obligatorios'}),400
        e=UserCreated({'nombre':b['nombre'],'email':b['email']}); service.create_user(e)
        return jsonify({'status':'accepted','message':'UserCreated publicado','event_id':e.event_id}),202
    @app.get('/users')
    def read_all(): return jsonify(service.get_users())
    @app.get('/users/<int:user_id>')
    def read_one(user_id):
        u=service.get_user(user_id)
        return jsonify(u) if u else (jsonify({'error':'Usuario no encontrado'}),404)
    @app.put('/users/<int:user_id>')
    def update(user_id):
        b=request.get_json(silent=True) or {}
        if not b.get('nombre') or not b.get('email'): return jsonify({'error':'nombre y email son obligatorios'}),400
        e=UserUpdated({'id':user_id,'nombre':b['nombre'],'email':b['email']}); service.update_user(e)
        return jsonify({'status':'accepted','message':'UserUpdated publicado','event_id':e.event_id}),202
    @app.delete('/users/<int:user_id>')
    def delete(user_id):
        e=UserDeleted({'id':user_id}); service.delete_user(e)
        return jsonify({'status':'accepted','message':'UserDeleted publicado','event_id':e.event_id}),202
    return app
if __name__=='__main__': create_app().run(host='0.0.0.0',port=Config().PORT,debug=True,use_reloader=False)
