import React from 'react';
import type { VariantProps } from '@gluestack-ui/utils/nativewind-utils';
import { hstackStyle } from './styles';

type IHStackProps = React.ComponentPropsWithoutRef<'div'> &
  VariantProps<typeof hstackStyle>;

const HStack = React.forwardRef<React.ComponentRef<'div'>, IHStackProps>(
  function HStack({ className, space, reversed, ...props }, ref) {
    return (
      <div
        className={hstackStyle({
          space: space as 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl',
          reversed: reversed as boolean,
          class: className,
        })}
        {...props}
        ref={ref}
      />
    );
  }
);

HStack.displayName = 'HStack';

export { HStack };
