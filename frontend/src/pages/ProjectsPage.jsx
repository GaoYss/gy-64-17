import { useState } from "react";

import { DataTable } from "../components/DataTable.jsx";
import { ProgressBar } from "../components/ProgressBar.jsx";
import { RecordForm } from "../components/RecordForm.jsx";
import { StatusBadge } from "../components/StatusBadge.jsx";
import { useAppData } from "../context/AppContext.jsx";
import { projectFields } from "../modules/forms.js";

const columns = [
  { key: "project_name", label: "Project" },
  { key: "customer_name", label: "Customer" },
  { key: "manager", label: "Manager" },
  { key: "phase", label: "Phase", render: (row) => <StatusBadge value={row.phase} /> },
  { key: "progress", label: "Progress", render: (row) => <ProgressBar value={row.progress} /> },
  { key: "risk_level", label: "Risk", render: (row) => <StatusBadge value={row.risk_level} /> },
  { key: "expected_finish", label: "Finish" },
  { key: "latest_update", label: "Latest update" },
];

export function ProjectsPage() {
  const { projects, createRecord, updateRecord } = useAppData();

  const projectOptions = [
    { value: "", label: "— Select a project —" },
    ...projects.map((p) => ({
      value: String(p.id),
      label: `${p.id} — ${p.project_name}`,
    })),
  ];

  const editFields = [
    { name: "project_id", label: "Project", type: "select", options: projectOptions, required: true },
    { name: "customer_name", label: "Customer", type: "text" },
    { name: "project_name", label: "Project name", type: "text" },
    { name: "manager", label: "Manager", type: "text" },
    { name: "phase", label: "Phase", type: "select", options: ["design", "demolition", "plumbing", "waterproofing", "carpentry", "finishing", "completed"] },
    { name: "progress", label: "Progress", type: "number" },
    { name: "start_date", label: "Start date", type: "date" },
    { name: "expected_finish", label: "Expected finish", type: "date" },
    { name: "risk_level", label: "Risk", type: "select", options: ["low", "medium", "high"] },
    { name: "latest_update", label: "Latest update", type: "textarea" },
  ];

  const [selectedId, setSelectedId] = useState(null);
  const selected = projects.find((p) => String(p.id) === String(selectedId)) || null;

  const initialValues = selected
    ? {
        project_id: String(selected.id),
        customer_name: selected.customer_name ?? "",
        project_name: selected.project_name ?? "",
        manager: selected.manager ?? "",
        phase: selected.phase ?? "design",
        progress: selected.progress ?? 0,
        start_date: selected.start_date ?? "",
        expected_finish: selected.expected_finish ?? "",
        risk_level: selected.risk_level ?? "low",
        latest_update: selected.latest_update ?? "",
      }
    : null;

  return (
    <div className="page-stack">
      <div className="form-grid">
        <RecordForm title="Create project" fields={projectFields} onSubmit={(payload) => createRecord("projects", payload)} />
        <RecordForm
          title="Edit project"
          fields={editFields}
          initialValues={initialValues}
          onFieldChange={(name, value) => {
            if (name === "project_id") setSelectedId(value);
          }}
          onSubmit={(payload) => {
            const { project_id, ...rest } = payload;
            return updateRecord("projects", Number(project_id), rest);
          }}
        />
      </div>
      <section className="panel">
        <div className="section-heading">
          <h2>Construction Progress</h2>
          <span>{projects.filter((project) => project.progress < 100).length} active</span>
        </div>
        <DataTable columns={columns} rows={projects} />
      </section>
    </div>
  );
}
