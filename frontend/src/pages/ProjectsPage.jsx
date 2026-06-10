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

  const projectOptions = projects.map((p) => ({
    value: String(p.id),
    label: `${p.id} — ${p.project_name}`,
  }));

  const editFields = [
    { name: "project_id", label: "Project", type: "select", options: projectOptions, required: true },
    { name: "customer_name", label: "Customer", type: "text", initial: "" },
    { name: "project_name", label: "Project name", type: "text", initial: "" },
    { name: "manager", label: "Manager", type: "text", initial: "" },
    { name: "phase", label: "Phase", type: "select", options: ["", "design", "demolition", "plumbing", "waterproofing", "carpentry", "finishing", "completed"] },
    { name: "progress", label: "Progress", type: "number", initial: "" },
    { name: "start_date", label: "Start date", type: "text", initial: "" },
    { name: "expected_finish", label: "Expected finish", type: "text", initial: "" },
    { name: "risk_level", label: "Risk", type: "select", options: ["", "low", "medium", "high"] },
    { name: "latest_update", label: "Latest update", type: "text", initial: "" },
  ];

  return (
    <div className="page-stack">
      <div className="form-grid">
        <RecordForm title="Create project" fields={projectFields} onSubmit={(payload) => createRecord("projects", payload)} />
        <RecordForm
          key={projects.length}
          title="Edit project"
          fields={editFields}
          onSubmit={(payload) => {
            const { project_id, ...rest } = payload;
            const data = Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== "" && v != null));
            return updateRecord("projects", Number(project_id), data);
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
