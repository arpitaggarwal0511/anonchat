'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import type { Socket } from 'socket.io-client';
import { getSocketUrl } from '@/lib/socket';
import { ChatFooter } from '@/features/chat/components/ChatFooter';
import { ChatHeader } from '@/features/chat/components/ChatHeader';
import { ImagePreviewDialog } from '@/features/chat/components/ImagePreviewDialog';
import { MessageList } from '@/features/chat/components/MessageList';
import { useAnonymousUser } from '@/features/chat/hooks/useAnonymousUser';
import { useChatMessages } from '@/features/chat/hooks/useChatMessages';
import { useChatSocket } from '@/features/chat/hooks/useChatSocket';
import { useNetworkStats } from '@/features/chat/hooks/useNetworkStats';
import { usePagePresence } from '@/features/chat/hooks/usePagePresence';
import { useThemeMode } from '@/features/chat/hooks/useThemeMode';
import { useVoiceChat } from '@/features/chat/hooks/useVoiceChat';
import type { ImagePreview } from '@/features/chat/types';

export default function ChatRoom() {
  const params = useParams();
  const roomId = Array.isArray(params.roomId) ? params.roomId[0] : params.roomId;
  const socketRef = useRef<Socket | null>(null);
  const chatScrollRef = useRef<HTMLElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeImage, setActiveImage] = useState<ImagePreview | null>(null);
  const [socketUrl] = useState(getSocketUrl);
  const isPageActive = usePagePresence();
  const { isDark, setIsDark } = useThemeMode();
  const user = useAnonymousUser(setStatusMessage);

  const keepInputFocused = () => {
    window.requestAnimationFrame(() => {
      inputRef.current?.focus({ preventScroll: true });
    });
  };

  const chat = useChatMessages({
    roomId,
    username: user.username,
    socketRef,
    onStatus: setStatusMessage,
    keepInputFocused,
  });
  const {
    message,
    messages,
    setMessage,
    receiveMessage,
    applyReadReceipt,
    markMessagesAsRead,
    sendMessage: sendChatMessage,
    handlePaste,
    handleFileChange,
    handleKeyDown,
  } = chat;

  const network = useNetworkStats({
    socketRef,
    socketUrl,
    onStatus: setStatusMessage,
  });

  const voice = useVoiceChat({
    roomId,
    username: user.username,
    socketRef,
    connectionStatus: network.connectionStatus,
    onStatus: setStatusMessage,
  });

  useChatSocket({
    roomId,
    username: user.username,
    socketRef,
    onMessage: receiveMessage,
    onMessageRead: applyReadReceipt,
    voiceHandlers: voice.handlers,
  });

  useLayoutEffect(() => {
    markMessagesAsRead(isPageActive);
  }, [isPageActive, messages, markMessagesAsRead]);

  useLayoutEffect(() => {
    const chatPane = chatScrollRef.current;
    if (!chatPane) return;

    chatPane.scrollTop = chatPane.scrollHeight;
  }, [messages]);

  const addEmoji = (emoji: string) => {
    setMessage(`${message}${emoji}`);
    keepInputFocused();
  };

  const sendMessage = () => {
    sendChatMessage();
    setShowEmojiPicker(false);
  };

  const copyRoomCode = async () => {
    if (!roomId) return;
    await navigator.clipboard.writeText(roomId);
    setStatusMessage('Room code copied.');
  };

  const shellClass = isDark
    ? 'bg-slate-950 text-slate-100'
    : 'bg-[radial-gradient(circle_at_top_left,#dbeafe,transparent_32%),#f8fafc] text-slate-950';
  const panelClass = isDark ? 'bg-slate-900 shadow-blue-950/30' : 'bg-white shadow-slate-300/70';
  const headerClass = isDark ? 'border-slate-800 bg-slate-900/95' : 'border-slate-200 bg-white/95';
  const softClass = isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600';

  return (
    <div className={`h-[100dvh] overflow-hidden ${shellClass}`}>
      <div className={`mx-auto flex h-[100dvh] max-w-4xl flex-col overflow-hidden shadow-2xl ${panelClass}`}>
        <ChatHeader
          roomId={roomId}
          username={user.username}
          draftUsername={user.draftUsername}
          isEditingName={user.isEditingName}
          isDark={isDark}
          headerClass={headerClass}
          softClass={softClass}
          setDraftUsername={user.setDraftUsername}
          setIsEditingName={user.setIsEditingName}
          setIsDark={setIsDark}
          saveUsername={user.saveUsername}
          copyRoomCode={copyRoomCode}
        />

        <MessageList
          messages={messages}
          username={user.username}
          currentUserId={socketRef.current?.id}
          isDark={isDark}
          chatScrollRef={chatScrollRef}
          setActiveImage={setActiveImage}
        />

        <ChatFooter
          isDark={isDark}
          headerClass={headerClass}
          statusMessage={statusMessage}
          showEmojiPicker={showEmojiPicker}
          message={message}
          connectionStatus={network.connectionStatus}
          chatLatency={network.chatLatency}
          isVoiceOn={voice.isVoiceOn}
          voicePeers={voice.voicePeers}
          voiceLatency={voice.voiceLatency}
          voiceParticipants={voice.voiceParticipants}
          showVoiceMenu={voice.showVoiceMenu}
          socket={socketRef.current}
          inputRef={inputRef}
          fileInputRef={fileInputRef}
          setMessage={setMessage}
          setShowEmojiPicker={setShowEmojiPicker}
          setShowVoiceMenu={voice.setShowVoiceMenu}
          addEmoji={addEmoji}
          sendMessage={sendMessage}
          toggleVoiceChat={voice.toggleVoiceChat}
          handlePaste={handlePaste}
          handleFileChange={handleFileChange}
          handleKeyDown={handleKeyDown}
        />
      </div>

      <ImagePreviewDialog image={activeImage} onClose={() => setActiveImage(null)} />
    </div>
  );
}
