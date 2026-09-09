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

export interface ConversationMemberSettingsDto {
  archived: boolean;
  muted: boolean;
  pinned: boolean;
  favorited: boolean;
  archivedAt: string | null;
  mutedAt: string | null;
  mutedUntil: string | null;
  pinnedAt: string | null;
  favoritedAt: string | null;
  clearedAt: string | null;
  clearedThroughMessageId: string | null;
}

export interface DirectConversationResponseDto {
  id: string;
  type: 'direct';
  otherParticipant: ConversationParticipantDto;
  latestMessage: ConversationLatestMessageDto | null;
  unreadCount: number;
  settings: ConversationMemberSettingsDto;
  lastActivityAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface GroupConversationParticipantDto {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  role: 'owner' | 'admin' | 'member';
}

export interface GroupConversationResponseDto {
  id: string;
  type: 'group';
  name: string;
  avatarUrl: string | null;
  participants: GroupConversationParticipantDto[];
  role: 'owner' | 'admin' | 'member';
  latestMessage: ConversationLatestMessageDto | null;
  unreadCount: number;
  settings: ConversationMemberSettingsDto;
  lastActivityAt: string;
  createdAt: string;
  updatedAt: string;
}

export type ConversationResponseDto = DirectConversationResponseDto | GroupConversationResponseDto;

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

export interface CreateGroupConversationDto {
  name: string;
  participantIds: string[];
  avatarUrl?: string | null;
}

export interface UpdateGroupConversationDto {
  name?: string;
  avatarUrl?: string | null;
}

export interface AddGroupMembersDto {
  participantIds: string[];
}

export interface UpdateGroupMemberRoleDto {
  role: 'admin' | 'member';
}

export interface TransferGroupOwnershipDto {
  newOwnerId: string;
}

export interface UpdateConversationSettingsDto {
  archived?: boolean;
  muted?: boolean;
  pinned?: boolean;
}

export interface ConversationSettingsResponseDto {
  conversationId: string;
  archived: boolean;
  muted: boolean;
  pinned: boolean;
  favorited: boolean;
  archivedAt: string | null;
  mutedAt: string | null;
  mutedUntil: string | null;
  pinnedAt: string | null;
  favoritedAt: string | null;
  clearedAt: string | null;
  clearedThroughMessageId: string | null;
}

export interface MuteConversationDto {
  duration: '8_hours' | '24_hours' | '7_days' | 'always';
}

export interface ClearConversationMessagesResponseDto {
  conversationId: string;
  changed: boolean;
  clearedAt: string | null;
  clearedThroughMessageId: string | null;
}
