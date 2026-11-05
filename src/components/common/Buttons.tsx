import React from 'react';
import { Button, ButtonProps } from '../ui/Button';

export type { ButtonProps };

export const PrimaryButton: React.FC<ButtonProps> = (props) => {
  return <Button variant="primary" {...props} />;
};

export const SecondaryButton: React.FC<ButtonProps> = (props) => {
  return <Button variant="secondary" {...props} />;
};
