import { forwardRef } from "react";
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
        dot="#0f2747"
        error={errors.current_location}
        {...register("current_location", { required: "Required" })}
        placeholder="City, ST"
      />
      <Field
        label="Pickup location"
        dot="#d97706"
        error={errors.pickup_location}
        {...register("pickup_location", { required: "Required" })}
        placeholder="City, ST"
      />
      <Field
        label="Drop-off location"
        dot="#16a34a"
        error={errors.dropoff_location}
        {...register("dropoff_location", { required: "Required" })}
        placeholder="City, ST"
      />
      <Field
        label="Current cycle used (hours)"
        dot="#5b6b80"
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
        <button type="submit" disabled={loading} className="btn-signal flex-1">
          {loading ? "Planning route..." : "Plan trip"}
        </button>
        <button
          type="button"
          onClick={() => reset(EXAMPLE)}
          className="rounded-lg border border-line-strong px-3 py-2.5 font-mono text-xs
                     uppercase tracking-wider text-fg-muted transition
                     hover:border-navy hover:text-navy"
        >
          Example
        </button>
      </div>
    </form>
  );
}

const Field = forwardRef(function Field({ label, error, dot, ...rest }, ref) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-2 font-mono text-[11px] font-600 uppercase tracking-[0.12em] text-fg-soft">
        {dot && (
          <span className="h-2 w-2 rounded-full" style={{ background: dot }} />
        )}
        {label}
      </span>
      <input ref={ref} className="input" {...rest} />
      {error && (
        <span className="mt-1 block font-mono text-[11px] text-stop-restart">
          {error.message}
        </span>
      )}
    </label>
  );
});
