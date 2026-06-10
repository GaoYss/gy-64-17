import { createContext, useContext, useEffect, useMemo, useState } from "react";

import {
  appointmentApi,
  customerApi,
  dashboardApi,
  inspectionApi,
  procurementApi,
  projectApi,
} from "../api/modules.js";

const AppContext = createContext(null);

const apiMap = {
  customers: customerApi,
  appointments: appointmentApi,
  projects: projectApi,
  procurements: procurementApi,
  inspections: inspectionApi,
};

function rebuildRecentUpdates(projects) {
  return [...projects]
    .sort((a, b) => {
      const riskRank = (lvl) => (lvl === "high" ? 0 : 1);
      const diff = riskRank(a.risk_level) - riskRank(b.risk_level);
      return diff !== 0 ? diff : b.progress - a.progress;
    })
    .map((project) => ({
      project_name: project.project_name,
      phase: project.phase,
      progress: project.progress,
      latest_update: project.latest_update,
      risk_level: project.risk_level,
    }));
}

function rebuildDashboard(prev, projects) {
  if (!prev) return prev;
  const activeProjects = projects.filter((p) => p.progress < 100);
  const avgProgress = Math.round(
    projects.reduce((sum, p) => sum + p.progress, 0) / (projects.length || 1),
  );

  const phases = [...new Set(projects.map((p) => p.phase))].sort();
  const phaseDistribution = phases.map((phase) => ({
    phase,
    count: projects.filter((p) => p.phase === phase).length,
  }));

  return {
    ...prev,
    generated_at: new Date().toISOString().slice(0, 19),
    metrics: prev.metrics.map((m, i) => {
      if (i === 2) {
        return { ...m, value: activeProjects.length, trend: `${avgProgress}% avg progress` };
      }
      return m;
    }),
    phase_distribution: phaseDistribution,
    recent_updates: rebuildRecentUpdates(projects),
  };
}

export function AppProvider({ children }) {
  const [state, setState] = useState({
    dashboard: null,
    customers: [],
    appointments: [],
    projects: [],
    procurements: [],
    inspections: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const [dashboard, customers, appointments, projects, procurements, inspections] = await Promise.all([
        dashboardApi.summary(),
        customerApi.list(),
        appointmentApi.list(),
        projectApi.list(),
        procurementApi.list(),
        inspectionApi.list(),
      ]);
      setState({ dashboard, customers, appointments, projects, procurements, inspections });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function createRecord(module, payload) {
    const created = await apiMap[module].create(payload);
    setState((current) => {
      const nextModuleList = [...current[module], created];
      if (module !== "projects") {
        return { ...current, [module]: nextModuleList };
      }
      return {
        ...current,
        projects: nextModuleList,
        dashboard: rebuildDashboard(current.dashboard, nextModuleList),
      };
    });
    return created;
  }

  async function updateRecord(module, id, payload) {
    const updated = await apiMap[module].update(id, payload);
    setState((current) => {
      const nextModuleList = current[module].map((item) => (item.id === id ? updated : item));
      if (module !== "projects") {
        return { ...current, [module]: nextModuleList };
      }
      return {
        ...current,
        projects: nextModuleList,
        dashboard: rebuildDashboard(current.dashboard, nextModuleList),
      };
    });
    return updated;
  }

  useEffect(() => {
    refresh();
  }, []);

  const value = useMemo(
    () => ({ ...state, loading, error, refresh, createRecord, updateRecord }),
    [state, loading, error],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppData must be used within AppProvider");
  }
  return context;
}
