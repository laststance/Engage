import Svg, { Circle, Path } from 'react-native-svg'
import type { ConditionLevel } from '@/src/types'
import {
  CONDITION_APPEARANCE,
  CONDITION_FACE_INK,
  CONDITION_FACE_VIEWBOX,
  CONDITION_ICON_SIZE_PX,
} from '@/src/constants/condition'

interface ConditionIconProps {
  level: ConditionLevel
  size?: number
}

/**
 * Shows the same five expressions whenever the condition picker or calendar renders a saved level.
 * @param props - The condition level and optional icon size in pixels.
 * @returns A decorative face; its parent supplies the translated accessible label.
 * @example <ConditionIcon level={4} size={18} />
 */
export function ConditionIcon({ level, size = CONDITION_ICON_SIZE_PX }: ConditionIconProps) {
  const appearance = CONDITION_APPEARANCE[level]

  return (
    <Svg width={size} height={size} viewBox={CONDITION_FACE_VIEWBOX} accessible={false}>
      <Circle cx="20" cy="20" r="19" fill={appearance.color} />
      <Circle cx="13" cy="16" r="2" fill={CONDITION_FACE_INK} />
      <Circle cx="27" cy="16" r="2" fill={CONDITION_FACE_INK} />
      <Path
        d={appearance.mouth}
        fill={appearance.mouth.endsWith('Z') ? CONDITION_FACE_INK : 'none'}
        stroke={CONDITION_FACE_INK}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}
