import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Progress } from "../components/ui/progress";
import { useAuth } from "../contexts/AuthProvider";
import { getRecentUserActions, getUserActivitySummary } from "../utils/actionTracker";
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Download, 
  Upload, 
  Zap, 
  ShieldCheck,
  Filter,
  Calendar,
  TrendingUp,
  Activity,
  AlertTriangle,
  RefreshCw
} from "lucide-react";
import type { UserActivitySummary } from "../types/actions";

type EnhancedActionRow = {
  id: string;
  type: 'quicksign' | 'simplesign' | 'validation';
  action: string;
  file_name?: string;
  file_names?: string[];
  file_count?: number;
  file_size?: number;
  total_size?: number;
  success_count?: number;
  error_count?: number;
  processing_time_ms?: number;
  error_message?: string;
  timestamp: string;
  created_at: string;
  details?: any;
};

const ACTION_LABELS = {
  // QuickSign actions
  'files_uploaded': 'Fichiers téléchargés',
  'process_started': 'Processus démarré',
  'process_completed': 'Processus terminé',
  'process_error': 'Erreur de processus',
  'results_downloaded': 'Résultats téléchargés',
  
  // SimpleSign actions
  'file_selected': 'Fichier sélectionné',
  'signing_started': 'Signature démarrée',
  'signing_success': 'Signature réussie',
  'signing_error': 'Erreur de signature',
  'signed_file_downloaded': 'Fichier signé téléchargé',
  
  // Validation actions
  'validation_started': 'Validation démarrée',
  'validation_success': 'Validation réussie',
  'validation_error': 'Erreur de validation',
  'report_downloaded': 'Rapport téléchargé'
};

const TYPE_LABELS = {
  'quicksign': 'Signature rapide',
  'simplesign': 'Signature simple',
  'validation': 'Validation'
};

const TYPE_ICONS = {
  'quicksign': Zap,
  'simplesign': FileText,
  'validation': ShieldCheck
};

