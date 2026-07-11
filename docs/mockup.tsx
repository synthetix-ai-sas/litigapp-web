import React, { useState, useMemo, useEffect } from 'react';
import { 
  Bell, 
  Scale, 
  Search, 
  Eye, 
  FileText, 
  CheckCircle, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  Building,
  User,
  Download,
  Plus,
  Upload,
  FileSpreadsheet,
  History,
  Info,
  Loader2,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';

// --- MOCK DATA ---
const MOCK_PROCESSES = [
  {
    id: '1',
    uniqueId: 'PROC-2023-001',
    processId: '11001400300120230012300',
    lastUpdateDate: '2026-05-22T08:30:00',
    status: 'Auto Admite Demanda',
    attended: false,
    juzgado: 'Juzgado 1 Civil Municipal',
    nombresSp: 'Juan Pérez vs María Gómez',
    historial: [
      { fecha: '2026-05-22T08:30:00', estado: 'Auto Admite Demanda', anotacion: 'Se admite la demanda y se ordena correr traslado al demandado.' },
      { fecha: '2026-05-10T10:00:00', estado: 'Reparto', anotacion: 'Asignado al Juzgado 1 Civil Municipal.' }
    ]
  },
  {
    id: '2',
    uniqueId: 'PROC-2023-045',
    processId: '11001400300120230045000',
    lastUpdateDate: '2026-05-21T14:15:00',
    status: 'Fijación en Lista',
    attended: false,
    juzgado: 'Juzgado 3 Laboral',
    nombresSp: 'Carlos Ruiz vs Empresa S.A.',
    historial: [
      { fecha: '2026-05-21T14:15:00', estado: 'Fijación en Lista', anotacion: 'Fijación en lista por el término de 3 días.' }
    ]
  },
  {
    id: '3',
    uniqueId: 'PROC-2022-890',
    processId: '11001400300120220089000',
    lastUpdateDate: '2026-05-20T09:00:00',
    status: 'Sentencia Primera Instancia',
    attended: true,
    juzgado: 'Juzgado 5 Civil del Circuito',
    nombresSp: 'Ana López vs Seguros XYZ',
    historial: [
      { fecha: '2026-05-20T09:00:00', estado: 'Sentencia Primera Instancia', anotacion: 'Se dicta sentencia condenatoria.' }
    ]
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('novedades');
  const [processes, setProcesses] = useState(MOCK_PROCESSES);
  
  // Modals
  const [selectedProcess, setSelectedProcess] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Add Process State
  const [addMethod, setAddMethod] = useState('manual'); // 'manual' | 'excel'
  const [manualType, setManualType] = useState('directo'); // 'directo' | 'guiado'
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);
  
  // Excel Import States (Blueprint spec)
  const [excelStep, setExcelStep] = useState('upload'); // 'upload' | 'mapping'
  const [importStatus, setImportStatus] = useState('idle'); // 'idle' | 'running' | 'completed'
  const [importProgress, setImportProgress] = useState({ current: 0, total: 87, success: 0, errors: 0 });

  // Wizard State 
  const [newProcessForm, setNewProcessForm] = useState({ 
    processId: '', juzgado: '', nombresSp: '', departamento: '', municipio: '', tipoJuzgado: '', despacho: '', consecutivo: ''
  });

  // Search Filters
  const [filters, setFilters] = useState({
    juzgado: '', id: '', nombresSp: '', estado: '', fecha: ''
  });

  // Derived Data
  const novedades = processes.filter(p => !p.attended);
  
  const filteredProcesos = useMemo(() => {
    return processes.filter(p => {
      const matchJuzgado = p.juzgado.toLowerCase().includes(filters.juzgado.toLowerCase());
      const matchId = p.processId.includes(filters.id) || p.uniqueId.includes(filters.id);
      const matchNombres = p.nombresSp.toLowerCase().includes(filters.nombresSp.toLowerCase());
      const matchEstado = filters.estado === '' || p.status.toLowerCase().includes(filters.estado.toLowerCase());
      const matchFecha = filters.fecha === '' || p.lastUpdateDate.startsWith(filters.fecha);
      
      return matchJuzgado && matchId && matchNombres && matchEstado && matchFecha;
    });
  }, [processes, filters]);

  // --- ACTIONS ---
  const handleMarkAsAttended = () => {
    if (selectedProcess) {
      setProcesses(prev => 
        prev.map(p => p.id === selectedProcess.id ? { ...p, attended: true } : p)
      );
      setSelectedProcess(null);
    }
  };

  // Creación SÍNCRONA (Blueprint 11.7)
  const handleAddNewProcess = (e) => {
    e.preventDefault();
    setIsSubmittingManual(true);
    
    // Simulamos los 4-12s que tomarían las 4 peticiones a la API Rama Judicial
    setTimeout(() => {
      let finalProcessId = newProcessForm.processId;
      if (manualType === 'guiado') {
          finalProcessId = `11001${newProcessForm.tipoJuzgado || '4003'}${newProcessForm.despacho || '001'}${newProcessForm.consecutivo || '0000000000'}`;
      }

      const newId = String(processes.length + 1);
      const processToAdd = {
        id: newId,
        uniqueId: `PROC-2026-${newId.padStart(3, '0')}`,
        processId: finalProcessId || '11001400300000000000000',
        lastUpdateDate: new Date().toISOString(),
        status: 'Radicado - Sincronizado',
        attended: true, // Recién agregado, no requiere atención
        juzgado: newProcessForm.juzgado || `Despacho ${newProcessForm.despacho || 'Asignado'}`,
        nombresSp: newProcessForm.nombresSp || 'Información extraída de la Rama',
        historial: [
          { fecha: new Date().toISOString(), estado: 'Sincronización Inicial', anotacion: 'Proceso añadido al sistema con éxito.' }
        ]
      };
      
      setProcesses([processToAdd, ...processes]);
      setIsSubmittingManual(false);
      setIsAddModalOpen(false);
      setActiveTab('procesos');
      setNewProcessForm({ processId: '', juzgado: '', nombresSp: '', departamento: '', municipio: '', tipoJuzgado: '', despacho: '', consecutivo: '' });
    }, 2000); // Timeout de 2s para UX en el mockup
  };

  // Importación Lote (Hangfire / Polling simulado)
  const handleFileDrop = (e) => {
    e.preventDefault();
    // Simula leer el excel y detectar columnas
    setExcelStep('mapping');
  };

  const startBulkImport = () => {
    setIsAddModalOpen(false);
    setExcelStep('upload');
    setImportStatus('running');
    setImportProgress({ current: 0, total: 87, success: 0, errors: 0 });
  };

  const finishImportSummary = () => {
    setImportStatus('idle');
    setActiveTab('procesos');
  };

  // Efecto para simular el Polling GET /imports/active cada 3s (aquí acelerado)
  useEffect(() => {
    let interval;
    if (importStatus === 'running') {
      interval = setInterval(() => {
        setImportProgress(prev => {
          const next = prev.current + 8; // Simula avance
          if (next >= prev.total) {
            clearInterval(interval);
            setImportStatus('completed');
            return { ...prev, current: prev.total, success: 82, errors: 5 };
          }
          return { ...prev, current: next };
        });
      }, 800);
    }
    return () => clearInterval(interval);
  }, [importStatus]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', { 
      year: 'numeric', month: 'short', day: 'numeric', 
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-12">
      {/* HEADER */}
      <header className="bg-blue-800 text-white shadow-md sticky top-0 z-20 border-b-4 border-blue-600">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale size={28} className="text-blue-300" />
            <h1 className="text-xl font-bold tracking-wide">LitigApp</h1>
          </div>
          <div className="flex items-center gap-5">
            <div className="relative cursor-pointer hover:text-blue-200 transition-colors">
              <Bell size={22} />
              {novedades.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold ring-2 ring-blue-800">
                  {novedades.length}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
              <div className="hidden md:block text-right">
                <p className="text-xs font-semibold leading-tight">Dr. Fernando G.</p>
                <p className="text-[10px] text-blue-300">Plan Premium</p>
              </div>
              <div className="w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center font-bold border border-blue-300 shadow-sm">
                FG
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* GLOBAL BANNER DE IMPORTACIÓN (Blueprint Spec) */}
      {importStatus === 'running' && (
        <div className="bg-blue-600 text-white shadow-md animate-in slide-in-from-top-2 duration-300 sticky top-16 z-10">
          <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Loader2 className="animate-spin text-blue-200" size={20} />
              <div>
                <p className="text-sm font-bold">📥 Importando portafolio en segundo plano...</p>
                <p className="text-xs text-blue-200">Consultando API de la Rama Judicial (Procesados: {importProgress.current} de {importProgress.total})</p>
              </div>
            </div>
            <div className="w-full md:w-64 bg-blue-800 rounded-full h-2.5 overflow-hidden">
              <div 
                className="bg-green-400 h-2.5 transition-all duration-500 ease-out" 
                style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {/* TABS Y BOTON PRINCIPAL */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 mb-8 gap-4 sm:gap-0">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('novedades')}
              className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition-colors relative rounded-t-lg ${
                activeTab === 'novedades' ? 'text-blue-700 bg-blue-50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Bell size={18} />
              Novedades
              {novedades.length > 0 && (
                <span className={`py-0.5 px-2 rounded-full text-xs font-bold ml-1 ${activeTab === 'novedades' ? 'bg-red-500 text-white' : 'bg-red-100 text-red-600'}`}>
                  {novedades.length}
                </span>
              )}
              {activeTab === 'novedades' && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-700" />
              )}
            </button>
            
            <button
              onClick={() => setActiveTab('procesos')}
              className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition-colors relative rounded-t-lg ${
                activeTab === 'procesos' ? 'text-blue-700 bg-blue-50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <FileText size={18} />
              Procesos
              {activeTab === 'procesos' && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-700" />
              )}
            </button>
          </div>

          <div className="px-1 mb-2 sm:mb-0 relative group">
            <button 
              onClick={() => setIsAddModalOpen(true)}
              disabled={importStatus === 'running'}
              className={`w-full sm:w-auto text-white px-5 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-all shadow-md shrink-0 ${
                importStatus === 'running' 
                  ? 'bg-blue-400 opacity-60 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg'
              }`}
            >
              <Plus size={18} />
              Agregar Proceso
            </button>
            {/* Tooltip visible solo si está deshabilitado */}
            {importStatus === 'running' && (
              <div className="absolute top-full mt-2 right-0 bg-slate-800 text-white text-xs py-1.5 px-3 rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                Espera a que termine la importación en curso.
              </div>
            )}
          </div>
        </div>

        {/* TAB CONTENT: NOVEDADES */}
        {activeTab === 'novedades' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="mb-6 bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-4">
              <div className="mt-1">
                <Info className="text-blue-600" size={24} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-blue-900">Novedades de la Rama Judicial</h2>
                <p className="text-blue-800 text-sm mt-1">El sistema ha detectado <strong>{novedades.length}</strong> cambios de estado en tus procesos desde la última sincronización. Por favor revisa cada uno y márcalo como atendido.</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              {novedades.length === 0 ? (
                <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center bg-slate-50/50">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle size={40} className="text-green-500" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-700 mb-1">¡Estás al día!</h3>
                  <p className="max-w-md">No tienes novedades pendientes. El servicio actualizador automático corre todos los días e informará por WhatsApp y Email si detecta cambios.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {novedades.map((proc) => (
                    <div key={proc.id} className="p-5 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                        <div className="md:col-span-1">
                          <div className="text-[11px] text-slate-500 uppercase tracking-wide font-semibold mb-1">Radicado</div>
                          <div className="font-mono text-sm text-blue-800 bg-blue-50 px-2 py-1 rounded inline-block border border-blue-100 break-all">{proc.processId}</div>
                        </div>
                        <div className="md:col-span-1">
                          <div className="text-[11px] text-slate-500 uppercase tracking-wide font-semibold mb-1">Actualización</div>
                          <div className="flex items-center gap-1.5 text-slate-700 text-sm font-medium">
                            <Clock size={14} className="text-slate-400"/>
                            {formatDate(proc.lastUpdateDate)}
                          </div>
                        </div>
                        <div className="md:col-span-2">
                          <div className="text-[11px] text-slate-500 uppercase tracking-wide font-semibold mb-1">Nuevo Estado / Actuación</div>
                          <div className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200 shadow-sm">
                            <Bell size={12} className="mr-1.5" />
                            {proc.status}
                          </div>
                        </div>
                      </div>
                      <div className="ml-4 pl-4 border-l border-slate-100 flex items-center">
                        <button 
                          onClick={() => setSelectedProcess(proc)}
                          className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-slate-300 text-slate-700 hover:text-blue-700 hover:border-blue-300 hover:bg-blue-50 rounded-lg transition-all shadow-sm"
                        >
                          <Eye size={16} />
                          <span className="hidden md:inline font-medium">Revisar</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB CONTENT: PROCESOS */}
        {activeTab === 'procesos' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Portafolio de Procesos</h2>
              <p className="text-slate-500 text-sm mt-1">Busca, filtra y audita los procesos que estás monitoreando.</p>
            </div>

            {/* SEARCH FILTERS */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="lg:col-span-1">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Radicado o ID</label>
                  <div className="relative">
                    <FileText size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Ej. 110014..."
                      value={filters.id}
                      onChange={(e) => setFilters({...filters, id: e.target.value})}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>
                <div className="lg:col-span-1">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Juzgado / Despacho</label>
                  <div className="relative">
                    <Building size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Ej. Civil Municipal"
                      value={filters.juzgado}
                      onChange={(e) => setFilters({...filters, juzgado: e.target.value})}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>
                <div className="lg:col-span-1">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Sujetos Procesales</label>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Demandante/do..."
                      value={filters.nombresSp}
                      onChange={(e) => setFilters({...filters, nombresSp: e.target.value})}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>
                <div className="lg:col-span-1">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Último Estado</label>
                  <div className="relative">
                    <History size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select 
                      value={filters.estado}
                      onChange={(e) => setFilters({...filters, estado: e.target.value})}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none bg-white"
                    >
                      <option value="">Cualquier estado</option>
                      <option value="Admite">Admite Demanda</option>
                      <option value="Rechazo">Rechazo</option>
                      <option value="Fijación">Fijación en lista</option>
                      <option value="Sentencia">Sentencia</option>
                    </select>
                  </div>
                </div>
                <div className="lg:col-span-1">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Fecha Actuación</label>
                  <input 
                    type="date" 
                    value={filters.fecha}
                    onChange={(e) => setFilters({...filters, fecha: e.target.value})}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-600"
                  />
                </div>
              </div>
            </div>

            {/* PROCESS LIST */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="divide-y divide-slate-100">
                {filteredProcesos.map((proc) => (
                  <div key={proc.id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                      <div className="lg:col-span-3">
                        <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Radicado</div>
                        <div className="font-mono text-sm text-blue-700 break-all">{proc.processId}</div>
                      </div>
                      <div className="lg:col-span-3">
                        <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Despacho y Partes</div>
                        <div className="text-slate-800 text-sm font-medium truncate" title={proc.juzgado}>{proc.juzgado}</div>
                        <div className="text-slate-500 text-xs truncate mt-0.5" title={proc.nombresSp}>{proc.nombresSp}</div>
                      </div>
                      <div className="lg:col-span-4">
                        <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Estado de la Rama</div>
                        <div className="text-slate-800 text-sm font-medium">{proc.status}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Clock size={12} /> {formatDate(proc.lastUpdateDate)}
                        </div>
                      </div>
                      <div className="lg:col-span-2 text-left lg:text-center">
                        <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-1 hidden lg:block">Alerta</div>
                        {proc.attended ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-green-50 text-green-700 border border-green-200">
                            <CheckCircle size={12} /> AL DÍA
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-300 shadow-sm">
                            <Bell size={12} /> NOVEDAD
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-end border-t border-slate-100 md:border-t-0 pt-3 md:pt-0 mt-2 md:mt-0 shrink-0">
                      <button 
                        onClick={() => setSelectedProcess(proc)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg transition-colors shadow-sm"
                      >
                        <FileText size={16} className="text-slate-400"/>
                        Detalle / Opciones
                      </button>
                    </div>
                  </div>
                ))}
                
                {filteredProcesos.length === 0 && (
                  <div className="p-12 text-center text-slate-500 flex flex-col items-center">
                    <Search size={48} className="text-slate-300 mb-4" />
                    <p className="text-lg font-bold text-slate-700">Sin resultados</p>
                    <p className="max-w-sm mt-1">No se encontraron procesos que coincidan con los filtros aplicados. Prueba borrando algunos términos.</p>
                  </div>
                )}
              </div>
              
              {/* Pagination */}
              {filteredProcesos.length > 0 && (
                <div className="bg-slate-50 px-5 py-3 flex flex-col sm:flex-row items-center justify-between border-t border-slate-200 gap-3">
                  <div className="text-sm text-slate-500">
                    Mostrando <span className="font-semibold text-slate-700">1</span> - <span className="font-semibold text-slate-700">{filteredProcesos.length}</span> de <span className="font-semibold text-slate-700">{processes.length}</span> procesos
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="p-1.5 rounded-md text-slate-400 hover:bg-slate-200 disabled:opacity-50 transition-colors" disabled><ChevronLeft size={18}/></button>
                    <button className="px-3 py-1 rounded-md bg-blue-600 text-white font-medium text-sm shadow-sm">1</button>
                    <button className="p-1.5 rounded-md text-slate-600 hover:bg-slate-200 transition-colors"><ChevronRight size={18}/></button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* MODAL: UNIFICADO (DETALLE DE PROCESO + ACCIONES) */}
      {selectedProcess && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            
            {/* Header del Modal */}
            <div className={`px-6 py-4 border-b flex justify-between items-center shrink-0 ${!selectedProcess.attended ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center gap-3">
                {!selectedProcess.attended ? (
                  <div className="bg-amber-100 p-2 rounded-full text-amber-600 ring-4 ring-amber-50">
                    <Bell size={20} />
                  </div>
                ) : (
                  <div className="bg-blue-100 p-2 rounded-full text-blue-600 ring-4 ring-blue-50">
                    <FileText size={20} />
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Expediente Digital</h3>
                  <p className={`text-xs font-medium ${!selectedProcess.attended ? 'text-amber-700' : 'text-slate-500'}`}>
                    {!selectedProcess.attended ? 'Atención Requerida - Cambio de Estado Reciente' : 'Sincronizado con la Rama Judicial'}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedProcess(null)} className="text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 p-1.5 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            
            {/* Cuerpo del Modal (Scrollable) */}
            <div className="p-6 overflow-y-auto bg-slate-50/50">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Datos Básicos</p>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-slate-500 mb-0.5">Radicado (23 dígitos)</p>
                      <p className="font-mono text-base font-semibold text-blue-800">{selectedProcess.processId}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 mb-0.5">Despacho Actual</p>
                      <p className="font-medium text-slate-800">{selectedProcess.juzgado}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Sujetos Procesales</p>
                  <div className="flex items-start gap-3 mt-2">
                    <div className="bg-slate-100 p-2 rounded-lg mt-0.5"><User size={18} className="text-slate-500"/></div>
                    <div>
                      <p className="font-medium text-slate-800 leading-snug">{selectedProcess.nombresSp}</p>
                      <p className="text-xs text-slate-500 mt-1">*Información extraída del expediente público.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Historial Timeline */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 flex items-center gap-2">
                    <History size={18} className="text-blue-600" />
                    Historial de Actuaciones (Rama Judicial)
                  </h4>
                  <span className="text-xs font-medium text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded-md">
                    Últimos registros
                  </span>
                </div>
                <div className="p-6 relative">
                  <div className="absolute left-9 top-8 bottom-8 w-0.5 bg-slate-200"></div>
                  <div className="space-y-6">
                    {selectedProcess.historial?.map((hist, idx) => (
                      <div key={idx} className="relative flex items-start gap-4">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 border-2 mt-0.5 ${idx === 0 ? 'bg-blue-600 border-white ring-4 ring-blue-100 text-white' : 'bg-slate-200 border-white ring-4 ring-white text-transparent'}`}>
                          {idx === 0 && <div className="w-2 h-2 bg-white rounded-full"></div>}
                        </div>
                        <div className={`flex-1 p-3 rounded-lg border ${idx === 0 ? (!selectedProcess.attended ? 'bg-amber-50/50 border-amber-200' : 'bg-blue-50/30 border-blue-100') : 'bg-transparent border-slate-100'}`}>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1 gap-1">
                            <span className={`font-bold text-sm ${idx === 0 ? 'text-blue-900' : 'text-slate-700'}`}>{hist.estado}</span>
                            <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                              <Clock size={12} /> {formatDate(hist.fecha)}
                            </span>
                          </div>
                          <p className={`text-sm ${idx === 0 ? 'text-slate-800' : 'text-slate-600'}`}>{hist.anotacion}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Acciones Fixeadas al final */}
            <div className="px-6 py-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
              <button 
                onClick={() => alert('Generando PDF oficial desde la API de la Rama...')}
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg font-medium text-slate-700 bg-white border-2 border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:text-blue-700 transition-all flex items-center justify-center gap-2"
              >
                <Download size={18} />
                Descargar PDF del Expediente
              </button>
              
              <div className="flex w-full sm:w-auto gap-3">
                {selectedProcess.attended && (
                  <button 
                    onClick={() => setSelectedProcess(null)}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-lg font-bold text-white bg-slate-800 hover:bg-slate-900 transition-colors shadow-md"
                  >
                    Cerrar
                  </button>
                )}
                {!selectedProcess.attended && (
                  <>
                    <button 
                      onClick={() => setSelectedProcess(null)}
                      className="flex-1 sm:flex-none px-4 py-2.5 rounded-lg font-medium text-slate-600 hover:bg-slate-100 transition-colors text-center"
                    >
                      Luego
                    </button>
                    <button 
                      onClick={handleMarkAsAttended}
                      className="flex-1 sm:flex-none px-6 py-2.5 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-700 hover:shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={18} />
                      Marcar como Atendido
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE RESUMEN AL FINALIZAR LA IMPORTACIÓN */}
      {importStatus === 'completed' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 text-center p-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={40} className="text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">Importación Completada</h3>
            <p className="text-slate-500 mb-6">Hemos finalizado la sincronización inicial de tu portafolio desde el archivo Excel.</p>
            
            <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-100 text-left space-y-2">
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-slate-600">Procesados Totales:</span>
                <span className="text-slate-800">{importProgress.total}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-green-600 flex items-center gap-1"><CheckCircle size={14}/> Exitosos:</span>
                <span className="text-green-700">{importProgress.success}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-amber-600 flex items-center gap-1"><AlertTriangle size={14}/> Con errores:</span>
                <span className="text-amber-700">{importProgress.errors}</span>
              </div>
            </div>

            <button 
              onClick={finishImportSummary}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition-all shadow-md"
            >
              Ver mis procesos
            </button>
          </div>
        </div>
      )}

      {/* MODAL: AGREGAR PROCESO */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-blue-50/50 shrink-0">
              <h3 className="text-lg font-bold text-blue-900 flex items-center gap-2">
                <Plus className="text-blue-600" size={20} />
                Agregar Nuevo Proceso
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-700 bg-white rounded-full p-1 shadow-sm transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto bg-white">
              {/* Tabs Method */}
              <div className="flex bg-slate-100 p-1.5 rounded-xl mb-6 shadow-inner">
                <button 
                  onClick={() => setAddMethod('manual')}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${addMethod === 'manual' ? 'bg-white shadow text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Agregar Individual
                </button>
                <button 
                  onClick={() => setAddMethod('excel')}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${addMethod === 'excel' ? 'bg-white shadow text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <FileSpreadsheet size={16} />
                  Carga Masiva
                </button>
              </div>

              {addMethod === 'manual' ? (
                <form onSubmit={handleAddNewProcess} className="space-y-6">
                  
                  {/* Selector Directo vs Guiado */}
                  <div className="space-y-3">
                    <label className={`flex items-start gap-3 p-3 border rounded-xl cursor-pointer hover:bg-slate-50 transition-colors ${manualType === 'directo' ? 'border-blue-500 bg-blue-50/20' : 'border-slate-200'}`}>
                      <input type="radio" name="manualType" checked={manualType === 'directo'} onChange={() => setManualType('directo')} className="mt-1 w-4 h-4 text-blue-600" />
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">Tengo el radicado completo</p>
                        <p className="text-xs text-slate-500">Ingresa los 23 dígitos exactos proporcionados por el juzgado.</p>
                      </div>
                    </label>
                    <label className={`flex items-start gap-3 p-3 border rounded-xl cursor-pointer hover:bg-slate-50 transition-colors ${manualType === 'guiado' ? 'border-blue-500 bg-blue-50/20' : 'border-slate-200'}`}>
                      <input type="radio" name="manualType" checked={manualType === 'guiado'} onChange={() => setManualType('guiado')} className="mt-1 w-4 h-4 text-blue-600" />
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">No tengo el radicado completo</p>
                        <p className="text-xs text-slate-500">Te ayudamos a construirlo paso a paso buscando el despacho.</p>
                      </div>
                    </label>
                  </div>

                  <div className="border-t border-slate-100 pt-5">
                    {manualType === 'directo' ? (
                      <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">Número de Radicado</label>
                          <input 
                            type="text" 
                            required
                            placeholder="Ej. 11001400300120230012300"
                            maxLength={23}
                            value={newProcessForm.processId}
                            onChange={e => setNewProcessForm({...newProcessForm, processId: e.target.value.replace(/\D/g, '')})}
                            className="w-full px-4 py-2.5 font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-blue-900 tracking-wider shadow-sm"
                          />
                          <p className="text-xs text-slate-500 mt-1">Debe contener exactamente 23 dígitos numéricos.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300 bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Departamento</label>
                            <select className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none bg-white">
                              <option value="">Seleccione...</option>
                              <option value="11">Bogotá D.C.</option>
                              <option value="17">Caldas</option>
                              <option value="05">Antioquia</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Municipio</label>
                            <select className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none bg-white">
                              <option value="">Seleccione...</option>
                              <option value="001">Bogotá (001)</option>
                              <option value="001">Manizales (001)</option>
                              <option value="001">Medellín (001)</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Juzgado / Especialidad</label>
                          <select 
                            value={newProcessForm.tipoJuzgado}
                            onChange={(e) => setNewProcessForm({...newProcessForm, tipoJuzgado: e.target.value})}
                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none bg-white"
                          >
                            <option value="">Seleccione...</option>
                            <option value="4003">Civil Municipal (4003)</option>
                            <option value="3103">Civil del Circuito (3103)</option>
                            <option value="3105">Laboral del Circuito (3105)</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Despacho</label>
                            <select 
                              value={newProcessForm.despacho}
                              onChange={(e) => setNewProcessForm({...newProcessForm, despacho: e.target.value})}
                              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none bg-white"
                            >
                              <option value="">Número...</option>
                              <option value="001">Juzgado 001</option>
                              <option value="002">Juzgado 002</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Últimos 10 dígitos</label>
                            <input 
                              type="text" 
                              required={manualType === 'guiado'}
                              placeholder="Ej. 20230012300"
                              maxLength={10}
                              value={newProcessForm.consecutivo}
                              onChange={(e) => setNewProcessForm({...newProcessForm, consecutivo: e.target.value.replace(/\D/g, '')})}
                              className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg outline-none bg-white"
                            />
                          </div>
                        </div>
                        <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg flex items-center justify-between mt-2">
                           <span className="text-xs font-bold text-blue-800">Radicado construido:</span>
                           <span className="font-mono text-sm text-blue-900 tracking-wider">
                             11001{newProcessForm.tipoJuzgado || '----'}{newProcessForm.despacho || '---'}{newProcessForm.consecutivo || '----------'}
                           </span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                    <button type="button" onClick={() => setIsAddModalOpen(false)} disabled={isSubmittingManual} className="px-5 py-2.5 font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50">
                      Cancelar
                    </button>
                    <button type="submit" disabled={isSubmittingManual} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 hover:shadow-lg text-white font-bold rounded-lg transition-all flex items-center justify-center min-w-[200px]">
                      {isSubmittingManual ? (
                        <>
                          <Loader2 size={18} className="animate-spin mr-2" />
                          Consultando Rama...
                        </>
                      ) : 'Buscar y Sincronizar'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  
                  {/* Flujo Dinámico del Blueprint para Mapeo de Excel */}
                  {excelStep === 'upload' ? (
                    <div className="animate-in fade-in duration-300">
                      <div 
                        onDragOver={(e) => e.preventDefault()} 
                        onDrop={handleFileDrop}
                        className="border-2 border-dashed border-blue-200 rounded-2xl p-10 flex flex-col items-center justify-center text-center bg-slate-50 hover:bg-blue-50 transition-colors cursor-pointer group"
                      >
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform">
                          <Upload size={28} className="text-blue-500" />
                        </div>
                        <p className="font-bold text-slate-700 mb-1 text-lg">Arrastra tu plantilla de Excel aquí</p>
                        <p className="text-sm text-slate-500 mb-6">Solo archivos .xlsx o .csv con radicados válidos.</p>
                        <label className="bg-white border-2 border-blue-100 text-blue-700 px-6 py-2.5 rounded-xl font-bold cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all">
                          Examinar Archivos
                          <input type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={() => setExcelStep('mapping')} />
                        </label>
                      </div>
                      
                      <div className="bg-blue-50 p-4 rounded-xl flex items-start gap-3 mt-6">
                        <Info className="text-blue-600 mt-0.5 shrink-0" size={20} />
                        <div>
                          <p className="text-sm font-bold text-blue-900">¿No tienes el formato correcto?</p>
                          <p className="text-xs text-blue-800 mt-1">El sistema solo requiere una columna principal con el radicado de 23 dígitos. Si incluyes más información, se ignorará y reemplazará por la data oficial.</p>
                        </div>
                      </div>
                      <div className="pt-6 flex justify-end gap-3 border-t border-slate-100">
                        <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-5 py-2.5 font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                          Volver
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="animate-in slide-in-from-right-4 duration-300">
                      <h4 className="text-base font-bold text-slate-800 mb-2">Paso 2: Relacionar Columnas</h4>
                      <p className="text-sm text-slate-500 mb-6">Hemos detectado estas columnas en tu archivo. Indica cuál corresponde al Radicado de 23 dígitos.</p>
                      
                      <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 mb-6">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-sm font-bold text-slate-700">Identificador del Proceso (Radicado) *</span>
                          <select defaultValue="A" className="w-1/2 px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="">Selecciona columna...</option>
                            <option value="A">Columna A (ej: 1700140...)</option>
                            <option value="B">Columna B (Juzgado)</option>
                            <option value="C">Columna C (Cliente)</option>
                          </select>
                        </div>
                        <p className="text-xs text-slate-500">El sistema procesará las <strong>87 filas</strong> detectadas en background para no bloquearte la pantalla.</p>
                      </div>

                      <div className="pt-4 flex justify-between gap-3 border-t border-slate-100">
                        <button type="button" onClick={() => setExcelStep('upload')} className="px-5 py-2.5 font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                          Atrás
                        </button>
                        <button onClick={startBulkImport} className="px-6 py-2.5 bg-green-600 hover:bg-green-700 hover:shadow-lg text-white font-bold rounded-lg transition-all flex items-center gap-2">
                          Iniciar Sincronización
                          <ArrowRight size={18} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}