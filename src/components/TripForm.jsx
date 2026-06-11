import { useForm } from "react-hook-form";

const EXAMPLE = {
  current_location: "Dallas, TX",
  pickup_location: "Oklahoma City, OK",
  dropoff_location: "Denver, CO",
  current_cycle_used: 10,
};

export default function TripForm({ onSubmit, loading }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      current_location: "",
      pickup_location: "",
      dropoff_location: "",
      current_cycle_used: "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Field
        label="Current location"
        error={errors.current_location}
        {...register("current_location", { required: "Required" })}
        placeholder="City, ST"
      />
      <Field
        label="Pickup location"
        error={errors.pickup_location}
        {...register("pickup_location", { required: "Required" })}
        placeholder="City, ST"
      />
      <Field
        label="Drop-off location"
        error={errors.dropoff_location}
        {...register("dropoff_location", { required: "Required" })}
        placeholder="City, ST"
      />
      <Field
        label="Current cycle used (hours)"
        error={errors.current_cycle_used}
        type="number"
        step="0.25"
        {...register("current_cycle_used", {
          required: "Required",
          min: { value: 0, message: "Must be 0 or more" },
          max: { value: 70, message: "Cannot exceed 70" },
          valueAsNumber: true,
        })}
        placeholder="0 to 70"
      />

      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 rounded-md bg-signal px-4 py-2.5 font-display text-sm font-700
                     uppercase tracking-wide text-ink transition
                     hover:bg-signal-bright disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Planning route..." : "Plan trip"}
        </button>
        <button
          type="button"
          onClick={() => reset(EXAMPLE)}
          className="rounded-md border border-ink-600 px-3 py-2.5 font-mono text-xs
                     uppercase tracking-wider text-ink-500 transition hover:text-paper"
        >
          Example
        </button>
      </div>
    </form>
  );
}

function Field({ label, error, ...rest }) {
  return (
    <label className="block">
      <span className="field-label mb-1.5 block">{label}</span>
      <input className="input" {...rest} />
      {error && (
        <span className="mt-1 block font-mono text-[11px] text-signal-bright">
          {error.message}
        </span>
      )}
    </label>
  );
}
