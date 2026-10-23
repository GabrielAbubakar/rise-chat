import { useQuery } from "@tanstack/react-query";
import * as Contacts from "expo-contacts/legacy";
import { chatsApi } from "../api";
import type { ContactMatchDto } from "../types";
import { chatsKeys } from "./chatsKeys";

export interface ContactItem {
  id: string;
  name: string;
  phone?: string;
  avatar?: string;
  participantId?: string;
}

/**
 * Normalizes device contact phone numbers to E.164/international format.
 * Strips formatting characters (spaces, hyphens, brackets, dots).
 */
export function normalizePhoneNumber(raw?: string | null): string | null {
  if (!raw) return null;
  let cleaned = raw.trim().replace(/[^\d+]/g, "");
  if (cleaned.startsWith("00")) {
    cleaned = "+" + cleaned.slice(2);
  }
  const digitCount = cleaned.replace(/\D/g, "").length;
  if (digitCount < 5) return null;
  return cleaned;
}

const BATCH_SIZE = 100;

interface ContactDiscoveryResult {
  permissionStatus: Contacts.PermissionStatus;
  localContacts: ContactItem[];
  matchedUsers: ContactMatchDto[];
}

export function useContactDiscovery(isOpen: boolean) {
  // Check permission status from device
  const permissionQuery = useQuery({
    queryKey: [...chatsKeys.contacts(), "permission"],
    queryFn: async () => {
      const { status } = await Contacts.getPermissionsAsync();
      return status;
    },
  });

  const isGranted = permissionQuery.data === "granted";

  // Query device contacts using Expo Contacts and match against backend
  const contactsQuery = useQuery<ContactDiscoveryResult>({
    queryKey: chatsKeys.contacts(),
    queryFn: async () => {
      // 1. Request permissions if not yet granted
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== "granted") {
        return {
          permissionStatus: status,
          localContacts: [],
          matchedUsers: [],
        };
      }

      // 2. Fetch contacts from device's address book
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Image],
      });

      if (!data || data.length === 0) {
        return {
          permissionStatus: status,
          localContacts: [],
          matchedUsers: [],
        };
      }

      const mappedContacts: ContactItem[] = data
        .filter((c) => c.name)
        .map((c) => ({
          id: c.id,
          name: c.name,
          phone: c.phoneNumbers?.[0]?.number,
          avatar: c.imageAvailable && c.image ? c.image.uri : undefined,
        }));

      // 3. Normalize, deduplicate, and chunk phone numbers
      const normalizedNumbersSet = new Set<string>();
      for (const c of data) {
        if (!c.phoneNumbers) continue;
        for (const p of c.phoneNumbers) {
          if (p.number) {
            const normalized = normalizePhoneNumber(p.number);
            if (normalized) {
              normalizedNumbersSet.add(normalized);
            }
          }
        }
      }

      const phoneNumbers = Array.from(normalizedNumbersSet);
      if (phoneNumbers.length === 0) {
        return {
          permissionStatus: status,
          localContacts: mappedContacts,
          matchedUsers: [],
        };
      }

      const chunks: string[][] = [];
      for (let i = 0; i < phoneNumbers.length; i += BATCH_SIZE) {
        chunks.push(phoneNumbers.slice(i, i + BATCH_SIZE));
      }

      // 4. Batch match contacts against backend; isolate errors so device contacts always display
      let matchedUsers: ContactMatchDto[] = [];
      try {
        const batchResponses = await Promise.all(
          chunks.map((batch) => chatsApi.matchContacts({ phoneNumbers: batch })),
        );
        for (const res of batchResponses) {
          if (res?.matches) {
            matchedUsers.push(...res.matches);
          }
        }
      } catch (apiErr) {
        console.warn("Contact matching API failed (showing local contacts):", apiErr);
      }

      return {
        permissionStatus: status,
        localContacts: mappedContacts,
        matchedUsers,
      };
    },
    // Run if sheet is opened OR if permissions were already granted
    enabled: isOpen || isGranted,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

  return {
    localContacts: contactsQuery.data?.localContacts ?? [],
    matchedUsers: contactsQuery.data?.matchedUsers ?? [],
    permissionStatus:
      contactsQuery.data?.permissionStatus ??
      permissionQuery.data ??
      null,
    isLoading: contactsQuery.isLoading,
    refreshContacts: contactsQuery.refetch,
  };
}
