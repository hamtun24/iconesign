import { Progress } from '../../components/ui/progress';

interface QuickSignProgressProps {
  currentStep: string;
  progress: number;
}

export function QuickSignProgress({ currentStep, progress }: QuickSignProgressProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>{currentStep || 'Traitement des fichiers...'}</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <Progress value={progress} className="w-full" />
    </div>
  );
}
