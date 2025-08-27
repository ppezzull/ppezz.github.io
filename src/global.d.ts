declare module 'jsonresume-theme-professional' {
  import type { ComponentType } from 'react';

  // Theme's server-side render function returns full HTML
  export function render(resume: any): string;

  // Expose the React component as well (optional)
  export const Resume: ComponentType<{ resume: any }>;

  const _default: {
    render: typeof render;
    Resume: typeof Resume;
  };
  export default _default;
}
