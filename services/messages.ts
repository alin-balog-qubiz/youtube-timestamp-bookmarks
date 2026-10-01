import { browser } from 'wxt/browser';
import type { Result } from '@/models/messages';

type MessageHandler = (message: unknown) => Result<unknown> | Promise<Result<unknown>>;

export function registerMessageHandlers(handlers: Readonly<Record<string, MessageHandler>>): () => void {
  browser.runtime.onMessage.addListener(handleMessage);
  return () => browser.runtime.onMessage.removeListener(handleMessage);

  function handleMessage(message: unknown, _sender: unknown, sendResponse: (response: Result<unknown>) => void) {
    if (
      typeof message !== 'object' ||
      message === null ||
      !('type' in message) ||
      typeof message.type !== 'string' ||
      !Object.prototype.hasOwnProperty.call(handlers, message.type)
    ) return;

    const handler = handlers[message.type];
    if (!handler) return;

    const response = handler(message);
    if ('ok' in response) {
      sendResponse(response);
      return;
    }

    void response.then(sendResponse);
    return true;
  }
}
