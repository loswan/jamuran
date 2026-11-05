import React from 'react';
import { Modal, ModalProps } from '../ui/Modal';

export interface ModalContainerProps extends Omit<ModalProps, 'badge'> {
  headerBadge?: React.ReactNode;
  contentPaddingClass?: string;
}

export const ModalContainer: React.FC<ModalContainerProps> = ({
  headerBadge,
  contentPaddingClass,
  ...props
}) => {
  return (
    <Modal
      badge={headerBadge}
      paddingClass={contentPaddingClass || 'p-3.5 sm:p-5'}
      {...props}
    />
  );
};
