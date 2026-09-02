import { useEffect, useMemo, useState } from "react";
import { MessageResponseDto } from "../types";

export interface UseChatSearchOptions {
  messages: MessageResponseDto[];
  initialSearching?: boolean;
  onScrollToIndex?: (index: number) => void;
}

export function useChatSearch({
  messages,
  initialSearching = false,
  onScrollToIndex,
}: UseChatSearchOptions) {
  const [isSearching, setIsSearching] = useState(initialSearching);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  // Compute matching indices for search
  const matchingIndices = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];
    const indices: number[] = [];
    messages.forEach((item, index) => {
      if (item.text.toLowerCase().includes(query)) {
        indices.push(index);
      }
    });
    return indices;
  }, [searchQuery, messages]);

  useEffect(() => {
    setCurrentMatchIndex(0);
    if (matchingIndices.length > 0 && onScrollToIndex) {
      onScrollToIndex(matchingIndices[0]);
    }
  }, [searchQuery, matchingIndices, onScrollToIndex]);

  const handlePrevMatch = () => {
    if (matchingIndices.length === 0) return;
    const nextIdx =
      currentMatchIndex > 0
        ? currentMatchIndex - 1
        : matchingIndices.length - 1;
    setCurrentMatchIndex(nextIdx);
    if (onScrollToIndex) {
      onScrollToIndex(matchingIndices[nextIdx]);
    }
  };

  const handleNextMatch = () => {
    if (matchingIndices.length === 0) return;
    const nextIdx =
      currentMatchIndex < matchingIndices.length - 1
        ? currentMatchIndex + 1
        : 0;
    setCurrentMatchIndex(nextIdx);
    if (onScrollToIndex) {
      onScrollToIndex(matchingIndices[nextIdx]);
    }
  };

  const handleExitSearch = () => {
    setIsSearching(false);
    setSearchQuery("");
    setCurrentMatchIndex(0);
  };

  return {
    isSearching,
    setIsSearching,
    searchQuery,
    setSearchQuery,
    currentMatchIndex,
    matchingIndices,
    handlePrevMatch,
    handleNextMatch,
    handleExitSearch,
  };
}
