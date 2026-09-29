from queue import Queue
from threading import Event as ThreadEvent, Thread
class EventBroker:
    """Broker EDA en memoria. Publica y entrega eventos en un hilo consumidor."""
    def __init__(self):
        self.queue=Queue(); self.handlers=[]; self.stop_signal=ThreadEvent()
        self.worker=Thread(target=self._consume_loop, daemon=True, name='event-consumer'); self.worker.start()
    def subscribe(self, handler): self.handlers.append(handler)
    def publish(self, event):
        print(f'[Producer] Publicando {event.event_type} event_id={event.event_id}')
        self.queue.put(event); print(f'[Broker] Evento {event.event_type} encolado')
    def _consume_loop(self):
        while not self.stop_signal.is_set():
            event=self.queue.get()
            try:
                for handler in self.handlers: handler.handle(event)
            except Exception as exc: print(f'[Broker] Error procesando {event.event_type}: {exc}')
            finally: self.queue.task_done()
    def stop(self): self.stop_signal.set(); self.worker.join(timeout=1)
