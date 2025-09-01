import 'server-only';

import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  inArray,
  lt,
  type SQL,
} from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { supabase } from '../supabase';

import {
  user,
  chat,
  type User,
  document,
  type Suggestion,
  suggestion,
  message,
  vote,
  type DBMessage,
  type Chat,
  stream,
} from './schema';
import type { ArtifactKind } from '@/components/artifact';
import { generateUUID } from '../utils';
import { generateHashedPassword } from './utils';
import type { VisibilityType } from '@/components/visibility-selector';
import { ChatSDKError } from '../errors';

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle

// Fix for CONNECT_TIMEOUT in Next.js development - use global database instance
declare global {
  var _db: ReturnType<typeof drizzle> | undefined;
  var _client: ReturnType<typeof postgres> | undefined;
}

const createDb = () => {
  if (!global._db) {
    // biome-ignore lint: Forbidden non-null assertion.
    global._client = postgres(process.env.POSTGRES_URL!, {
      prepare: false, // Required for transaction pooler
    });
    global._db = drizzle(global._client);
  }
  return global._db;
};

const db = createDb();

export async function getUser(email: string): Promise<Array<User>> {
  try {
    return await db.select().from(user).where(eq(user.email, email));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get user by email',
    );
  }
}

export async function createUser(email: string, password: string) {
  const hashedPassword = generateHashedPassword(password);

  try {
    return await db.insert(user).values({ email, password: hashedPassword });
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to create user');
  }
}

export async function createGuestUser() {
  console.log('🔄 createGuestUser() called - creating new guest user...');
  const email = `guest-${Date.now()}@example.com`;
  const password = generateHashedPassword(generateUUID());

  try {
    console.log('📝 Attempting to create guest user with email:', email);

    // Use Supabase REST API instead of direct PostgreSQL connection
    const { data, error } = await supabase
      .from('User')
      .insert({ email, password })
      .select('id, email')
      .single();

    if (error) {
      console.error('❌ Supabase error creating guest user:', error);
      throw error;
    }

    console.log('✅ Guest user created successfully:', data);
    return [data]; // Return in array format to match original function
  } catch (error) {
    console.error('❌ Failed to create guest user:', error);
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to create guest user',
    );
  }
}

export async function saveChat({
  id,
  userId,
  title,
  visibility,
}: {
  id: string;
  userId: string;
  title: string;
  visibility: VisibilityType;
}) {
  try {
    // Use Supabase REST API instead of direct PostgreSQL connection
    const { data, error } = await supabase
      .from('Chat')
      .insert({
        id,
        createdAt: new Date().toISOString(),
        userId,
        title,
        visibility,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error saving chat:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to save chat:', error);
    throw new ChatSDKError('bad_request:database', 'Failed to save chat');
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    await db.delete(vote).where(eq(vote.chatId, id));
    await db.delete(message).where(eq(message.chatId, id));
    await db.delete(stream).where(eq(stream.chatId, id));

    const [chatsDeleted] = await db
      .delete(chat)
      .where(eq(chat.id, id))
      .returning();
    return chatsDeleted;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete chat by id',
    );
  }
}

export async function getChatsByUserId({
  id,
  limit,
  startingAfter,
  endingBefore,
}: {
  id: string;
  limit: number;
  startingAfter: string | null;
  endingBefore: string | null;
}) {
  try {
    // Use Supabase REST API instead of direct PostgreSQL connection
    let query = supabase
      .from('Chat')
      .select('*')
      .eq('userId', id)
      .order('createdAt', { ascending: false })
      .limit(limit + 1);

    // Simple pagination implementation for Supabase
    if (startingAfter) {
      // Get the timestamp of the starting chat for pagination
      const { data: startChat } = await supabase
        .from('Chat')
        .select('createdAt')
        .eq('id', startingAfter)
        .single();

      if (startChat) {
        query = query.gt('createdAt', startChat.createdAt);
      }
    } else if (endingBefore) {
      // Get the timestamp of the ending chat for pagination
      const { data: endChat } = await supabase
        .from('Chat')
        .select('createdAt')
        .eq('id', endingBefore)
        .single();

      if (endChat) {
        query = query.lt('createdAt', endChat.createdAt);
      }
    }

    const { data: filteredChats, error } = await query;

    if (error) {
      console.error('Supabase error getting chats by user id:', error);
      throw error;
    }

    const hasMore = (filteredChats?.length || 0) > limit;

    return {
      chats: hasMore ? filteredChats!.slice(0, limit) : (filteredChats || []),
      hasMore,
    };
  } catch (error) {
    console.error('Failed to get chats by user id:', error);
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get chats by user id',
    );
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    // Use Supabase REST API instead of direct PostgreSQL connection
    const { data, error } = await supabase
      .from('Chat')
      .select('*')
      .eq('id', id)
      .maybeSingle(); // Use maybeSingle() instead of single() to handle no results

    if (error) {
      console.error('Supabase error getting chat by id:', error);
      throw error;
    }

    return data; // Will be null if no chat found, which is expected behavior
  } catch (error) {
    console.error('Failed to get chat by id:', error);
    throw new ChatSDKError('bad_request:database', 'Failed to get chat by id');
  }
}

