import XLSX from "xlsx-js-style";

export interface ExcelReportTask {
  taskId?: string;
  taskKey: string;
  taskTitle: string;
  taskType?: string;
  totalHours: number;
  periodHours: Record<string, number>;
}

export interface ExcelReportUser {
  userId: string;
  userName: string;
  totalHours: number;
  tasks: ExcelReportTask[];
}

interface ExcelCell {
  v: string | number;
  t?: string;
  s?: Record<string, unknown>;
}

type ExcelRow = (string | number | ExcelCell | null | undefined)[];

// Helper to format date from YYYY-MM-DD to DD/MM/YYYY
const formatDate = (dateStr: string): string => {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

// Helper to get current date time in DD/MM/YYYY HH:mm:ss
const getFormattedCurrentDateTime = (): string => {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  const date = pad(now.getDate());
  const month = pad(now.getMonth() + 1);
  const year = now.getFullYear();
  const hours = pad(now.getHours());
  const minutes = pad(now.getMinutes());
  const seconds = pad(now.getSeconds());
  return `${date}/${month}/${year} ${hours}:${minutes}:${seconds}`;
};

export const exportWorklogReportToExcel = (
  periods: string[],
  users: ExcelReportUser[],
  workspaceKey: string,
  startDate: string,
  endDate: string,
  fileName = "worklog-report.xlsx"
) => {
  const rows: ExcelRow[] = [];
  const totalCols = 6 + periods.length;
  const lastColIndex = Math.max(13, totalCols - 1); // Ensure it spans at least to metadata columns

  // Helper to fill a row with a default style (e.g. for merged title rows)
  const createTitleRow = (text: string, isFirstRow: boolean): ExcelRow => {
    const row: ExcelRow = [];
    for (let c = 0; c <= lastColIndex; c++) {
      row[c] = {
        v: isFirstRow && c === 0 ? text : "",
        s: {
          fill: { fgColor: { rgb: "4BA3C3" } }, // Teal-blue header
          font: { bold: true, size: 16, color: { rgb: "FFFFFF" } },
          alignment: { horizontal: "center", vertical: "center" }
        }
      };
    }
    return row;
  };

  // Row 1-3: Merged header with background
  rows[0] = createTitleRow("WORK LOG", true);
  rows[1] = createTitleRow("", false);
  rows[2] = createTitleRow("", false);

  // Row 4: Metadata
  const metadataRow: ExcelRow = [];
  metadataRow[2] = { v: `WorkSpace: ${workspaceKey}`, s: { font: { size: 10 } } };
  metadataRow[5] = { v: `Period: ${formatDate(startDate)} - ${formatDate(endDate)}`, s: { font: { size: 10 } } };
  metadataRow[lastColIndex] = { v: `Date of issue: ${getFormattedCurrentDateTime()}`, s: { font: { size: 10 }, alignment: { horizontal: "right" } } };
  rows[3] = metadataRow;

  // Row 5 & 6: Empty
  rows[4] = [];
  rows[5] = [];

  // Row 7: Unit label
  const unitRow: ExcelRow = [];
  unitRow[totalCols - 1] = { v: "Unit(h)", s: { font: { italic: true, size: 9 }, alignment: { horizontal: "right" } } };
  rows[6] = unitRow;

  // Style Tokens
  const borderStyle = {
    top: { style: "thin", color: { rgb: "D3D3D3" } },
    bottom: { style: "thin", color: { rgb: "D3D3D3" } },
    left: { style: "thin", color: { rgb: "D3D3D3" } },
    right: { style: "thin", color: { rgb: "D3D3D3" } }
  };

  const headerStyle = {
    fill: { fgColor: { rgb: "FEF9E7" } }, // light yellow
    font: { bold: true, size: 10, color: { rgb: "000000" } },
    alignment: { horizontal: "center", vertical: "center" },
    border: borderStyle
  };

  const memberStyle = {
    fill: { fgColor: { rgb: "F5CBA7" } }, // peach/orange
    font: { bold: true, size: 10, color: { rgb: "000000" } },
    alignment: { vertical: "center" },
    border: borderStyle
  };

  const taskStyle = {
    fill: { fgColor: { rgb: "E8DAEF" } }, // lavender/purple
    font: { size: 10, color: { rgb: "000000" } },
    alignment: { vertical: "center" },
    border: borderStyle
  };

  // Row 8: Table Headers
  const headerRow: ExcelRow = [];
  headerRow[2] = { v: "Member", s: headerStyle };
  headerRow[3] = { v: "Task key", s: headerStyle };
  headerRow[4] = { v: "Task title", s: headerStyle };
  headerRow[5] = { v: "Total time", s: headerStyle };
  periods.forEach((period, idx) => {
    headerRow[6 + idx] = { v: formatDate(period), s: headerStyle };
  });
  rows[7] = headerRow;

  // Row 9 onwards: Data rows
  users.forEach((user) => {
    // User summary row
    const userRow: ExcelRow = [];
    userRow[2] = { v: user.userName, s: memberStyle };
    userRow[3] = { v: "", s: memberStyle };
    userRow[4] = { v: "", s: memberStyle };
    userRow[5] = { v: user.totalHours, s: { ...memberStyle, alignment: { horizontal: "center" } } };

    periods.forEach((period, idx) => {
      const userPeriodTotal = user.tasks.reduce(
        (sum, task) => sum + (task.periodHours[period] || 0),
        0
      );
      userRow[6 + idx] = {
        v: userPeriodTotal > 0 ? userPeriodTotal : "",
        s: { ...memberStyle, alignment: { horizontal: "center" } }
      };
    });
    rows.push(userRow);

    // Task details rows
    user.tasks.forEach((task) => {
      const taskRow: ExcelRow = [];
      taskRow[2] = { v: "", s: taskStyle };
      taskRow[3] = { v: task.taskKey, s: taskStyle };
      taskRow[4] = { v: task.taskTitle, s: taskStyle };
      taskRow[5] = { v: task.totalHours, s: { ...taskStyle, alignment: { horizontal: "center" } } };

      periods.forEach((period, idx) => {
        const hrs = task.periodHours[period];
        taskRow[6 + idx] = {
          v: hrs > 0 ? hrs : "",
          s: { ...taskStyle, alignment: { horizontal: "center" } }
        };
      });
      rows.push(taskRow);
    });

    // Empty separator row
    rows.push([]);
  });

  // Create worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(rows);

  // Apply merge ranges
  worksheet["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 2, c: lastColIndex } } // Merge title A1:P3 (or last metadata col)
  ];

  // Set column widths to match templates
  const cols = [];
  cols[0] = { wch: 5 };   // A
  cols[1] = { wch: 5 };   // B
  cols[2] = { wch: 25 };  // C: Member
  cols[3] = { wch: 15 };  // D: Task key
  cols[4] = { wch: 35 };  // E: Task title
  cols[5] = { wch: 12 };  // F: Total time
  for (let i = 0; i < periods.length; i++) {
    cols[6 + i] = { wch: 12 }; // Dates
  }
  worksheet["!cols"] = cols;

  // Create workbook and append worksheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "WORK LOG");

  // Write and trigger download
  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", fileName);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
