import React from 'react';
import { View, ScrollView, ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export interface ScreenContainerProps extends ViewProps {
  useSafeArea?: boolean;
  scrollable?: boolean;
  withPadding?: boolean;
  children: React.ReactNode;
  contentContainerClassName?: string;
}

export function ScreenContainer({
  useSafeArea = true,
  scrollable = false,
  withPadding = true,
  className = '',
  contentContainerClassName = '',
  children,
  ...props
}: ScreenContainerProps) {
  const baseClasses = 'flex-1 bg-app dark:bg-neutral-900';
  const paddingClasses = withPadding ? 'p-6' : '';

  const Container = useSafeArea ? SafeAreaView : View;

  if (scrollable) {
    return (
      <Container className={`${baseClasses} ${className}`} {...(useSafeArea ? { edges: ['top', 'bottom'] } : {})} {...props}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerClassName={`${paddingClasses} ${contentContainerClassName}`}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </Container>
    );
  }

  return (
    <Container
      className={`${baseClasses} ${paddingClasses} ${className}`}
      {...(useSafeArea ? { edges: ['top', 'bottom'] } : {})}
      {...props}
    >
      {children}
    </Container>
  );
}