export async function saveMessages({
  messages,
}: {
  messages: Array<any>; // Use any for now to handle both old and new message formats
}) {
  try {
    // Use Supabase REST API instead of direct PostgreSQL connection
    const { data, error } = await supabase
      .from('Message')
      .insert(messages)
      .select();

    if (error) {
      console.error('Supabase error saving messages:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to save messages:', error);
    throw new ChatSDKError('bad_request:database', 'Failed to save messages');
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    // Use Supabase REST API instead of direct PostgreSQL connection
    const { data, error } = await supabase
      .from('Message')
      .select('*')
      .eq('chatId', id)
      .order('createdAt', { ascending: true });

    if (error) {
      console.error('Supabase error getting messages by chat id:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Failed to get messages by chat id:', error);
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get messages by chat id',
    );
  }
}

export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: 'up' | 'down';
}) {
  try {
    const [existingVote] = await db
      .select()
      .from(vote)
      .where(and(eq(vote.messageId, messageId)));

    if (existingVote) {
      return await db
        .update(vote)
        .set({ isUpvoted: type === 'up' })
        .where(and(eq(vote.messageId, messageId), eq(vote.chatId, chatId)));
    }
    return await db.insert(vote).values({
      chatId,
      messageId,
      isUpvoted: type === 'up',
    });
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to vote message');
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  try {
    return await db.select().from(vote).where(eq(vote.chatId, id));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get votes by chat id',
    );
  }
}

export async function saveDocument({
  id,
  title,
  kind,
  content,
  userId,
}: {
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string;
  userId: string;
}) {
  try {
    return await db
      .insert(document)
      .values({
        id,
        title,
        kind,
        content,
        userId,
        createdAt: new Date(),
      })
      .returning();
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to save document');
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  try {
    const documents = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(asc(document.createdAt));

    return documents;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get documents by id',
    );
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    const [selectedDocument] = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(desc(document.createdAt));

    return selectedDocument;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get document by id',
    );
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  try {
    await db
      .delete(suggestion)
      .where(
        and(
          eq(suggestion.documentId, id),
          gt(suggestion.documentCreatedAt, timestamp),
        ),
      );

    return await db
      .delete(document)
      .where(and(eq(document.id, id), gt(document.createdAt, timestamp)))
      .returning();
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete documents by id after timestamp',
    );
  }
}

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Array<Suggestion>;
}) {
  try {
    return await db.insert(suggestion).values(suggestions);
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to save suggestions',
    );
  }
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  try {
    return await db
      .select()
      .from(suggestion)
      .where(and(eq(suggestion.documentId, documentId)));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get suggestions by document id',
    );
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    return await db.select().from(message).where(eq(message.id, id));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get message by id',
    );
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  try {
    const messagesToDelete = await db
      .select({ id: message.id })
      .from(message)
      .where(
        and(eq(message.chatId, chatId), gte(message.createdAt, timestamp)),
      );

    const messageIds = messagesToDelete.map((message) => message.id);

    if (messageIds.length > 0) {
      await db
        .delete(vote)
        .where(
          and(eq(vote.chatId, chatId), inArray(vote.messageId, messageIds)),
        );

      return await db
        .delete(message)
        .where(
          and(eq(message.chatId, chatId), inArray(message.id, messageIds)),
        );
    }
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete messages by chat id after timestamp',
    );
  }
}

export async function updateChatVisiblityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: 'private' | 'public';
}) {
  try {
    return await db.update(chat).set({ visibility }).where(eq(chat.id, chatId));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to update chat visibility by id',
    );
  }
}

export async function getMessageCountByUserId({
  id,
  differenceInHours,
}: { id: string; differenceInHours: number }) {
  try {
    const twentyFourHoursAgo = new Date(
      Date.now() - differenceInHours * 60 * 60 * 1000,
    ).toISOString();

    // Use Supabase REST API with RPC for complex queries
    // First get chats by user, then count messages
    const { data: userChats, error: chatsError } = await supabase
      .from('Chat')
      .select('id')
      .eq('userId', id);

    if (chatsError) {
      console.error('Supabase error getting user chats:', chatsError);
      throw chatsError;
    }

    if (!userChats || userChats.length === 0) {
      return 0;
    }

    const chatIds = userChats.map(chat => chat.id);

    // Count messages from user's chats within time period
    const { count, error: countError } = await supabase
      .from('Message_v2')
      .select('*', { count: 'exact', head: true })
      .in('chatId', chatIds)
      .eq('role', 'user')
      .gte('createdAt', twentyFourHoursAgo);

    if (countError) {
      console.error('Supabase error counting messages:', countError);
      throw countError;
    }

    return count ?? 0;
  } catch (error) {
    console.error('Failed to get message count by user id:', error);
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get message count by user id',
    );
  }
}

export async function createStreamId({
  streamId,
  chatId,
  messageId,
}: {
  streamId: string;
  chatId: string;
  messageId: string; // Required field in the actual database
}) {
  try {
    // Use Supabase REST API instead of direct PostgreSQL connection
    // Match the actual database schema: id, messageId, chatId, content, createdAt
    const { data, error } = await supabase
      .from('Stream')
      .insert({
        id: streamId,
        messageId: messageId, // Required field
        chatId: chatId,
        content: {}, // Required jsonb field - empty object for now
        createdAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error creating stream id:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to create stream id:', error);
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to create stream id',
    );
  }
}

export async function getStreamIdsByChatId({ chatId }: { chatId: string }) {
  try {
    // Use Supabase REST API instead of direct PostgreSQL connection
    const { data, error } = await supabase
      .from('Stream')
      .select('id')
      .eq('chatId', chatId)
      .order('createdAt', { ascending: true });

    if (error) {
      console.error('Supabase error getting stream ids:', error);
      throw error;
    }

    return data?.map(({ id }) => id) || [];
  } catch (error) {
    console.error('Failed to get stream ids by chat id:', error);
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get stream ids by chat id',
    );
  }
}
