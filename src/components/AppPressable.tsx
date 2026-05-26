import React, { useCallback, useState } from 'react'
import type { GestureResponderEvent } from 'react-native'
import { Pressable } from '@/components/ui/pressable'
import { INTERACTION_HIT_SLOP_PX } from '@/src/constants/interaction'
import {
  InteractionFeedbackKind,
  useInteractionFeedback,
} from '@/src/hooks/useInteractionFeedback'

type BasePressableProps = React.ComponentProps<typeof Pressable>

interface AppPressableProps extends BasePressableProps {
  selected?: boolean
  checked?: boolean
  busy?: boolean
  feedback?: InteractionFeedbackKind
  pressedClassName?: string
  selectedClassName?: string
  checkedClassName?: string
  busyClassName?: string
}

/**
 * Adds app-level touch feedback, haptics, and accessibility state to Pressable.
 * @param props - Existing Pressable props plus interaction state flags.
 * @returns A Pressable with normalized busy, selected, checked, and pressed state.
 * @example
 * <AppPressable checked feedback="complete" onPress={saveTask} />
 */
export const AppPressable = React.forwardRef<
  React.ComponentRef<typeof Pressable>,
  AppPressableProps
>(function AppPressable(
  {
    accessibilityState,
    busy = false,
    busyClassName = 'opacity-60',
    checked,
    checkedClassName,
    className,
    disabled,
    feedback = 'none',
    hitSlop,
    onPress,
    onPressIn,
    onPressOut,
    pressedClassName = 'opacity-80',
    selected,
    selectedClassName,
    ...props
  },
  ref
) {
  const [isPressed, setIsPressed] = useState(false)
  const triggerFeedback = useInteractionFeedback()
  const isUnavailable = Boolean(disabled) || busy

  const handlePressIn: BasePressableProps['onPressIn'] = useCallback(
    (event: GestureResponderEvent) => {
      if (!isUnavailable) {
        setIsPressed(true)
        triggerFeedback(feedback)
      }

      onPressIn?.(event)
    },
    [feedback, isUnavailable, onPressIn, triggerFeedback]
  )

  const handlePressOut: BasePressableProps['onPressOut'] = useCallback(
    (event: GestureResponderEvent) => {
      setIsPressed(false)
      onPressOut?.(event)
    },
    [onPressOut]
  )

  const handlePress: BasePressableProps['onPress'] = useCallback(
    (event: GestureResponderEvent) => {
      if (isUnavailable) {
        return
      }

      onPress?.(event)
    },
    [isUnavailable, onPress]
  )

  return (
    <Pressable
      {...props}
      ref={ref}
      accessibilityState={{
        ...accessibilityState,
        busy: busy || accessibilityState?.busy,
        checked: checked ?? accessibilityState?.checked,
        disabled: isUnavailable || accessibilityState?.disabled,
        selected: selected ?? accessibilityState?.selected,
      }}
      className={[
        className,
        isPressed ? pressedClassName : null,
        selected ? selectedClassName : null,
        checked ? checkedClassName : null,
        busy ? busyClassName : null,
      ]
        .filter(Boolean)
        .join(' ')}
      disabled={isUnavailable}
      hitSlop={hitSlop ?? INTERACTION_HIT_SLOP_PX}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    />
  )
})
