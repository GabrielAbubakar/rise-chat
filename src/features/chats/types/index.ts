export interface MatchContactsDto {
  phoneNumbers: string[];
}

export interface PublicDiscoveryUserDto {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface ContactMatchDto {
  matchedPhoneNumber: string;
  user: PublicDiscoveryUserDto;
}

export interface ContactMatchesResponseDto {
  matches: ContactMatchDto[];
}

export interface UserSearchResponseDto {
  items: PublicDiscoveryUserDto[];
  nextCursor: string | null;
}

export interface CreateDirectConversationDto {
  participantId: string;
}

export interface ConversationParticipantDto {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface ConversationLatestMessageDto {
  id: string;
  senderId: string;
  kind: 'text';
  preview: string;
  createdAt: string;
}

export interface ConversationResponseDto {
  id: string;
  type: 'direct';
  otherParticipant: ConversationParticipantDto;
  latestMessage: ConversationLatestMessageDto | null;
  unreadCount: number;
  lastActivityAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationPageInfoDto {
  nextCursor: string | null;
  hasNextPage: boolean;
}

export interface ConversationListResponseDto {
  items: ConversationResponseDto[];
  pageInfo: ConversationPageInfoDto;
}

export interface SendMessageDto {
  clientMessageId: string;
  text: string;
}

export interface MessageResponseDto {
  id: string;
  conversationId: string;
  clientMessageId: string;
  senderId: string;
  kind: 'text';
  text: string;
  createdAt: string;
}

export interface MessagePageInfoDto {
  nextCursor: string | null;
  hasNextPage: boolean;
}

export interface MessageHistoryResponseDto {
  items: MessageResponseDto[];
  pageInfo: MessagePageInfoDto;
}

export interface ConversationReadStateResponseDto {
  conversationId: string;
  lastReadAt: string;
  unreadCount: number;
}

export interface UpdateReceiptDto {
  throughMessageId: string;
}

export interface ReceiptBoundaryResponseDto {
  messageId: string;
  at: string;
}

export interface ReceiptUpdateResponseDto {
  conversationId: string;
  status: 'delivered' | 'read';
  throughMessageId: string;
  at: string;
  changed: boolean;
  unreadCount: number;
  version: number;
  delivered: ReceiptBoundaryResponseDto;
  read: ReceiptBoundaryResponseDto | null;
}

export interface ReceiptFrontierResponseDto {
  userId: string;
  version: number;
  delivered: ReceiptBoundaryResponseDto | null;
  read: ReceiptBoundaryResponseDto | null;
}

export interface ReceiptFrontiersResponseDto {
  conversationId: string;
  items: ReceiptFrontierResponseDto[];
}
