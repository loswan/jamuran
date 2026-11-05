import React from 'react';
import { Panel, PanelProps } from '../ui/Panel';
import { Badge, BadgeProps } from '../ui/InputAndBadge';

export type { PanelProps };

export interface StatusBadgeProps extends BadgeProps {}

export const StatusBadge: React.FC<StatusBadgeProps> = (props) => {
  return <Badge {...props} />;
};

export interface GamePanelProps extends PanelProps {
  badge?: React.ReactNode;
}

export const GamePanel: React.FC<GamePanelProps> = ({ badge, headerAction, ...props }) => {
  return <Panel headerAction={headerAction || badge} {...props} />;
};
