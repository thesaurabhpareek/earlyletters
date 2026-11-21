/**
 * The picture on Review, before Keep (NS-01-R7, R21; design spec 4). Review has a draft, so a picture chosen on Home is
 * stored with the draft now (entry_media `draft_id`, ADR 0028 D1) and survives Close and a kill; Keep moves it to the
 * letter in the same transaction as the letter (store.saveLetterFromDraft). Add, replace, take off with Undo, and the
 * words and place, are the letter page's own controls (LetterPhoto), used here with the draft's id. The app writes no
 * caption. Absent when the photos switch is off.
 */
import { useEffect } from 'react';
import { usePendingPhoto, adoptPendingPhoto } from '@/lib/photos/hooks';
import { useWindowDimensions, View } from 'react-native';
import { LetterPhoto, LetterPicture } from './letter-photo';

export function ReviewPhoto({ draftId, finalText }: { draftId: string; finalText: string }) {
  const pending = usePendingPhoto();
  const uri = pending?.source?.uri ?? null;
  useEffect(() => {
    if (uri) void adoptPendingPhoto(draftId, finalText, false);
  }, [uri, draftId, finalText]);
  const { width } = useWindowDimensions();
  // The picture itself first, then its controls (NS-01-R7): the parent sees the picture they are changing or taking off.
  return (
    <View className="gap-2" testID="review.photo">
      <LetterPicture entryId={draftId} own columnWidth={width - 48} />
      <LetterPhoto entryId={draftId} finalText={finalText} own draft />
    </View>
  );
}
