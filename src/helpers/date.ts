export const endMonth = (date: Date) => {
  const newDate = new Date(date);
  return new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0);
};

export const formatDate = (
  date: Date,
  format: "yyyy-mm-dd" | "yyyy/mm/dd" = "yyyy-mm-dd"
) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return format
    .replace("yyyy", year.toString())
    .replace("mm", month.toString().padStart(2, "0"))
    .replace("dd", day.toString().padStart(2, "0"));
};
