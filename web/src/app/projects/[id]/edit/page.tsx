import ProjectEditClient from './ProjectEditClient';

export function generateStaticParams() {
  return [{ id: '_' }];
}

export default function ProjectEditPage() {
  return <ProjectEditClient />;
}
