import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
dayjs.locale("pt-br");

export const defaultTimezone = "America/Sao_Paulo";

export const formatDate = (date: string | Date, format = "DD/MM/YYYY") => {
  const parsed = dayjs(date).tz(defaultTimezone);
  
  if (!parsed.isValid()) {
    console.error("Data inválida:", date);
    return "Data inválida";
  }
  
  return parsed.format(format);
};

export const formatDateTime = (date: string | Date) => {
  const parsed = dayjs(date).tz(defaultTimezone);
  
  if (!parsed.isValid()) {
    console.error("Data inválida:", date);
    return "Data/hora inválida";
  }
  
  return parsed.format("DD/MM/YYYY HH:mm");
};

export const formatTime = (date: string | Date) => {
  const parsed = dayjs(date).tz(defaultTimezone);
  
  if (!parsed.isValid()) {
    console.error("Data inválida:", date);
    return "--:--";
  }
  
  return parsed.format("HH:mm");
};

export { dayjs };