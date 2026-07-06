import { Datepicker } from "flowbite-react";

export function DateRangePicker({ startDate, endDate, onRangeChange }) {
  const today = new Date();
  const datepickerTheme = {
    root: {
      input: {
        field: {
          input: {
            base: "block w-full rounded-lg border border-sky-200 bg-sky-50 text-slate-900 focus:border-sky-300 focus:outline-none focus:ring-1 focus:ring-sky-200 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-600 dark:focus:ring-slate-700",
          },
        },
      },
    },
  };

  const handleStartChange = (date) => {
    const nextStartDate = date;
    const nextEndDate = endDate && date && date > endDate ? date : endDate;

    onRangeChange?.({
      startDate: nextStartDate,
      endDate: nextEndDate,
    });
  };

  const handleEndChange = (date) => {
    const nextEndDate = date;
    const nextStartDate = startDate && date && date < startDate ? date : startDate;

    onRangeChange?.({
      startDate: nextStartDate,
      endDate: nextEndDate,
    });
  };

  return (
    <div className="relative z-50 grid gap-4 overflow-visible sm:grid-cols-2">
      <div className="relative z-50 w-full overflow-visible">
        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-700 dark:text-slate-300">
          From
        </span>
        <Datepicker
          theme={datepickerTheme}
          value={startDate || null}
          onChange={handleStartChange}
          maxDate={endDate || today}
          showTodayButton
          placeholder="Select start date"
        />
      </div>

      <div className="relative z-50 w-full overflow-visible">
        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-700 dark:text-slate-300">
          To
        </span>
        <Datepicker
          theme={datepickerTheme}
          value={endDate || null}
          onChange={handleEndChange}
          minDate={startDate || undefined}
          maxDate={new Date()}
          showTodayButton
          placeholder="Select end date"
        />
      </div>
    </div>
  );
}

export default DateRangePicker;