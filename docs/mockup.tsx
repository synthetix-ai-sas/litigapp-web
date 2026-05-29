import React, { useState, useMemo } from 'react';
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
  FileSpreadsheet
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
    nombresSp: 'Juan Pérez vs María Gómez'
  },
  {
    id: '2',
    uniqueId: 'PROC-2023-045',
    processId: '11001400300120230045000',
    lastUpdateDate: '2026-05-21T14:15:00',
    status: 'Fijación en Lista',
    attended: false,
    juzgado: 'Juzgado 3 Laboral',
    nombresSp: 'Carlos Ruiz vs Empresa S.A.'
  },
  {
    id: '3',
    uniqueId: 'PROC-2022-890',
    processId: '11001400300120220089000',
    lastUpdateDate: '2026-05-20T09:00:00',
    status: 'Sentencia Primera Instancia',
    attended: true,
    juzgado: 'Juzgado 5 Civil del Circuito',
    nombresSp: 'Ana López vs Seguros XYZ'
  },
  {
    id: '4',
    uniqueId: 'PROC-2024-012',
    processId: '11001400300120240001200',
    lastUpdateDate: '2026-05-19T11:45:00',
    status: 'Rechazo de Demanda',
    attended: true,
    juzgado: 'Juzgado 1 Civil Municipal',
    nombresSp: 'Pedro Martínez vs Estado'
  },
  {
    id: '5',
    uniqueId: 'PROC-2023-555',
    processId: '11001400300520230055500',
    lastUpdateDate: '2026-05-22T10:20:00',
    status: 'Traslado Excepciones',
    attended: false,
    juzgado: 'Juzgado 2 de Familia',
    nombresSp: 'Luis Sánchez vs Diana Ramírez'
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('novedades');
  const [processes, setProcesses] = useState(MOCK_PROCESSES);
  
  // Modal State
  const [selectedProcess, setSelectedProcess] = useState(null);
  const [modalType, setModalType] = useState(null); // 'atender' | 'descargar' | 'agregar'

  // New Process State
  const [addMethod, setAddMethod] = useState('manual'); // 'manual' | 'excel'
  const [newProcessForm, setNewProcessForm] = useState({ processId: '', juzgado: '', nombresSp: '' });

  // Search Filters
  const [filters, setFilters] = useState({
    juzgado: '',
    id: '',
    nombresSp: ''
  });

  // Derived Data
  const novedades = processes.filter(p => !p.attended);
  
  const filteredProcesos = useMemo(() => {
    return processes.filter(p => {
      const matchJuzgado = p.juzgado.toLowerCase().includes(filters.juzgado.toLowerCase());
      const matchId = p.processId.includes(filters.id) || p.uniqueId.includes(filters.id);
      const matchNombres = p.nombresSp.toLowerCase().includes(filters.nombresSp.toLowerCase());
      return matchJuzgado && matchId && matchNombres;
    });
  }, [processes, filters]);

  // Actions
  const handleMarkAsAttended = () => {
    setProcesses(prev => 
      prev.map(p => p.id === selectedProcess.id ? { ...p, attended: true } : p)
    );
    closeModal();
  };

  const handleAddNewProcess = (e) => {
    e.preventDefault();
    const newId = String(processes.length + 1);
    const processToAdd = {
      id: newId,
      uniqueId: `PROC-2026-${newId.padStart(3, '0')}`,
      processId: newProcessForm.processId || '11001400300000000000000',
      lastUpdateDate: new Date().toISOString(),
      status: 'Radicado',
      attended: true,
      juzgado: newProcessForm.juzgado || 'Juzgado Asignado',
      nombresSp: newProcessForm.nombresSp || 'Partes sin definir'
    };
    setProcesses([processToAdd, ...processes]);
    closeModal();
    setNewProcessForm({ processId: '', juzgado: '', nombresSp: '' });
  };

  const handleMockExcelUpload = () => {
    alert("Simulando subida y procesamiento de Excel...");
    closeModal();
  };

  const openModal = (process, type) => {
    setSelectedProcess(process);
    setModalType(type);
  };

  const closeModal = () => {
    setSelectedProcess(null);
    setModalType(null);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', { 
      year: 'numeric', month: 'short', day: 'numeric', 
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      {/* HEADER */}
      <header className="bg-blue-700 text-white shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale size={28} />
            <h1 className="text-xl font-bold tracking-wide">LitigApp</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative cursor-pointer">
              <Bell size={20} />
              {novedades.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                  {novedades.length}
                </span>
              )}
            </div>
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white font-bold">
              U
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {/* TABS */}
        <div className="flex border-b border-slate-200 mb-8">
          <button
            onClick={() => setActiveTab('novedades')}
            className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition-colors relative ${
              activeTab === 'novedades' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Bell size={18} />
            Novedades
            {novedades.length > 0 && (
              <span className="bg-red-100 text-red-600 py-0.5 px-2 rounded-full text-xs font-bold ml-1">
                {novedades.length}
              </span>
            )}
            {activeTab === 'novedades' && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-md" />
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('procesos')}
            className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition-colors relative ${
              activeTab === 'procesos' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileText size={18} />
            Procesos
            {activeTab === 'procesos' && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-md" />
            )}
          </button>
        </div>

        {/* TAB CONTENT: NOVEDADES */}
        {activeTab === 'novedades' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Procesos con nuevos estados</h2>
              <p className="text-slate-500 text-sm mt-1">Revisa y marca como atendidos los cambios recientes.</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              {novedades.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  <CheckCircle size={48} className="mx-auto text-green-400 mb-3" />
                  <p className="text-lg font-medium">¡Al día!</p>
                  <p>No tienes novedades pendientes por atender.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {novedades.map((proc) => (
                    <div key={proc.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                        <div>
                          <div className="text-xs text-slate-400 font-medium mb-1">ID Proceso</div>
                          <div className="font-semibold text-blue-700">{proc.processId}</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-400 font-medium mb-1">Última Actualización</div>
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <Clock size={14} className="text-slate-400"/>
                            {formatDate(proc.lastUpdateDate)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-400 font-medium mb-1">Nuevo Estado</div>
                          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            {proc.status}
                          </div>
                        </div>
                      </div>
                      <div className="ml-4">
                        <button 
                          onClick={() => openModal(proc, 'atender')}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors tooltip relative"
                          title="Ver y Atender"
                        >
                          <Eye size={20} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Pagination Mock */}
              {novedades.length > 0 && (
                <div className="bg-slate-50 px-4 py-3 flex items-center justify-between border-t border-slate-200 sm:px-6">
                  <div className="text-sm text-slate-500">
                    Mostrando <span className="font-medium">1</span> a <span className="font-medium">{novedades.length}</span> resultados
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="p-1 rounded-md text-slate-400 hover:bg-slate-200 disabled:opacity-50" disabled><ChevronLeft size={20}/></button>
                    <button className="px-3 py-1 rounded-md bg-blue-600 text-white font-medium text-sm">1</button>
                    <button className="p-1 rounded-md text-slate-600 hover:bg-slate-200"><ChevronRight size={20}/></button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB CONTENT: PROCESOS */}
        {activeTab === 'procesos' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Todos los procesos</h2>
                <p className="text-slate-500 text-sm mt-1">Busca y gestiona tu portafolio completo.</p>
              </div>
              <button 
                onClick={() => setModalType('agregar')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm shrink-0"
              >
                <Plus size={18} />
                Agregar Proceso
              </button>
            </div>

            {/* SEARCH FILTERS */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 w-full">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Juzgado</label>
                <div className="relative">
                  <Building size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Ej. Civil Municipal"
                    value={filters.juzgado}
                    onChange={(e) => setFilters({...filters, juzgado: e.target.value})}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>
              <div className="flex-1 w-full">
                <label className="block text-xs font-semibold text-slate-600 mb-1">ID Proceso</label>
                <div className="relative">
                  <FileText size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Ej. 11001400..."
                    value={filters.id}
                    onChange={(e) => setFilters({...filters, id: e.target.value})}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>
              <div className="flex-1 w-full">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nombres SP</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Ej. Juan Pérez"
                    value={filters.nombresSp}
                    onChange={(e) => setFilters({...filters, nombresSp: e.target.value})}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>
              <button className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors">
                <Search size={18} />
                Buscar
              </button>
            </div>

            {/* PROCESS LIST */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="divide-y divide-slate-100">
                {filteredProcesos.map((proc) => (
                  <div key={proc.id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 group">
                    <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 items-center">
                      <div>
                        <div className="text-xs text-slate-400 font-medium mb-1">ID / Radicado</div>
                        <div className="font-semibold text-blue-700 break-all">{proc.processId}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 font-medium mb-1">Juzgado</div>
                        <div className="text-slate-700 text-sm truncate" title={proc.juzgado}>{proc.juzgado}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 font-medium mb-1">Último Estado</div>
                        <div className="text-slate-700 text-sm">{proc.status}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock size={12} /> {formatDate(proc.lastUpdateDate)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 font-medium mb-1">Atención</div>
                        {proc.attended ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                            <CheckCircle size={12} /> Atendido
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                            <Bell size={12} /> Pendiente
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-end border-t border-slate-100 md:border-t-0 pt-3 md:pt-0 mt-2 md:mt-0">
                      <button 
                        onClick={() => openModal(proc, 'descargar')}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors"
                      >
                        <FileText size={16} />
                        Ver Opciones
                      </button>
                    </div>
                  </div>
                ))}
                
                {filteredProcesos.length === 0 && (
                  <div className="p-8 text-center text-slate-500">
                    <Search size={48} className="mx-auto text-slate-300 mb-3" />
                    <p className="text-lg font-medium">Sin resultados</p>
                    <p>No se encontraron procesos con los filtros actuales.</p>
                  </div>
                )}
              </div>
              
              {/* Pagination Mock */}
              {filteredProcesos.length > 0 && (
                <div className="bg-slate-50 px-4 py-3 flex items-center justify-between border-t border-slate-200 sm:px-6">
                  <div className="text-sm text-slate-500">
                    Mostrando <span className="font-medium">1</span> a <span className="font-medium">{filteredProcesos.length}</span> de <span className="font-medium">{processes.length}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="p-1 rounded-md text-slate-400 hover:bg-slate-200 disabled:opacity-50" disabled><ChevronLeft size={20}/></button>
                    <button className="px-3 py-1 rounded-md bg-blue-600 text-white font-medium text-sm">1</button>
                    <button className="px-3 py-1 rounded-md text-slate-600 hover:bg-slate-200 text-sm">2</button>
                    <button className="p-1 rounded-md text-slate-600 hover:bg-slate-200"><ChevronRight size={20}/></button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* MODALS OVERLAY */}
      {(selectedProcess || modalType === 'agregar') && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          
          {/* MODAL: AGREGAR PROCESO */}
          {modalType === 'agregar' && (
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Plus className="text-blue-600" size={20} />
                  Agregar Nuevo Proceso
                </h3>
                <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 bg-white rounded-full p-1 shadow-sm">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto">
                {/* TABS DENTRO DEL MODAL */}
                <div className="flex bg-slate-100 p-1 rounded-lg mb-6">
                  <button 
                    onClick={() => setAddMethod('manual')}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${addMethod === 'manual' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Formulario Manual
                  </button>
                  <button 
                    onClick={() => setAddMethod('excel')}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${addMethod === 'excel' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <FileSpreadsheet size={16} />
                    Subir Excel
                  </button>
                </div>

                {addMethod === 'manual' ? (
                  <form onSubmit={handleAddNewProcess} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Radicado (23 dígitos)</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Ej. 11001400300120230012300"
                        value={newProcessForm.processId}
                        onChange={e => setNewProcessForm({...newProcessForm, processId: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Juzgado</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Ej. Juzgado 1 Civil Municipal"
                        value={newProcessForm.juzgado}
                        onChange={e => setNewProcessForm({...newProcessForm, juzgado: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Partes (Demandante vs Demandado)</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Ej. Juan Pérez vs María Gómez"
                        value={newProcessForm.nombresSp}
                        onChange={e => setNewProcessForm({...newProcessForm, nombresSp: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6">
                      <button type="button" onClick={closeModal} className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        Cancelar
                      </button>
                      <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
                        Guardar Proceso
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
                      <Upload size={32} className="text-slate-400 mb-3" />
                      <p className="font-medium text-slate-700 mb-1">Arrastra tu archivo Excel aquí</p>
                      <p className="text-sm text-slate-500 mb-4">o haz clic para buscar en tu computador (.xlsx, .xls)</p>
                      <label className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg font-medium cursor-pointer hover:bg-slate-50 transition-colors">
                        Seleccionar Archivo
                        <input type="file" className="hidden" accept=".xlsx, .xls" />
                      </label>
                    </div>
                    <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                      <button type="button" onClick={closeModal} className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        Cancelar
                      </button>
                      <button onClick={handleMockExcelUpload} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2">
                        <FileSpreadsheet size={18} />
                        Subir y Procesar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* MODAL: ATENDER NOVEDAD */}
          {modalType === 'atender' && (
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Bell className="text-amber-500" size={20} />
                  Atender Novedad
                </h3>
                <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 bg-white rounded-full p-1 shadow-sm">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6">
                <div className="mb-6 space-y-4">
                  <div>
                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Proceso / Radicado</p>
                    <p className="text-lg font-mono text-slate-800 bg-slate-100 p-2 rounded-md border border-slate-200">
                      {selectedProcess.processId}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Fecha Actuación</p>
                      <p className="font-medium text-slate-800 flex items-center gap-1">
                        <Clock size={16} className="text-slate-400"/>
                        {formatDate(selectedProcess.lastUpdateDate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Estado Registrado</p>
                      <p className="font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200 inline-block">
                        {selectedProcess.status}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Partes Involucradas</p>
                    <p className="text-slate-700 flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                       <User size={18} className="text-slate-400" />
                       {selectedProcess.nombresSp}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button 
                    onClick={closeModal}
                    className="px-5 py-2.5 rounded-lg font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleMarkAsAttended}
                    className="px-5 py-2.5 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"
                  >
                    <CheckCircle size={18} />
                    Marcar como Atendido
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MODAL: VER/DESCARGAR PROCESO */}
          {modalType === 'descargar' && (
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-800">Opciones del Proceso</h3>
                <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Scale size={32} className="text-blue-600" />
                  </div>
                  <h4 className="font-semibold text-slate-800 mb-1">{selectedProcess.juzgado}</h4>
                  <p className="text-sm text-slate-500 font-mono">{selectedProcess.processId}</p>
                </div>

                <div className="bg-slate-50 rounded-lg p-4 mb-6 border border-slate-200 space-y-3">
                   <div className="flex justify-between items-center text-sm">
                     <span className="text-slate-500">Estado Actual:</span>
                     <span className="font-medium text-slate-800 text-right">{selectedProcess.status}</span>
                   </div>
                   <div className="flex justify-between items-center text-sm">
                     <span className="text-slate-500">Partes:</span>
                     <span className="font-medium text-slate-800 text-right">{selectedProcess.nombresSp}</span>
                   </div>
                </div>

                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => { alert('Iniciando descarga de PDF...'); closeModal(); }}
                    className="w-full px-4 py-3 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center gap-2"
                  >
                    <Download size={18} />
                    Descargar Expediente PDF
                  </button>
                  <button 
                    onClick={closeModal}
                    className="w-full px-4 py-3 rounded-lg font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}