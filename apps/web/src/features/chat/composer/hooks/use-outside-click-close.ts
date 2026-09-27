import { useEffect, type RefObject } from "react";

/** Closes open dropdowns when mousedown happens outside their refs */
export function useOutsideClickClose(
  showMentions: boolean,
  mentionsRef: RefObject<HTMLElement | null>,
  setShowMentions: (open: boolean) => void,
  showMoreMenu: boolean,
  moreMenuRef: RefObject<HTMLElement | null>,
  setShowMoreMenu: (open: boolean) => void
) {
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (
        showMentions &&
        mentionsRef.current &&
        !mentionsRef.current.contains(e.target as Node)
      ) {
        setShowMentions(false);
      }
      if (
        showMoreMenu &&
        moreMenuRef.current &&
        !moreMenuRef.current.contains(e.target as Node)
      ) {
        setShowMoreMenu(false);
      }
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [
    showMentions,
    showMoreMenu,
    mentionsRef,
    moreMenuRef,
    setShowMentions,
    setShowMoreMenu,
  ]);
}
