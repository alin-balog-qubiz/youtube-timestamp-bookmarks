import { useId, type ReactNode } from 'react';

import { Card } from './Card';

import '../styles/compositions.css';

export type SettingGroupProps = {
  title: string;
  children: ReactNode;
};

export function SettingGroup({ title, children }: SettingGroupProps) {
  const id = useId();

  return (
    <section className="yb-setting-group" aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className="yb-composition-eyebrow">{title}</h2>
      <Card treatment="raised" className="yb-setting-list">{children}</Card>
    </section>
  );
}
