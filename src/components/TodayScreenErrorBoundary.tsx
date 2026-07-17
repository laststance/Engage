import React from 'react'
import { AccessibilityInfo } from 'react-native'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { AppPressable } from '@/src/components/AppPressable'
import { AppScreen } from '@/src/components/AppScreen'

interface TodayScreenErrorBoundaryProps {
  children: React.ReactNode
  errorMessage: string
  retryLabel: string
  title: string
}

interface TodayScreenErrorBoundaryState {
  hasError: boolean
}

const INITIAL_ERROR_STATE: TodayScreenErrorBoundaryState = {
  hasError: false,
}

/**
 * Catches Today descendant render failures and exposes a user-controlled retry path.
 * @param props - The Today subtree plus localized fallback and retry copy.
 * @returns The Today subtree, or a retryable fallback after a render failure.
 * @example
 * <TodayScreenErrorBoundary title="Today" errorMessage="Unable to load" retryLabel="Retry"><DaySheet /></TodayScreenErrorBoundary>
 */
export class TodayScreenErrorBoundary extends React.Component<
  TodayScreenErrorBoundaryProps,
  TodayScreenErrorBoundaryState
> {
  state: TodayScreenErrorBoundaryState = INITIAL_ERROR_STATE

  /**
   * Selects fallback state when React retries this boundary after a descendant failure.
   * @returns Error state that selects the localized fallback.
   * @example
   * TodayScreenErrorBoundary.getDerivedStateFromError() // => { hasError: true }
   */
  static getDerivedStateFromError(): TodayScreenErrorBoundaryState {
    return { hasError: true }
  }

  /**
   * Reports and announces a caught Today render failure after React commits the fallback.
   * @param error - The descendant render error captured by React.
   * @returns Nothing; diagnostics are logged and localized fallback copy is announced.
   * @example
   * boundary.componentDidCatch(new Error('render'))
   */
  componentDidCatch(error: Error): void {
    console.error('TodayScreen: Render error', error)
    AccessibilityInfo.announceForAccessibility(this.props.errorMessage)
  }

  /**
   * Clears a transient render failure when the user explicitly asks Today to retry.
   * @returns Nothing; resetting state remounts the descendant render path.
   * @example
   * boundary.handleRetry()
   */
  handleRetry = (): void => {
    this.setState(INITIAL_ERROR_STATE)
  }

  /**
   * Chooses the Today content or retryable localized fallback on every render.
   * @returns The child tree before failure, otherwise the fallback screen.
   * @example
   * boundary.render() // => Today content or retryable error fallback
   */
  render(): React.ReactNode {
    // A failed child stays isolated until the user requests an explicit retry.
    if (this.state.hasError) {
      return (
        <AppScreen testID="today-screen" title={this.props.title}>
          <VStack className="flex-1 justify-center items-center p-4">
            <Text className="text-red-600 text-center">
              {this.props.errorMessage}
            </Text>
            <AppPressable
              accessibilityLabel={this.props.retryLabel}
              className="bg-system-blue rounded-lg px-5 py-3 mt-4"
              feedback="select"
              onPress={this.handleRetry}
              testID="today-screen-error-retry"
            >
              <Text className="text-white font-medium">
                {this.props.retryLabel}
              </Text>
            </AppPressable>
          </VStack>
        </AppScreen>
      )
    }

    return this.props.children
  }
}