export default function HistoriquePage() {
  const { user } = useAuth();
  const [actions, setActions] = useState<EnhancedActionRow[]>([]);
  const [filteredActions, setFilteredActions] = useState<EnhancedActionRow[]>([]);
  const [summary, setSummary] = useState<UserActivitySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('all');

  const fetchData = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const [actionsData, summaryData] = await Promise.all([
        getRecentUserActions(200, user.id),
        getUserActivitySummary(user.id)
      ]);
      
      setActions(actionsData as EnhancedActionRow[]);
      setSummary(summaryData);
    } catch (err) {
      console.error('Failed to fetch user data:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Apply filters
  useEffect(() => {
    let filtered = actions;

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(action => action.type === typeFilter);
    }

    // Action filter
    if (actionFilter !== 'all') {
      filtered = filtered.filter(action => action.action === actionFilter);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(action => 
        action.file_name?.toLowerCase().includes(term) ||
        action.file_names?.some(name => name.toLowerCase().includes(term)) ||
        ACTION_LABELS[action.action as keyof typeof ACTION_LABELS]?.toLowerCase().includes(term)
      );
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
      }
      
      filtered = filtered.filter(action => 
        new Date(action.timestamp) >= filterDate
      );
    }

    setFilteredActions(filtered);
  }, [actions, typeFilter, actionFilter, searchTerm, dateFilter]);

  const getActionBadge = (action: string, type: string) => {
    const isError = action.includes('error');
    const isSuccess = action.includes('success') || action.includes('completed');
    const isProcess = action.includes('started') || action.includes('selected') || action.includes('uploaded');
    
    let variant: "default" | "secondary" | "destructive" | "outline" = "default";
    let icon: React.ReactNode = null;
    
    if (isError) {
      variant = "destructive";
      icon = <XCircle className="h-3 w-3" />;
    } else if (isSuccess) {
      variant = "secondary";
      icon = <CheckCircle className="h-3 w-3" />;
    } else if (isProcess) {
      variant = "outline";
      icon = <Clock className="h-3 w-3" />;
    }
    
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        {icon}
        {ACTION_LABELS[action as keyof typeof ACTION_LABELS] || action}
      </Badge>
    );
  };

  const formatFileInfo = (action: EnhancedActionRow) => {
    if (action.file_names && action.file_names.length > 0) {
      return action.file_names.length === 1 
        ? action.file_names[0]
        : `${action.file_names.length} fichiers`;
    }
    if (action.file_name) {
      return action.file_name;
    }
    if (action.file_count) {
      return `${action.file_count} fichiers`;
    }
    return '-';
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '-';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}min`;
  };

  const getSuccessRate = () => {
    if (!summary) return 0;
    const total = summary.total_quicksign_sessions + summary.total_simplesign_operations + summary.total_validation_operations;
    return total > 0 ? ((summary.total_files_signed / total) * 100) : 0;
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Alert className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Veuillez vous connecter pour voir votre historique.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Historique des activités</h1>
          <p className="text-muted-foreground">
            Suivi complet de vos opérations de signature et validation
          </p>
        </div>
        <Button onClick={fetchData} variant="outline" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="history">Historique détaillé</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Sessions rapides</p>
                      <p className="text-2xl font-bold">{summary.total_quicksign_sessions}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Fichiers signés</p>
                      <p className="text-2xl font-bold">{summary.total_files_signed}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="h-4 w-4 text-green-500" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Validations</p>
                      <p className="text-2xl font-bold">{summary.total_validation_operations}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-purple-500" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Taux de réussite</p>
                      <p className="text-2xl font-bold">{getSuccessRate().toFixed(1)}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {summary && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Statistiques de performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium mb-2">Temps de traitement moyen</p>
                    <p className="text-lg">{formatDuration(summary.avg_processing_time_ms)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">Dernière activité</p>
                    <p className="text-lg">
                      {summary.last_activity 
                        ? new Date(summary.last_activity).toLocaleDateString('fr-FR')
                        : 'Aucune activité'
                      }
                    </p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium mb-2">Répartition des activités</p>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Signature rapide</span>
                      <span>{summary.total_quicksign_sessions}</span>
                    </div>
                    <Progress 
                      value={(summary.total_quicksign_sessions / Math.max(summary.total_quicksign_sessions + summary.total_simplesign_operations + summary.total_validation_operations, 1)) * 100} 
                      className="h-2"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtres
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Type d'action</label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les types</SelectItem>
                      <SelectItem value="quicksign">Signature rapide</SelectItem>
                      <SelectItem value="simplesign">Signature simple</SelectItem>
                      <SelectItem value="validation">Validation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Action spécifique</label>
                  <Select value={actionFilter} onValueChange={setActionFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les actions</SelectItem>
                      {Object.entries(ACTION_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Période</label>
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toute la période</SelectItem>
                      <SelectItem value="today">Aujourd'hui</SelectItem>
                      <SelectItem value="week">Cette semaine</SelectItem>
                      <SelectItem value="month">Ce mois</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Recherche</label>
                  <Input
                    placeholder="Nom de fichier..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  Historique des actions ({filteredActions.length})
                </CardTitle>
                {filteredActions.length !== actions.length && (
                  <Badge variant="outline">
                    {filteredActions.length} sur {actions.length}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center space-y-2">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                    <p className="text-muted-foreground">Chargement des données...</p>
                  </div>
                </div>
              ) : filteredActions.length === 0 ? (
                <div className="text-center py-12">
                  <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">Aucune action trouvée</p>
                  <p className="text-muted-foreground">
                    Essayez de modifier vos filtres ou commencez à utiliser l'application
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Fichier(s)</TableHead>
                        <TableHead>Taille</TableHead>
                        <TableHead>Durée</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Résultat</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredActions.map(action => {
                        const TypeIcon = TYPE_ICONS[action.type];
                        return (
                          <TableRow key={action.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <TypeIcon className="h-4 w-4" />
                                <span className="font-medium">
                                  {TYPE_LABELS[action.type]}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {getActionBadge(action.action, action.type)}
                            </TableCell>
                            <TableCell>
                              <div className="max-w-48 truncate" title={formatFileInfo(action)}>
                                {formatFileInfo(action)}
                              </div>
                            </TableCell>
                            <TableCell>
                              {formatFileSize(action.file_size || action.total_size)}
                            </TableCell>
                            <TableCell>
                              {formatDuration(action.processing_time_ms)}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div>{new Date(action.timestamp).toLocaleDateString('fr-FR')}</div>
                                <div className="text-muted-foreground">
                                  {new Date(action.timestamp).toLocaleTimeString('fr-FR')}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {action.error_message ? (
                                <div className="flex items-center gap-1 text-red-600">
                                  <XCircle className="h-3 w-3" />
                                  <span className="text-xs">{action.error_message}</span>
                                </div>
                              ) : action.success_count ? (
                                <div className="flex items-center gap-1 text-green-600">
                                  <CheckCircle className="h-3 w-3" />
                                  <span className="text-xs">{action.success_count} réussis</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-blue-600">
                                  <Clock className="h-3 w-3" />
                                  <span className="text-xs">Traité</span>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}