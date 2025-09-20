/**
 * Onboarding Component
 * Provides first-run experience with app explanation and task recommendations
 */

import React, { useState } from 'react'
import { Modal, SafeAreaView, ScrollView } from 'react-native'
import { Box } from '@/components/ui/box'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { HStack } from '@/components/ui/hstack'
import { IconSymbol } from '@/components/ui/icon-symbol'
import { EnhancedPressable } from './ui/enhanced-pressable'
import { Task, Category } from '@/src/types'
import { DesignSystemUtils } from '@/src/utils/designSystem'

interface OnboardingProps {
  isVisible: boolean
  recommendedTasks: Task[]
  categories: Category[]
  onComplete: (selectedTaskIds: string[]) => void
  onSkip: () => void
}

const OnboardingStep: React.FC<{
  icon: string
  title: string
  description: string
  color: string
}> = ({ icon, title, description, color }) => (
  <HStack className="items-start" space="md">
    <Box
      className={`w-12 h-12 rounded-full ${color} items-center justify-center`}
    >
      <IconSymbol name={icon as any} size={24} color="white" />
    </Box>
    <VStack className="flex-1" space="xs">
      <Text className="text-headline font-semibold text-label">{title}</Text>
      <Text className="text-callout text-secondary-label">{description}</Text>
    </VStack>
  </HStack>
)

export const Onboarding: React.FC<OnboardingProps> = ({
  isVisible,
  recommendedTasks,
  categories,
  onComplete,
  onSkip,
}) => {
  const [selectedTasks, setSelectedTasks] = useState<string[]>([])
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    {
      title: 'Engageへようこそ',
      subtitle: '毎日の習慣を継続するためのシンプルなアプリです',
      content: (
        <VStack space="lg" className="px-4">
          <OnboardingStep
            icon="calendar"
            title="カレンダーで進捗を確認"
            description="毎日の達成状況をヒートマップで視覚的に確認できます"
            color="bg-system-blue"
          />
          <OnboardingStep
            icon="checkmark.circle"
            title="タスクを選んで実行"
            description="事業と生活のバランスを保ちながら、継続的な成長を目指します"
            color="bg-system-green"
          />
          <OnboardingStep
            icon="chart.bar"
            title="統計で成果を実感"
            description="継続日数や完了率を確認して、モチベーションを維持します"
            color="bg-system-orange"
          />
        </VStack>
      ),
    },
    {
      title: 'おすすめタスクを選択',
      subtitle: '最初の3つのタスクを選んで始めましょう',
      content: (
        <VStack space="md" className="px-4">
          <Text className="text-callout text-secondary-label text-center mb-4">
            継続しやすいタスクから始めることをお勧めします
          </Text>

          {recommendedTasks.map((task) => {
            const category = categories.find((c) => c.id === task.categoryId)
            const isSelected = selectedTasks.includes(task.id)
            const categoryColors = DesignSystemUtils.getCategoryColorClasses(
              category?.name || '事業'
            )

            return (
              <EnhancedPressable
                key={task.id}
                variant={isSelected ? 'primary' : 'tertiary'}
                onPress={() => {
                  setSelectedTasks((prev) => {
                    if (prev.includes(task.id)) {
                      return prev.filter((id) => id !== task.id)
                    } else if (prev.length < 3) {
                      return [...prev, task.id]
                    }
                    return prev
                  })
                }}
                className="w-full"
              >
                <HStack className="items-center justify-between w-full">
                  <HStack className="items-center flex-1" space="sm">
                    <Box
                      className={`w-4 h-4 rounded-full ${categoryColors.background}`}
                    />
                    <VStack className="flex-1" space="xs">
                      <Text
                        className={`text-callout font-medium ${
                          isSelected ? 'text-white' : 'text-label'
                        }`}
                      >
                        {task.title}
                      </Text>
                      <Text
                        className={`text-footnote ${
                          isSelected ? 'text-white/80' : 'text-tertiary-label'
                        }`}
                      >
                        {category?.name} •{' '}
                        {task.defaultMinutes
                          ? `${task.defaultMinutes}分`
                          : '時間自由'}
                      </Text>
                    </VStack>
                  </HStack>

                  {isSelected && (
                    <IconSymbol name="checkmark" size={20} color="white" />
                  )}
                </HStack>
              </EnhancedPressable>
            )
          })}

          <Text className="text-caption-1 text-tertiary-label text-center mt-4">
            選択済み: {selectedTasks.length}/3
          </Text>
        </VStack>
      ),
    },
  ]

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete(selectedTasks)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const canProceed = currentStep === 0 || selectedTasks.length > 0

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="fullScreen"
    >
      <SafeAreaView className="flex-1 bg-system-background">
        {/* Header */}
        <VStack space="lg" className="p-6 border-b border-system-gray-5">
          {/* Progress Indicator */}
          <HStack className="justify-center" space="xs">
            {steps.map((_, index) => (
              <Box
                key={index}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index <= currentStep
                    ? 'bg-system-blue w-8'
                    : 'bg-system-gray-5 w-2'
                }`}
              />
            ))}
          </HStack>

          {/* Title */}
          <VStack className="items-center" space="sm">
            <Text className="text-large-title font-bold text-label text-center">
              {steps[currentStep].title}
            </Text>
            <Text className="text-callout text-secondary-label text-center">
              {steps[currentStep].subtitle}
            </Text>
          </VStack>
        </VStack>

        {/* Content */}
        <ScrollView className="flex-1">
          <Box className="py-8">{steps[currentStep].content}</Box>
        </ScrollView>

        {/* Footer */}
        <Box className="p-6 border-t border-system-gray-5">
          <VStack space="md">
            {/* Main Action */}
            <EnhancedPressable
              variant="primary"
              size="large"
              onPress={handleNext}
              isDisabled={!canProceed}
              className="w-full"
              testID="onboarding-next"
            >
              <Text className="text-callout font-semibold text-white">
                {currentStep === steps.length - 1 ? '始める' : '次へ'}
              </Text>
            </EnhancedPressable>

            {/* Secondary Actions */}
            <HStack className="justify-between">
              {currentStep > 0 ? (
                <EnhancedPressable
                  variant="ghost"
                  onPress={handleBack}
                  testID="onboarding-back"
                >
                  <Text className="text-callout text-system-blue">戻る</Text>
                </EnhancedPressable>
              ) : (
                <Box />
              )}

              <EnhancedPressable
                variant="ghost"
                onPress={onSkip}
                testID="onboarding-skip"
              >
                <Text className="text-callout text-tertiary-label">
                  スキップ
                </Text>
              </EnhancedPressable>
            </HStack>
          </VStack>
        </Box>
      </SafeAreaView>
    </Modal>
  )
}

export default Onboarding
