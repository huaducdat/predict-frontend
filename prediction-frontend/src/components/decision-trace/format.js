export function formatMetric(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "Chưa có dữ liệu";
  return num.toFixed(2);
}

export function formatPercent(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "Chưa có dữ liệu";
  return `${(num * 100).toFixed(1)}%`;
}

export function formatDeltaPercent(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "Chưa có dữ liệu";
  return `${num > 0 ? "+" : ""}${num.toFixed(1)}%`;
}

export function formatFactor(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "Chưa có dữ liệu";
  return `x${num.toFixed(2)}`;
}

export function formatScore(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "Chưa có dữ liệu";
  return num.toFixed(4);
}

export function formatDate(value) {
  if (!value) return "Chưa có dữ liệu";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: String(value).includes("T") ? "short" : undefined,
  }).format(date);
}

export function translatePatternState(value) {
  const state = String(value || "INSUFFICIENT_DATA").toUpperCase();
  const labels = {
    STABLE: "Ổn định",
    SHIFTING: "Đang thay đổi",
    VOLATILE: "Biến động mạnh",
    INSUFFICIENT_DATA: "Chưa đủ dữ liệu",
  };
  return labels[state] || state;
}

export function translateMode(value) {
  const mode = String(value || "").toUpperCase();
  const labels = {
    SHORT_TERM: "Ngắn hạn",
    EXTENDED: "Mở rộng",
  };
  return labels[mode] || value || "Chưa có dữ liệu";
}

export function translateDirection(value) {
  const direction = String(value || "NEUTRAL").toUpperCase();
  const labels = {
    UP: "Tăng",
    DOWN: "Giảm",
    NEUTRAL: "Trung tính",
  };
  return labels[direction] || "Trung tính";
}
