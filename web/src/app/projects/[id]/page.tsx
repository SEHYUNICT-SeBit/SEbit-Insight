import ProjectDetailClient from './ProjectDetailClient';

export function generateStaticParams() {
  return [{ id: '_' }];
}

export default function ProjectDetailPage() {
  return <ProjectDetailClient />;
}
