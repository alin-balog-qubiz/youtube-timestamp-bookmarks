import { Surface, type SurfaceProps } from './Surface';

export type CardProps = SurfaceProps;

export function Card({ className = '', treatment = 'raised', ...props }: CardProps) {
  return <Surface {...props} treatment={treatment} className={`yb-card ${className}`.trim()} />;
}
