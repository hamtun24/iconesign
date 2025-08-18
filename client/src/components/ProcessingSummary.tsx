import { Badge } from './ui/badge';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import type { WorkflowSummary } from '../types/quickSign';

interface ProcessingSummaryProps {
  summary: WorkflowSummary;
}

export function ProcessingSummary({ summary }: ProcessingSummaryProps) {
  const getSuccessRate = () => {
    if (summary.total === 0) return 0;
    const successful = Math.min(summary.signed, summary.saved, summary.validated);
    return Math.round((successful / summary.total) * 100);
  };

  return (
    <div className="bg-muted/50 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Résumé du traitement</h3>
        <Badge variant={getSuccessRate() === 100 ? "secondary" : getSuccessRate() > 50 ? "default" : "destructive"}>
          {getSuccessRate()}% de réussite
        </Badge>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
        <div className="flex flex-col items-center">
          <span className="text-2xl font-bold text-blue-600">{summary.total}</span>
          <span className="text-xs text-muted-foreground">Total</span>
        </div>
        
        <div className="flex flex-col items-center">
          <span className="text-2xl font-bold text-green-600">{summary.signed}</span>
          <span className="text-xs text-muted-foreground">Signés</span>
        </div>
        
        <div className="flex flex-col items-center">
          <span className="text-2xl font-bold text-purple-600">{summary.saved}</span>
          <span className="text-xs text-muted-foreground">Sauvegardés</span>
        </div>
        
        <div className="flex flex-col items-center">
          <span className="text-2xl font-bold text-orange-600">{summary.validated}</span>
          <span className="text-xs text-muted-foreground">Validés</span>
        </div>
        
        <div className="flex flex-col items-center">
          <span className="text-2xl font-bold text-red-600">{summary.failed}</span>
          <span className="text-xs text-muted-foreground">Échoués</span>
        </div>
      </div>
    </div>
  );
}
