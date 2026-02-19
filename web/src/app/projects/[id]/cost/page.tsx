import CostAnalysisClient from './CostAnalysisClient';

export function generateStaticParams() {
  return [{ id: '_' }];
}

export default function CostAnalysisPage() {
  return <CostAnalysisClient />;
}
