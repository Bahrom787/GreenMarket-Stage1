/** IMP-003.1.2 §14: "логирование через общую систему диагностики проекта,
 *  без console.log из бизнес-кода". Общей системы диагностики в присланных
 *  материалах клиента нет — это минимальная реализация нужного контракта:
 *  один канал (`track`), через который проходят все диагностические
 *  события, вместо того чтобы каждый модуль сам решал, звать ли
 *  console.log. Сегодня единственный "приёмник" — console.info (чтобы
 *  события были видны при разработке); замена на реальную систему
 *  (Sentry/аналитику/бекенд-логи) — это правка одного файла, а не поиск
 *  console.log по всему репозиторию. */
export interface DiagnosticEvent {
  name: string;
  payload?: Record<string, unknown>;
  timestamp: number;
}

export type DiagnosticsSink = (event: DiagnosticEvent) => void;

function createDiagnostics() {
  const sinks: DiagnosticsSink[] = [
    (event) => {
      // eslint-disable-next-line no-console -- единственное разрешённое место вызова console.* во всём Platform Core
      console.info(`[diagnostics] ${event.name}`, event.payload ?? {});
    },
  ];

  return {
    track(name: string, payload?: Record<string, unknown>): void {
      const event: DiagnosticEvent = { name, payload, timestamp: Date.now() };
      sinks.forEach((sink) => sink(event));
    },
    /** Позволяет добавить приёмник (например, реальную систему аналитики)
     *  без изменения мест вызова track(). */
    addSink(sink: DiagnosticsSink): () => void {
      sinks.push(sink);
      return () => {
        const index = sinks.indexOf(sink);
        if (index >= 0) sinks.splice(index, 1);
      };
    },
  };
}

export const Diagnostics = createDiagnostics();
