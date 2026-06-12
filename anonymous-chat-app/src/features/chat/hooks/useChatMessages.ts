import { ChangeEvent, ClipboardEvent, KeyboardEvent, useCallback, useState } from 'react';
import { MAX_ATTACHMENT_SIZE } from '../constants';
import type { ChatMessage, ReadReceipt, SocketRef } from '../types';

type UseChatMessagesArgs = {
  roomId?: string;
  username: string;
  socketRef: SocketRef;
  onStatus: (message: string) => void;
  keepInputFocused: () => void;
};

export function useChatMessages({
  roomId,
  username,
  socketRef,
  onStatus,
  keepInputFocused,
}: UseChatMessagesArgs) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const receiveMessage = useCallback((incoming: ChatMessage) => {
    setMessages((current) => {
      if (!incoming.id) return [...current, incoming];

      const existingIndex = current.findIndex((item) => item.id === incoming.id);
      if (existingIndex === -1) return [...current, incoming];

      return current.map((item, index) => (index === existingIndex ? incoming : item));
    });
  }, []);

  const applyReadReceipt = useCallback(
    ({ messageId, receipt }: { messageId: string; receipt: ReadReceipt }) => {
      setMessages((current) =>
        current.map((item) => {
          if (item.id !== messageId) return item;

          const readBy = item.readBy || [];
          if (readBy.some((reader) => reader.userId === receipt.userId)) return item;

          return {
            ...item,
            readBy: [...readBy, receipt],
          };
        })
      );
    },
    []
  );

  const markMessagesAsRead = useCallback((canMarkRead: boolean) => {
    if (!canMarkRead) return;

    const socketId = socketRef.current?.id;
    if (!roomId || !socketId) return;

    const unreadMessageIds = messages
      .filter((item) => item.senderId !== socketId)
      .filter((item) => !(item.readBy || []).some((reader) => reader.userId === socketId))
      .map((item) => item.id)
      .filter((id): id is string => Boolean(id));

    if (unreadMessageIds.length === 0) return;
    socketRef.current?.emit('mark-read', roomId, unreadMessageIds);
  }, [messages, roomId, socketRef]);

  const sendChatMessage = useCallback(
    (payload: Pick<ChatMessage, 'text' | 'image' | 'imageName' | 'attachment'>) => {
      if (!payload.text?.trim() && !payload.image && !payload.attachment) return;

      socketRef.current?.emit('send-message', roomId, {
        user: username,
        text: payload.text?.trim(),
        image: payload.image,
        imageName: payload.imageName,
        attachment: payload.attachment,
        timestamp: new Date().toISOString(),
      });
    },
    [roomId, socketRef, username]
  );

  const sendMessage = () => {
    sendChatMessage({ text: message });
    setMessage('');
    keepInputFocused();
  };

  const sendFile = (file: File) => {
    onStatus('');

    if (file.size > MAX_ATTACHMENT_SIZE) {
      onStatus('Attachment is too large. Choose a file under 5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') return;

      sendChatMessage({
        attachment: {
          data: reader.result,
          name: file.name || 'Attachment',
          type: file.type || 'application/octet-stream',
          size: file.size,
        },
      });
      keepInputFocused();
    };
    reader.readAsDataURL(file);
  };

  const sendPastedImage = (file: File) => {
    onStatus('');

    if (file.size > MAX_ATTACHMENT_SIZE) {
      onStatus('Image is too large. Paste an image under 5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') return;

      sendChatMessage({
        image: reader.result,
        imageName: file.name || 'Pasted image',
      });
      keepInputFocused();
    };
    reader.readAsDataURL(file);
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const imageItem = Array.from(event.clipboardData.items).find((item) =>
      item.type.startsWith('image/')
    );

    if (!imageItem) {
      onStatus('');
      return;
    }

    const file = imageItem.getAsFile();
    if (!file) return;

    event.preventDefault();
    sendPastedImage(file);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) sendFile(file);
    event.target.value = '';
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  return {
    message,
    messages,
    setMessage,
    receiveMessage,
    applyReadReceipt,
    markMessagesAsRead,
    sendMessage,
    handlePaste,
    handleFileChange,
    handleKeyDown,
  };
}
