import mysql.connector
from mysql.connector import Error
class MySQLUserRepository:
    def __init__(self, config): self.config=config
    def _get_connection(self):
        return mysql.connector.connect(host=self.config.DB_HOST,port=self.config.DB_PORT,user=self.config.DB_USER,password=self.config.DB_PASSWORD,database=self.config.DB_NAME)
    def _execute(self, sql, params=(), fetch=None):
        connection=cursor=None
        try:
            connection=self._get_connection(); cursor=connection.cursor(dictionary=bool(fetch))
            cursor.execute(sql,params)
            result=cursor.fetchall() if fetch=='all' else cursor.fetchone() if fetch=='one' else None
            connection.commit(); return result
        except Error as exc:
            if connection: connection.rollback()
            raise RuntimeError(f'MySQL: {exc}') from exc
        finally:
            if cursor: cursor.close()
            if connection and connection.is_connected(): connection.close()
    def insert(self,nombre,email): self._execute('INSERT INTO users (nombre,email) VALUES (%s,%s)',(nombre,email))
    def update(self,user_id,nombre,email): self._execute('UPDATE users SET nombre=%s,email=%s WHERE id=%s',(nombre,email,user_id))
    def delete(self,user_id): self._execute('DELETE FROM users WHERE id=%s',(user_id,))
    def find_all(self): return self._execute('SELECT id,nombre,email,creado_en FROM users ORDER BY id',fetch='all')
    def find_by_id(self,user_id): return self._execute('SELECT id,nombre,email,creado_en FROM users WHERE id=%s',(user_id,),fetch='one')
