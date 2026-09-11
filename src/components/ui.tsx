import type { ComponentProps } from "react";

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const BEVEL_OUT =
  "shadow-[inset_2px_2px_0_rgba(255,255,255,0.08),inset_-2px_-2px_0_rgba(0,0,0,0.45)]";
const BEVEL_OUT_ACTIVE =
  "active:shadow-[inset_-2px_-2px_0_rgba(255,255,255,0.08),inset_2px_2px_0_rgba(0,0,0,0.45)] active:translate-y-px";
const BEVEL_IN =
  "shadow-[inset_2px_2px_0_rgba(0,0,0,0.5),inset_-2px_-2px_0_rgba(255,255,255,0.06)]";

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label?: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={htmlFor}
          className="text-xs font-bold uppercase tracking-wide text-stone-700"
        >
          {label}
        </label>
      )}
      {children}
      {hint && !error && <p className="text-xs text-stone-500">{hint}</p>}
      {error && <p className="text-xs text-redstone-500">{error}</p>}
    </div>
  );
}

export function Input(props: ComponentProps<"input">) {
  return (
    <input
      {...props}
      className={cx(
        "w-full border-2 border-panda-black bg-stone-100 px-3 py-2 text-sm text-stone-900",
        BEVEL_IN,
        "placeholder:text-stone-500 focus:outline focus:outline-2 focus:outline-gold-400 focus:outline-offset-1",
        props.className
      )}
    />
  );
}

export function Textarea(props: ComponentProps<"textarea">) {
  return (
    <textarea
      {...props}
      className={cx(
        "w-full border-2 border-panda-black bg-stone-100 px-3 py-2 text-sm text-stone-900",
        BEVEL_IN,
        "placeholder:text-stone-500 focus:outline focus:outline-2 focus:outline-gold-400 focus:outline-offset-1",
        props.className
      )}
    />
  );
}

export function Select(props: ComponentProps<"select">) {
  return (
    <select
      {...props}
      className={cx(
        "w-full border-2 border-panda-black bg-stone-100 px-3 py-2 text-sm text-stone-900",
        BEVEL_IN,
        "focus:outline focus:outline-2 focus:outline-gold-400 focus:outline-offset-1",
        props.className
      )}
    />
  );
}

export function Button({
  variant = "primary",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: "primary" | "secondary" | "ghost" }) {
  return (
    <button
      {...props}
      className={cx(
        "inline-flex items-center justify-center gap-2 border-2 px-4 py-2 text-sm font-bold tracking-wide transition disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" &&
          cx(
            "border-bamboo-700 bg-bamboo-600 text-white [text-shadow:1px_1px_0_rgba(0,0,0,0.35)] hover:brightness-110",
            BEVEL_OUT,
            BEVEL_OUT_ACTIVE
          ),
        variant === "secondary" &&
          cx(
            "border-panda-black bg-stone-200 text-stone-900 hover:bg-stone-300",
            BEVEL_OUT,
            BEVEL_OUT_ACTIVE
          ),
        variant === "ghost" && "border-transparent text-stone-700 hover:text-stone-900",
        className
      )}
    />
  );
}

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      {...props}
      className={cx(
        "border-2 border-panda-black bg-stone-100/70 p-6",
        BEVEL_OUT,
        className
      )}
    />
  );
}
