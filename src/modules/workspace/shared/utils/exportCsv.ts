/**
 * Utility to export worklog report data to CSV
 */
export interface CSVReportTask {
  taskKey: string;
  taskTitle: string;
  totalHours: number;
  periodHours: Record<string, number>;
}

export interface CSVReportUser {
  userName: string;
  totalHours: number;
  tasks: CSVReportTask[];
}

export const exportWorklogReportToCSV = (
  periods: string[],
  users: CSVReportUser[],
  fileName = "worklog-report.csv"
) => {
  // Construct headers
  const headers = ["User", "Task Key", "Task Title", "Total Hours", ...periods];
  
  const rows: string[][] = [headers];

  users.forEach((user) => {
    // Row for the user total summary
    rows.push([
      user.userName,
      "",
      "Total spent",
      `${user.totalHours}h`,
      ...periods.map(() => "")
    ]);

    // Rows for each task of the user
    user.tasks.forEach((task) => {
      const taskRow = [
        "", // User name is blank to group under the user block
        task.taskKey,
        task.taskTitle,
        `${task.totalHours}h`,
        ...periods.map((period) => {
          const hrs = task.periodHours[period];
          return hrs ? `${hrs}h` : "";
        })
      ];
      rows.push(taskRow);
    });
  });

  // Convert array of arrays to CSV string
  const csvContent = rows
    .map((row) =>
      row
        .map((val) => {
          const cleaned = (val || "").replace(/"/g, '""');
          return cleaned.includes(",") || cleaned.includes("\n") || cleaned.includes('"')
            ? `"${cleaned}"`
            : cleaned;
        })
        .join(",")
    )
    .join("\n");

  // Create blob and download
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", fileName);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
