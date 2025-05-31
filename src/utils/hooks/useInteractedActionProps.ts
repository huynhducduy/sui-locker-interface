export default function useInteractedActionProps(
  action: MemoizedCallback<() => void>,
  delay = 200,
) {
  const isInteracted = useRef(false)

  const setInteracted = useCallback(() => {
    isInteracted.current = true
    setTimeout(() => {
      if (!isInteracted.current) return
      action()
    }, delay)
  }, [action, delay])

  const resetInteracted = useCallback(() => {
    isInteracted.current = false
  }, [])

  // TODO: support touch devices
  return {
    onMouseEnter: setInteracted,
    onMouseLeave: resetInteracted,
    onFocus: setInteracted,
    onBlur: resetInteracted,
  }
}
